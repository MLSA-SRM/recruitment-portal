-- Migration: Add custom submission fields for tasks
-- This allows admins to define what inputs applicants need to provide

-- 1. Create submission_fields table
CREATE TABLE IF NOT EXISTS public.submission_fields (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    field_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'textarea', 'file', 'checkbox', 'select', 'number', 'url', 'email')),
    field_label VARCHAR(255) NOT NULL,
    field_description TEXT,
    is_required BOOLEAN DEFAULT false,
    field_options JSONB, -- For select fields, checkbox groups, etc.
    validation_rules JSONB, -- For min/max length, file types, etc.
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add RLS policies for submission_fields
ALTER TABLE public.submission_fields ENABLE ROW LEVEL SECURITY;

-- Admins can manage submission fields
CREATE POLICY "admin_submission_fields_all" ON public.submission_fields
FOR ALL USING (is_admin(auth.uid()));

-- Applicants can read submission fields for tasks they're applying to
CREATE POLICY "applicants_read_submission_fields" ON public.submission_fields
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = submission_fields.task_id
    )
);

-- 3. Create updated_at trigger for submission_fields
CREATE OR REPLACE FUNCTION update_submission_fields_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER submission_fields_updated_at
    BEFORE UPDATE ON public.submission_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_submission_fields_updated_at();

-- 4. Add indexes for performance
CREATE INDEX idx_submission_fields_task_id ON public.submission_fields(task_id);
CREATE INDEX idx_submission_fields_display_order ON public.submission_fields(display_order);

-- 5. Insert some example submission fields for existing tasks (optional)
-- This gives admins a starting point
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, field_options, validation_rules, display_order)
SELECT 
    t.id,
    'project_description',
    'textarea',
    'Project Description',
    'Describe your approach and methodology for this task',
    true,
    '{"placeholder": "Explain your project plan, timeline, and expected outcomes..."}',
    '{"min_length": 100, "max_length": 2000}',
    1
FROM public.tasks t
WHERE t.id IN (
    SELECT id FROM public.tasks LIMIT 5
);

-- 6. Verify the table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'submission_fields'
ORDER BY ordinal_position;

-- 7. Show sample data
SELECT 
    sf.*,
    t.title as task_title
FROM public.submission_fields sf
JOIN public.tasks t ON sf.task_id = t.id
LIMIT 5;
