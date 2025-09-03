interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  content?: string
  size: number
  download_url?: string
}

interface GitHubRepo {
  name: string
  full_name: string
  description: string | null
  language: string | null
  languages: Record<string, number>
  size: number
  created_at: string
  updated_at: string
  default_branch: string
}

interface GitHubRepoResponse {
  name: string
  full_name: string
  description: string | null
  language: string | null
  size: number
  created_at: string
  updated_at: string
  default_branch: string
}

interface GitHubCommit {
  sha: string
  commit: {
    message: string
    author: {
      name: string
      email: string
      date: string
    }
  }
}

class GitHubAnalyzer {
  private token: string
  private baseUrl = 'https://api.github.com'

  constructor(token: string) {
    this.token = token
  }

  private async makeRequest(url: string): Promise<unknown> {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MSA-SRM-Recruitment-Portal'
      }
    })

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async parseGitHubUrl(githubUrl: string): Promise<{ owner: string; repo: string } | null> {
    const regex = /github\.com\/([^\/]+)\/([^\/]+)/
    const match = githubUrl.match(regex)
    
    if (!match) return null
    
    return {
      owner: match[1],
      repo: match[2].replace(/\.git$/, '') // Remove .git suffix if present
    }
  }

  async getRepositoryInfo(owner: string, repo: string): Promise<GitHubRepo> {
    const repoData = await this.makeRequest(`${this.baseUrl}/repos/${owner}/${repo}`) as GitHubRepoResponse
    const languagesData = await this.makeRequest(`${this.baseUrl}/repos/${owner}/${repo}/languages`) as Record<string, number>

    return {
      name: repoData.name,
      full_name: repoData.full_name,
      description: repoData.description || '',
      language: repoData.language || 'Unknown',
      languages: languagesData || {},
      size: repoData.size,
      created_at: repoData.created_at,
      updated_at: repoData.updated_at,
      default_branch: repoData.default_branch
    }
  }

  async getRepositoryContents(owner: string, repo: string, path: string = ''): Promise<GitHubFile[]> {
    const data = await this.makeRequest(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`) as GitHubFile[] | GitHubFile
    return Array.isArray(data) ? data : [data]
  }

  async getFileContent(owner: string, repo: string, path: string): Promise<string | null> {
    try {
      const data = await this.makeRequest(`${this.baseUrl}/repos/${owner}/${repo}/contents/${path}`) as GitHubFile

      if (data.type === 'file' && data.content) {
        // Content is base64 encoded
        return Buffer.from(data.content, 'base64').toString('utf-8')
      }

      return null
    } catch (error) {
      console.error(`Error fetching file content for ${path}:`, error)
      return null
    }
  }

  async getRecentCommits(owner: string, repo: string, limit: number = 10): Promise<GitHubCommit[]> {
    const data = await this.makeRequest(`${this.baseUrl}/repos/${owner}/${repo}/commits?per_page=${limit}`) as GitHubCommit[]
    return data || []
  }

  async analyzeCodebase(githubUrl: string): Promise<{
    repository: GitHubRepo
    structure: GitHubFile[]
    keyFiles: { path: string; content: string; type: string }[]
    commits: GitHubCommit[]
    analysis: {
      totalFiles: number
      codeFiles: number
      documentationFiles: number
      configFiles: number
      primaryLanguages: string[]
      hasReadme: boolean
      hasTests: boolean
      hasDocumentation: boolean
      recentActivity: boolean
    }
  } | null> {
    const parsed = await this.parseGitHubUrl(githubUrl)
    if (!parsed) return null

    try {
      const [repository, rootContents, commits] = await Promise.all([
        this.getRepositoryInfo(parsed.owner, parsed.repo),
        this.getRepositoryContents(parsed.owner, parsed.repo),
        this.getRecentCommits(parsed.owner, parsed.repo, 5)
      ])

      // Get all files recursively (limited to avoid API rate limits)
      const allFiles = await this.getAllFiles(parsed.owner, parsed.repo, rootContents, 0, 2)
      
      // Identify key files to analyze
      const keyFiles = await this.getKeyFiles(parsed.owner, parsed.repo, allFiles)
      
      // Analyze the codebase structure
      const analysis = this.analyzeStructure(allFiles, repository.languages)

      return {
        repository,
        structure: allFiles,
        keyFiles,
        commits,
        analysis
      }
    } catch (error) {
      console.error('Error analyzing codebase:', error)
      return null
    }
  }

  private async getAllFiles(
    owner: string, 
    repo: string, 
    contents: GitHubFile[], 
    depth: number, 
    maxDepth: number
  ): Promise<GitHubFile[]> {
    if (depth >= maxDepth) return contents.filter(item => item.type === 'file')

    const allFiles: GitHubFile[] = []
    
    for (const item of contents) {
      if (item.type === 'file') {
        allFiles.push(item)
      } else if (item.type === 'dir' && depth < maxDepth) {
        try {
          const subContents = await this.getRepositoryContents(owner, repo, item.path)
          const subFiles = await this.getAllFiles(owner, repo, subContents, depth + 1, maxDepth)
          allFiles.push(...subFiles)
        } catch {
          console.warn(`Could not fetch contents of directory: ${item.path}`)
        }
      }
    }
    
    return allFiles
  }

  private async getKeyFiles(owner: string, repo: string, allFiles: GitHubFile[]): Promise<{ path: string; content: string; type: string }[]> {
    const keyFiles: { path: string; content: string; type: string }[] = []
    
    // Priority files to analyze
    const priorityFiles = [
      'README.md',
      'README.txt',
      'package.json',
      'requirements.txt',
      'Dockerfile',
      'docker-compose.yml',
      '.gitignore',
      'LICENSE'
    ]

    // Get priority files
    for (const fileName of priorityFiles) {
      const file = allFiles.find(f => f.name.toLowerCase() === fileName.toLowerCase())
      if (file) {
        const content = await this.getFileContent(owner, repo, file.path)
        if (content) {
          keyFiles.push({
            path: file.path,
            content,
            type: 'config'
          })
        }
      }
    }

    // Get main source files (limited to avoid API limits)
    const sourceFiles = allFiles.filter(f => 
      this.isSourceFile(f.name) && f.size < 50000 // Limit file size
    ).slice(0, 10) // Limit number of files

    for (const file of sourceFiles) {
      const content = await this.getFileContent(owner, repo, file.path)
      if (content) {
        keyFiles.push({
          path: file.path,
          content: content.substring(0, 5000), // Limit content length
          type: 'source'
        })
      }
    }

    return keyFiles
  }

  private isSourceFile(fileName: string): boolean {
    const sourceExtensions = [
      '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
      '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
      '.html', '.css', '.scss', '.sass', '.vue', '.svelte'
    ]
    
    return sourceExtensions.some(ext => fileName.toLowerCase().endsWith(ext))
  }

  private analyzeStructure(files: GitHubFile[], languages: Record<string, number>) {
    const analysis = {
      totalFiles: files.length,
      codeFiles: 0,
      documentationFiles: 0,
      configFiles: 0,
      primaryLanguages: [] as string[],
      hasReadme: false,
      hasTests: false,
      hasDocumentation: false,
      recentActivity: true // We'll assume recent activity if we can fetch data
    }

    // Analyze files
    for (const file of files) {
      const fileName = file.name.toLowerCase()
      const filePath = file.path.toLowerCase()

      if (this.isSourceFile(fileName)) {
        analysis.codeFiles++
      }

      if (fileName.includes('readme') || fileName.includes('doc') || filePath.includes('/docs/')) {
        analysis.documentationFiles++
      }

      if (fileName.includes('config') || fileName.includes('package.json') || fileName.includes('requirements')) {
        analysis.configFiles++
      }

      if (fileName.includes('readme')) {
        analysis.hasReadme = true
      }

      if (filePath.includes('test') || filePath.includes('spec')) {
        analysis.hasTests = true
      }

      if (filePath.includes('/docs/') || fileName.includes('documentation')) {
        analysis.hasDocumentation = true
      }
    }

    // Get primary languages
    const sortedLanguages = Object.entries(languages)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([lang]) => lang)
    
    analysis.primaryLanguages = sortedLanguages

    return analysis
  }
}

export { GitHubAnalyzer }
export type { GitHubRepo, GitHubFile, GitHubCommit }
