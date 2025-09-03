-- Sample data for the recruitment portal
-- Run this after creating the tables with schema.sql

-- Insert sample tasks
INSERT INTO public.tasks (title, description, domain, subdomain, target_year) VALUES
(
  'Build a Portfolio Website',
  'Create a responsive personal portfolio website showcasing your skills and projects. Use modern web technologies and ensure it works well on all devices.',
  'Technical',
  'Web Development',
  1
),
(
  'Design a Mobile App Interface',
  'Design a user interface for a mobile app. Focus on user experience, modern design principles, and accessibility. Submit as Figma link or design mockups.',
  'Creatives',
  'UI/UX Design',
  2
),
(
  'Write a Sponsorship Proposal',
  'Draft a professional sponsorship proposal for a tech event. Include event details, sponsorship tiers, benefits, and contact information.',
  'Corporate',
  'Business Development',
  1
),
(
  'Create a Data Visualization Dashboard',
  'Build an interactive dashboard that visualizes data. Use any frontend framework and include charts, graphs, and filtering capabilities.',
  'Technical',
  'Data Science',
  2
),
(
  'Design Event Marketing Materials',
  'Create marketing materials for a university tech event including posters, social media graphics, and promotional content.',
  'Creatives',
  'Graphic Design',
  1
),
(
  'Develop a REST API',
  'Build a RESTful API with proper documentation, error handling, and authentication. Include at least 3 endpoints with CRUD operations.',
  'Technical',
  'Backend Development',
  2
),
(
  'Write Technical Blog Post',
  'Write a comprehensive blog post about a technical topic. Include code examples, explanations, and practical use cases.',
  'Corporate',
  'Content Writing',
  1
),
(
  'Create a Game Concept',
  'Design a game concept with mechanics, story, and visual style. Include concept art, game mechanics description, and target audience.',
  'Creatives',
  'Game Design',
  2
);

-- Note: You'll need to create user accounts through Supabase Auth first
-- Then you can manually insert profile data or use the profile setup page
