-- Add settings column to problem_statements table to store enhanced task configuration
ALTER TABLE public.problem_statements 
ADD COLUMN settings JSONB DEFAULT '{}';

-- Add index for better performance when querying settings
CREATE INDEX IF NOT EXISTS idx_problem_statements_settings ON public.problem_statements USING GIN (settings);

-- Update existing records to have default settings
UPDATE public.problem_statements 
SET settings = '{
  "priority": "medium",
  "allowLateSubmissions": true,
  "autoFeedback": false,
  "requiresApproval": true,
  "submissionFormFields": [
    {
      "id": "github_link",
      "type": "github_link",
      "label": "GitHub Repository Link",
      "placeholder": "https://github.com/username/repository",
      "required": false,
      "enabled": true,
      "helpText": "Link to your GitHub repository containing the source code"
    },
    {
      "id": "deployed_link",
      "type": "deployed_link",
      "label": "Deployed Application Link",
      "placeholder": "https://your-app.vercel.app",
      "required": false,
      "enabled": true,
      "helpText": "Link to your live deployed application"
    },
    {
      "id": "video_file",
      "type": "video_file",
      "label": "Demo Video",
      "required": false,
      "enabled": true,
      "helpText": "Upload a video demonstration of your solution",
      "fileTypes": ["mp4", "mov", "avi", "webm"],
      "maxSize": 50
    },
    {
      "id": "document_file",
      "type": "document_file",
      "label": "Documentation",
      "required": false,
      "enabled": true,
      "helpText": "Upload documentation or additional files",
      "fileTypes": ["pdf", "doc", "docx", "txt", "md"],
      "maxSize": 10
    },
    {
      "id": "description",
      "type": "description",
      "label": "Project Description",
      "placeholder": "Describe your solution, approach, and key features...",
      "required": true,
      "enabled": true,
      "helpText": "Provide a detailed description of your solution"
    }
  ]
}'::jsonb
WHERE settings = '{}' OR settings IS NULL;
