# Club Recruitment Portal

A streamlined club recruitment platform built with Next.js, Supabase, and Google Gemini AI. The platform manages task submissions from applicants and uses AI to automatically review and score them to assist admins in the shortlisting process.

## Features

### For Applicants
- Browse available positions by domain and year
- Submit GitHub repositories, design portfolios, or written content
- Receive instant AI-powered feedback on submissions
- Track application status (pending, shortlisted, rejected)
- Personal dashboard to view all submissions

### For Admins
- Create and manage recruitment tasks
- View all submissions with AI-generated scores and reviews
- Filter applications by year, domain, subdomain, and status
- Shortlist or reject applicants
- Export shortlisted candidates as CSV
- Comprehensive dashboard with real-time updates

### AI Integration
- **Technical Domain**: Analyzes GitHub repositories for code quality, functionality, and best practices
- **Corporate Domain**: Reviews written content for clarity, professional tone, and creativity
- **Year-based Evaluation**: Different criteria for 1st and 2nd year students
- **Automated Scoring**: 0-1000 point scale with detailed feedback

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend & DB**: Supabase (PostgreSQL, Auth)
- **AI**: Google Gemini (via `@google/generative-ai` SDK)
- **Additional Libraries**: Octokit (GitHub API), Cheerio (web scraping), PapaParse (CSV)

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account and project
- Google AI API key (Gemini)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd recruitment-portal
npm install
```

### 2. Environment Configuration

Copy the example environment file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Fill in the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_personal_access_token
```

### 3. Supabase Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase/schema.sql`
4. Execute the SQL to create tables and policies

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Schema

### Tables

- **`profiles`**: User profile information (linked to Supabase Auth)
- **`tasks`**: Recruitment tasks created by admins
- **`submissions`**: Applicant submissions with AI scores and reviews

### Row Level Security (RLS)

- Users can only read/update their own profiles
- Users can only view their own submissions
- Admins have access to all data for management purposes

## Usage

### Applicant Flow

1. **Sign Up/In**: Create account or sign in with existing credentials
2. **Complete Profile**: Fill in personal details, department, and year
3. **Browse Tasks**: View available positions by domain and year
4. **Submit Application**: Provide GitHub repo URL or document link
5. **Track Progress**: Monitor application status and view AI feedback

### Admin Flow

1. **Access Dashboard**: Navigate to `/admin/dashboard`
2. **Create Tasks**: Add new recruitment positions with requirements
3. **Review Submissions**: View AI-generated scores and detailed feedback
4. **Make Decisions**: Shortlist or reject candidates based on AI review
5. **Export Results**: Download CSV of shortlisted applicants

## AI Review Process

### Technical Submissions
- Fetches code from GitHub repositories
- Analyzes code quality, structure, and functionality
- Evaluates use of modern practices and frameworks
- Provides constructive feedback for improvement

### Corporate Submissions
- Scrapes content from public documents
- Assesses clarity, professional tone, and creativity
- Evaluates structure and formatting
- Offers suggestions for enhancement

### Scoring System
- **0-1000 point scale**
- **Year-specific criteria**: 1st year students are evaluated more leniently
- **Domain-specific weights**: Different emphasis based on submission type
- **Detailed feedback**: Markdown-formatted review with specific recommendations

## API Endpoints

- `POST /api/submit` - Submit application
- `PUT /api/submissions/:id/status` - Update submission status
- `GET /api/admin/export` - Export shortlisted candidates

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

- Ensure environment variables are properly set
- Configure build command: `npm run build`
- Set start command: `npm start`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the GitHub repository or contact the development team.

## Roadmap

- [ ] Email notifications for status updates
- [ ] Advanced filtering and search capabilities
- [ ] Bulk operations for admins
- [ ] Analytics dashboard
- [ ] Mobile app
- [ ] Integration with other AI providers
