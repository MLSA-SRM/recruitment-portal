# MLSA SRM Recruitment Portal

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-007ACC?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-000000?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**AI-Powered Club Recruitment Platform**

*Streamlining club recruitment with intelligent automation and seamless user experience*

---

</div>

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [AI Integration](#ai-integration)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

---

## Features

### For Applicants
- Smart task discovery with filtering by domain, subdomain, and target year
- Flexible submission options including GitHub repositories, portfolios, and written content
- Instant AI-powered feedback and scoring on submissions
- Real-time progress tracking of application status
- Personal dashboard for viewing all submissions and feedback

### For Admins
- Task management with customizable recruitment positions
- AI-assisted review system with automated scoring and detailed feedback
- Advanced filtering capabilities by year, domain, status, and scores
- Analytics dashboard with real-time insights and statistics
- Bulk export functionality for shortlisted candidates as CSV
- Real-time notifications for new submissions

### Security & Privacy
- Row Level Security (RLS) for database-level access control
- Role-based access control with separate permissions for applicants and admins
- Secure authentication integration with Supabase Auth
- Encrypted data storage and transmission

---

## Tech Stack

<div align="center">

### Core Framework
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

### Styling & UI
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Shadcn/ui](https://img.shields.io/badge/Shadcn%2Fui-000000?style=for-the-badge&logo=shadcn&logoColor=white)

### Backend & Database
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)

### AI & APIs
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)

### Development Tools
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=white)

</div>

### Key Dependencies
- Framework: Next.js 15+ (App Router)
- Language: TypeScript 5.0+
- Styling: Tailwind CSS 3.0+
- UI Components: Shadcn/ui
- Backend & Database: Supabase (PostgreSQL, Auth, RLS)
- AI: Google Gemini 1.0+ (via @google/generative-ai)
- APIs: Octokit (GitHub), Cheerio (web scraping)
- Utilities: PapaParse (CSV), Lucide React (icons)

---

## Quick Start

### Prerequisites

| Requirement | Version | Description |
|-------------|---------|-------------|
| Node.js | 18+ | JavaScript runtime |
| npm | 9+ | Package manager |
| Supabase | Latest | Database & Auth |
| Google AI | Latest | Gemini API access |

### Installation

1. Clone the repository
   ```
   git clone https://github.com/MLSA-SRM/recruitment-portal.git
cd recruitment-portal
   ```

2. Install dependencies
   ```
npm install
```

3. Environment Setup
   ```
cp .env.local.example .env.local
```

   Configure your environment variables:
   ```
   # Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # AI & External APIs
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_personal_access_token

   # Optional: Analytics, Monitoring, etc.
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. Database Setup
   ```
   # Run Supabase migrations
   npx supabase db push
   ```

5. Start Development Server
   ```
npm run dev
```

   Your app will be available at http://localhost:3000

### Development Commands

```
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks

# Database
npm run db:push      # Push schema changes
npm run db:reset     # Reset database
npm run db:seed      # Seed with sample data
```

---

## Project Structure

```
recruitment-portal/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── admin/          # Admin dashboard pages
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── dashboard/      # User dashboard
│   │   └── profile/        # Profile management
│   ├── components/         # Reusable React components
│   │   ├── ui/            # Shadcn/ui components
│   │   └── admin/         # Admin-specific components
│   └── lib/               # Utility functions & configurations
│       ├── supabase/      # Database client & middleware
│       └── types/         # TypeScript type definitions
├── supabase/              # Database migrations & config
├── public/                # Static assets
└── Configuration files    # package.json, tsconfig.json, etc.
```

---

## Usage

### For Applicants

| Step | Action | Description |
|------|--------|-------------|
| 1 | Sign Up/Login | Create account with email or sign in |
| 2 | Complete Profile | Fill personal details, department, year |
| 3 | Browse Tasks | Filter by domain, subdomain, target year |
| 4 | Submit Application | Upload GitHub repo or document link |
| 5 | Track Progress | Monitor status & view AI feedback |

### For Admins

| Step | Action | Description |
|------|--------|-------------|
| 1 | Access Dashboard | Navigate to `/admin/dashboard` |
| 2 | Create Tasks | Define positions with custom requirements |
| 3 | Review Submissions | View AI scores & detailed feedback |
| 4 | Make Decisions | Shortlist/reject based on AI review |
| 5 | Export Results | Download CSV of shortlisted candidates |

---

## AI Integration

### Intelligent Review System

| Submission Type | Analysis Focus | Key Metrics |
|----------------|----------------|-------------|
| Technical | Code quality, structure, functionality | Best practices, frameworks, architecture |
| Corporate | Clarity, tone, creativity | Professional writing, structure, formatting |
| Creative | Innovation, design, presentation | Originality, aesthetics, user experience |

### AI Review Process

#### Technical Submissions
- Code Quality Analysis: Modern practices, frameworks, architecture
- Functionality Assessment: Working features, error handling
- Documentation Review: README, comments, API docs
- Security Evaluation: Vulnerabilities, best practices

#### Corporate Submissions
- Content Analysis: Clarity, professional tone, structure
- Formatting Review: Organization, readability, presentation
- Creativity Assessment: Innovation, engagement, uniqueness

#### Scoring Algorithm
Dynamic scoring based on multiple factors:
- Technical Proficiency: 40% weight
- Code Quality: 30% weight
- Documentation: 15% weight
- Innovation: 15% weight

| Score Range | Performance Level | Action Required |
|-------------|-------------------|----------------|
| 900-1000 | Exceptional | Immediate shortlist |
| 800-899 | Excellent | Strong candidate |
| 700-799 | Good | Review required |
| 600-699 | Average | May need improvement |
| < 600 | Below Average | Requires significant work |

---

## Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| profiles | User information | id, name, email, department, year, is_admin |
| tasks | Recruitment positions | id, title, description, domain, deadline, created_by |
| submissions | User applications | id, task_id, applicant_id, submission_url, status, ai_score |

### Security Model

| Policy Type | Scope | Permissions |
|-------------|-------|-------------|
| User Profiles | Own data only | Read, Update |
| Submissions | Own submissions | Read, Create |
| Tasks | All users | Read |
| Admin Access | All data | Full CRUD |

---

## API Reference

### Core Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | /api/submissions | Submit application | Authenticated users |
| GET | /api/submissions/:id | Get submission details | Owner/Admin |
| PUT | /api/submissions/:id/status | Update status | Admin only |
| GET | /api/tasks | List available tasks | All users |
| POST | /api/tasks | Create new task | Admin only |
| GET | /api/admin/export | Export candidates CSV | Admin only |
| POST | /api/submissions/:id/trigger-ai | Trigger AI review | Admin only |

### Authentication
- Bearer Token: Supabase JWT in Authorization header
- Session-based: Automatic via Supabase client
- Role-based: Admin endpoints require is_admin: true

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

- Ensure environment variables are properly set
- Configure build command: npm run build
- Set start command: npm start

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write clear, concise commit messages
- Add tests for new features
- Update documentation as needed
- Ensure code passes linting and type checking

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email contact@example.com or join our Slack channel.

## Roadmap

### Planned Features

- Email notifications for status updates
- Advanced filtering and search capabilities
- Bulk operations for admins
- Analytics dashboard
- Mobile app development
- Integration with additional AI providers

### Recent Updates

- Enhanced security with admin role restrictions
- Improved AI scoring algorithm
- Better user interface and experience
- Comprehensive build and deployment setup
