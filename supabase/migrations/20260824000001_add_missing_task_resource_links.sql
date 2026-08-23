-- Migration: Attach starter resource links to tasks that promised material
-- ("we'll hand/give you...") but never actually linked it. Affects Fix This
-- Broken UI, Optimize This Slow Endpoint, RAG Mini Q&A Bot, and Messy
-- Dataset, Baseline Model.
-- Created: 2026-08-24

UPDATE public.tasks
SET requirements = 'Starter repo: https://github.com/MLSA-SRM/recruit-task-fix-broken-ui — clone this and start from it.

' || requirements
WHERE title = 'Fix This Broken UI';

UPDATE public.tasks
SET requirements = 'Starter repo: https://github.com/MLSA-SRM/recruit-task-slow-endpoint — clone this and start from it.

' || requirements
WHERE title = 'Optimize This Slow Endpoint';

UPDATE public.tasks
SET requirements = 'Starter documents: https://github.com/MLSA-SRM/recruit-task-rag-docs — the document set to build retrieval over.

' || requirements
WHERE title = 'RAG Mini Q&A Bot';

UPDATE public.tasks
SET requirements = 'Starter dataset: https://github.com/MLSA-SRM/recruit-task-messy-dataset — the CSV file is in this repo.

' || requirements
WHERE title = 'Messy Dataset, Baseline Model';
