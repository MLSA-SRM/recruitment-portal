# MSA SRM Recruitment Portal

A comprehensive full-stack task submission and management platform designed for Microsoft Student Ambassadors SRM. The platform features advanced task management capabilities, dynamic submission forms, AI-powered feedback generation, and a modern glassmorphic user interface.

## Overview

The MSA SRM Recruitment Portal is an enterprise-grade application that streamlines the recruitment process for student organizations. It provides administrators with powerful tools to create, manage, and evaluate tasks while offering participants an intuitive interface for task submission and progress tracking.

## Architecture

### Technology Stack

**Frontend Framework**
- Next.js 15 with App Router architecture
- TypeScript for type-safe development
- Tailwind CSS for utility-first styling
- shadcn/ui component library for accessibility
- Framer Motion for smooth animations

**Backend Infrastructure**
- Supabase Backend-as-a-Service
- PostgreSQL database with Row Level Security
- Real-time subscriptions and updates
- Secure file storage with CDN delivery
- Authentication and user management

**AI Integration**
- Google Gemini API for intelligent feedback generation
- Automated plagiarism detection
- Comprehensive task evaluation
- Content analysis and scoring

**Development Tools**
- ESLint and Prettier for code quality
- TypeScript strict mode
- Supabase CLI for database management
- Git version control with conventional commits

## Core Features

### Authentication System

**Secure User Registration**
- Email domain validation restricted to SRM university domains
- Password strength requirements and validation
- Email verification workflow
- Comprehensive profile setup process

**Access Control**
- Role-based authentication (Participant/Administrator)
- Protected routes with middleware
- Session management and automatic token refresh
- Secure logout and session cleanup

### Enhanced Task Management System

**Advanced Task Creation**
- Multi-tab interface for comprehensive task configuration
- Basic information setup (title, domain, description, requirements)
- Advanced settings (priority levels, deadlines, submission rules)
- Custom form builder for submission requirements
- Real-time preview of participant experience

**Priority Management**
- Four priority levels: Low, Medium, High, Urgent
- Visual priority indicators with color coding
- Deadline management with timezone support
- Late submission policy configuration

**Dynamic Form Builder**
- Enable/disable standard submission fields
- Add custom text input fields
- Add custom file upload fields
- Configure field validation rules
- Set required/optional field status
- Customize field labels and help text
- File type restrictions and size limits

**Real-time Preview System**
- Live preview of submission forms as participants see them
- Interactive form testing capabilities
- Validation preview and error handling
- Mobile and desktop layout previews

### Intelligent Submission System

**Dynamic Form Generation**
- Forms adapt automatically to task configuration
- Context-aware field validation
- Smart file upload handling
- Deadline awareness and submission controls

**File Management**
- Support for multiple file types (documents, videos, images)
- Configurable file size limits per field
- Secure cloud storage with CDN delivery
- File type validation and sanitization

**Submission Tracking**
- Real-time submission status updates
- Version history and update tracking
- Automatic backup and recovery
- Duplicate submission prevention

### AI-Powered Evaluation

**Intelligent Feedback Generation**
- Comprehensive technical assessment
- Creative and strategic evaluation
- Detailed scoring with explanations
- Actionable improvement suggestions

**Plagiarism Detection**
- Advanced similarity analysis
- Code and content originality verification
- Reference source identification
- Detailed plagiarism reports

**Automated Scoring**
- Multi-criteria evaluation framework
- Weighted scoring based on task requirements
- Comparative analysis across submissions
- Performance benchmarking

### Administrative Dashboard

**Comprehensive Analytics**
- User registration statistics
- Submission tracking and metrics
- Domain-wise participation analysis
- Performance trends and insights

**Submission Management**
- Advanced filtering and search capabilities
- Bulk status updates
- Feedback sharing controls
- Export functionality for reports

**User Management**
- Participant profile administration
- Access control and permissions
- Activity monitoring and logging
- Support ticket management

### Participant Experience

**Intuitive Dashboard**
- Clean, modern interface design
- Task discovery and browsing
- Progress tracking and status updates
- Personal performance analytics

**Submission Interface**
- Guided submission process
- Real-time validation feedback
- File upload progress tracking
- Submission confirmation and receipts

**Feedback System**
- Detailed evaluation reports
- Performance scoring and ranking
- Improvement recommendations
- Historical feedback access

## Database Schema

### Core Tables

**profiles**
- Extended user information beyond authentication
- Department and domain preferences
- Contact information and academic details
- Timestamps for registration tracking

**problem_statements**
- Task definitions and requirements
- Domain and subdomain categorization
- Enhanced settings configuration (JSONB)
- Active/inactive status management

**submissions**
- Participant task submissions
- File references and metadata
- Status tracking (pending/shortlisted/rejected)
- Unique constraints per user-task combination

**feedback**
- AI-generated evaluations and scores
- Feedback type classification
- Sharing permissions and visibility
- Detailed assessment criteria

### Advanced Features

**Row Level Security**
- Database-level access control
- User-specific data isolation
- Admin privilege escalation
- Secure multi-tenant architecture

**Optimized Performance**
- Strategic indexing for fast queries
- Connection pooling and caching
- Efficient JOIN operations
- Real-time subscription optimization

## Installation and Setup

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn package manager
- Supabase account and project
- Google AI Studio account for Gemini API
- Git for version control

### Environment Configuration

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
```

### Database Setup

1. **Initialize Supabase Project**
```bash
   npx supabase init
   npx supabase login
   npx supabase link --project-ref your-project-ref
   ```

2. **Apply Database Migrations**
   ```bash
npx supabase db push
   ```

3. **Seed Sample Data (Optional)**
   ```bash
npx supabase db seed
```

### Application Deployment

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Run Development Server**
```bash
npm run dev
```

3. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Configuration Management

### Domain Configuration

The application supports multiple organizational domains. Configure available domains in `src/lib/constants/domains.ts`:

**Technical Domains**
- Artificial Intelligence and Machine Learning
- Web Development and Engineering
- Mobile Application Development
- Cloud Computing and DevOps

**Corporate Domains**
- Sponsorship and Partnership Management
- Event Planning and Logistics
- Public Relations and Outreach
- Team Operations and Management
- Content Creation and Writing

**Creative Domains**
- Graphic Design and Branding
- Video Production and Motion Graphics
- User Experience and Interface Design
- Digital Marketing and Social Media

### Theme Customization

The application uses a modern glassmorphic design system with neon accents. Customize the theme in `src/app/globals.css`:

**Color Variables**
- Primary: Cyan blue for primary actions
- Secondary: Electric purple for secondary elements
- Accent: Neon pink for highlights and notifications
- Background: Dark gray with transparency support

**Visual Effects**
- Glassmorphism cards with backdrop blur
- Neon glow effects on interactive elements
- Smooth transitions and micro-interactions
- Responsive design with mobile-first approach

## API Documentation

### Task Management API

**Create Task**
```http
POST /api/admin/problem-statements
Content-Type: application/json

{
  "title": "Task Title",
  "description": "Detailed task description",
  "domain": "Technical",
  "sub_domain": "Web Development",
  "requirements": ["Requirement 1", "Requirement 2"],
  "is_active": true,
  "settings": {
    "priority": "high",
    "submissionDeadline": "2024-12-31T23:59:59Z",
    "allowLateSubmissions": false,
    "requiresApproval": true,
    "submissionFormFields": [...]
  }
}
```

**Update Task**
```http
PATCH /api/admin/problem-statements/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "settings": {
    "priority": "urgent"
  }
}
```

### AI Feedback API

**Generate Feedback**
```http
POST /api/ai-feedback
Content-Type: application/json

{
  "submissionId": "uuid-string",
  "type": "evaluation"
}
```

**Plagiarism Check**
```http
POST /api/ai-feedback
Content-Type: application/json

{
  "submissionId": "uuid-string",
  "type": "plagiarism_check"
}
```

### Submission Management API

**Update Submission Status**
```http
PATCH /api/submissions/:id
Content-Type: application/json

{
  "status": "shortlisted",
  "feedback_shared": true
}
```

## Security Implementation

### Authentication Security

- JWT token-based authentication with automatic refresh
- Secure password hashing using bcrypt
- Email verification and account activation
- Session timeout and automatic logout

### Data Protection

- Row Level Security policies for data isolation
- Input validation and sanitization
- SQL injection prevention
- XSS protection with content security policies

### File Upload Security

- File type validation and restrictions
- File size limits and monitoring
- Malware scanning integration
- Secure file storage with access controls

### API Security

- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Request validation with Zod schemas
- Error handling without information disclosure

## Performance Optimization

### Frontend Optimization

- Code splitting and lazy loading
- Image optimization with Next.js Image component
- Bundle size analysis and optimization
- Client-side caching strategies

### Database Optimization

- Efficient query patterns and indexing
- Connection pooling and management
- Real-time subscription optimization
- Caching layer implementation

### Infrastructure Optimization

- CDN integration for static assets
- Serverless function optimization
- Edge computing for global performance
- Monitoring and alerting systems

## Deployment Strategies

### Production Deployment

**Vercel Platform (Recommended)**
1. Connect GitHub repository to Vercel
2. Configure environment variables in dashboard
3. Enable automatic deployments on main branch
4. Set up custom domain and SSL certificates

**Self-Hosted Deployment**
1. Set up production server with Node.js
2. Configure reverse proxy with Nginx
3. Set up SSL certificates with Let's Encrypt
4. Configure monitoring and logging

### Staging Environment

1. Create separate Supabase project for staging
2. Configure staging-specific environment variables
3. Set up automated testing pipeline
4. Implement feature flag management

## Monitoring and Analytics

### Application Monitoring

- Real-time error tracking and alerting
- Performance monitoring and optimization
- User behavior analytics
- API usage and rate limiting metrics

### Business Analytics

- User registration and engagement metrics
- Task completion rates and performance
- AI feedback usage and effectiveness
- Administrative efficiency measurements

## Maintenance and Support

### Regular Maintenance Tasks

- Database backup and recovery procedures
- Security updates and patch management
- Performance monitoring and optimization
- User support and issue resolution

### Troubleshooting Guide

**Common Issues**
1. Authentication failures - Check domain restrictions and email verification
2. File upload errors - Verify file size limits and type restrictions
3. AI API failures - Validate API keys and quota limits
4. Database connection issues - Check environment variables and network connectivity

**Debugging Tools**
- Browser developer tools for frontend issues
- Supabase dashboard for database monitoring
- Server logs for backend error tracking
- Performance profiling tools for optimization

## Contributing Guidelines

### Development Workflow

1. Fork the repository and create feature branch
2. Follow conventional commit message format
3. Implement comprehensive test coverage
4. Update documentation for new features
5. Submit pull request with detailed description

### Code Standards

- TypeScript strict mode enforcement
- ESLint and Prettier configuration compliance
- Component documentation with JSDoc
- Accessibility standards (WCAG 2.1) compliance

### Testing Requirements

- Unit tests for utility functions
- Integration tests for API endpoints
- End-to-end tests for critical user flows
- Performance testing for optimization

## License and Legal

This project is licensed under the MIT License. See the LICENSE file for detailed terms and conditions.

### Third-Party Licenses

- Next.js - MIT License
- Supabase - Apache 2.0 License
- Tailwind CSS - MIT License
- shadcn/ui - MIT License

