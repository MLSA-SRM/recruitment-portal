-- Add result_released column to submissions table
-- This field tracks whether the admin has released the results to users

ALTER TABLE submissions ADD COLUMN result_released BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX idx_submissions_result_released ON submissions(result_released);

-- Add comment to column for documentation
COMMENT ON COLUMN submissions.result_released IS 'Flag to indicate whether the submission result (Accept/Reject) has been released to the user';
