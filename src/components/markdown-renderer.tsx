'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // Normalize line endings and clean up content
  const normalizedContent = content
    .replace(/\r\n/g, '\n')  // Convert Windows line endings to Unix
    .replace(/\r/g, '\n')    // Convert Mac line endings to Unix
    .trim()

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Customize heading styles
          h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-3">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-gray-800 mb-2">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-medium text-gray-700 mb-2">{children}</h3>,
          
          // Customize list styles with more robust CSS
          ul: ({ children }) => (
            <ul className="list-disc list-outside space-y-1 mb-3 pl-6" style={{ listStylePosition: 'outside' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside space-y-1 mb-3 pl-6" style={{ listStylePosition: 'outside' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 leading-relaxed" style={{ display: 'list-item', listStylePosition: 'outside' }}>
              {children}
            </li>
          ),
          
          // Customize paragraph styles
          p: ({ children }) => <p className="text-gray-700 mb-3 leading-relaxed">{children}</p>,
          
          // Customize code styles
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-gray-800">{children}</code>
            }
            return <code className={className}>{children}</code>
          },
          
          // Customize blockquote styles
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-200 pl-4 py-2 bg-blue-50 text-gray-700 italic mb-3">
              {children}
            </blockquote>
          ),
          
          // Customize link styles
          a: ({ children, href }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              {children}
            </a>
          ),
          
          // Customize table styles
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border border-gray-200 rounded-lg">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          tbody: ({ children }) => <tbody className="bg-white">{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-gray-200">{children}</tr>,
          th: ({ children }) => <th className="px-4 py-2 text-left text-sm font-medium text-gray-900">{children}</th>,
          td: ({ children }) => <td className="px-4 py-2 text-sm text-gray-700">{children}</td>,
        }}
      >
        {normalizedContent}
      </ReactMarkdown>
    </div>
  )
}
