-- Seed file for recruitment portal
-- This file contains sample data for testing

-- Note: This is for development/testing purposes only
-- In production, real user data will be created through the application

-- Sample admin user profile (will be created after auth signup)
-- Email: admin@admin.srm.edu.in
-- This user will have admin privileges based on email pattern

-- Additional problem statements for variety
INSERT INTO public.problem_statements (title, description, domain, sub_domain, requirements, is_active) VALUES
(
  'Blockchain-based Voting System',
  'Develop a secure, transparent voting system using blockchain technology for student elections.',
  'Technical',
  'Web Development',
  ARRAY[
    'Implement blockchain voting mechanism',
    'Create secure user authentication',
    'Design intuitive voting interface',
    'Include vote verification and audit trail'
  ],
  true
),
(
  'Corporate Partnership Proposal',
  'Create a comprehensive partnership proposal for a Fortune 500 company to sponsor SRM MSA events.',
  'Corporate',
  'Sponsorships',
  ARRAY[
    'Research target company and alignment',
    'Create compelling value proposition',
    'Design professional presentation deck',
    'Include ROI analysis and success metrics'
  ],
  true
),
(
  'Social Media Content Strategy',
  'Develop a 3-month content strategy for SRM MSA social media channels to increase engagement and reach.',
  'Corporate',
  'Content Writing',
  ARRAY[
    'Analyze current social media performance',
    'Create content calendar with themes',
    'Design engagement strategies',
    'Include analytics and measurement plan'
  ],
  true
),
(
  'Interactive Data Visualization',
  'Create an interactive dashboard that visualizes student performance and engagement data.',
  'Creatives',
  'Graphic Design',
  ARRAY[
    'Design intuitive data visualization',
    'Implement interactive elements',
    'Create responsive design system',
    'Include accessibility considerations'
  ],
  true
),
(
  'Machine Learning Model Deployment',
  'Build and deploy a machine learning model that predicts student success based on engagement metrics.',
  'Technical',
  'AI/ML',
  ARRAY[
    'Collect and preprocess training data',
    'Train and validate ML model',
    'Create API for model predictions',
    'Deploy with monitoring and logging'
  ],
  true
),
(
  'Team Operations Optimization',
  'Design a comprehensive system to streamline team operations, communication, and project management.',
  'Corporate',
  'Team Operations',
  ARRAY[
    'Analyze current operational bottlenecks',
    'Design workflow optimization strategy',
    'Create team communication protocols',
    'Include performance tracking metrics'
  ],
  true
);

-- Sample leaderboard entries (will be populated as users get shortlisted)
-- These are placeholder entries for demonstration
-- INSERT INTO public.leaderboard (user_id, score, domain, sub_domain) VALUES
-- (uuid_generate_v4(), 95, 'Technical', 'AI/ML'),
-- (uuid_generate_v4(), 88, 'Corporate', 'Sponsorships'),
-- (uuid_generate_v4(), 92, 'Creatives', 'UI/UX Design');
