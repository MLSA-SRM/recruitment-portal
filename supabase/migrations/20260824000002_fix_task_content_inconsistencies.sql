-- Migration: Fix content inconsistencies found in a full task-by-task audit.
--
--  A. Corporate tasks referenced a "Task 2" whose question existed only in the
--     submission form, never on the task page. Surfaced it, and renamed
--     Task 1/Task 2 to Part 1/Part 2 so one task clearly means one submission.
--  B. Every Technical task told applicants to add an unnamed "recruitment
--     GitHub account" as a collaborator on private repos. That account does not
--     exist, and a private repo silently breaks the AI review (the fetch 404s
--     and the review runs on empty content). Public repos only now.
--  C. "Optimize This Slow Endpoint" described a starter that did not match the
--     one actually published (offered Python/SQLite/Postgres variants that
--     don't exist, and promised a possible missing-index bug when the starter
--     is N+1).
--  D. "Messy Dataset" allowed a Colab notebook in its deliverables but the
--     submission field accepted only a GitHub repo.
--  E. "Rewriting an Event Announcement" capped answers at 200 words while its
--     Part C alone requires 150-200 words.
--  F. "One Event, Two Moods" dropped the write-up questions from the source
--     brief; they survived only in the submission field.
--
-- Created: 2026-08-24

-- ---------------------------------------------------------------------------
-- A. Corporate: surface the reflection part on the task page itself
-- ---------------------------------------------------------------------------

UPDATE public.tasks
SET requirements = replace(requirements, 'Task 1:', 'Part 1:')
  || E'\r\n\r\nPart 2 - Reflection (the same question for every Corporate subdomain): In 3-4 sentences, describe one specific time - in a club, class project, internship, or personal project - where your plan didn''t work and you had to adapt on the spot. What did you change, and why?\r\n\r\nPart 1 and Part 2 together make up this one task, submitted once.'
WHERE domain = 'Corporate';

UPDATE public.tasks
SET deliverables = 'Written answers to Part 1 and Part 2, via the submission form fields below.'
WHERE domain = 'Corporate' AND title <> 'Rewriting an Event Announcement';

UPDATE public.tasks
SET deliverables = 'Written answers to Part 1 (A, B, and C) and Part 2, via the submission form fields below.'
WHERE title = 'Rewriting an Event Announcement';

UPDATE public.submission_fields
SET field_label = replace(field_label, 'Task 1 -', 'Part 1 -')
WHERE field_name = 'task1_answer';

UPDATE public.submission_fields
SET field_label = 'Part 2 - Reflection'
WHERE field_name = 'task2_reflection';

-- ---------------------------------------------------------------------------
-- B. Technical: public repositories only
-- ---------------------------------------------------------------------------

UPDATE public.submission_fields
SET field_description = 'Must be a public repository so we can review it.'
WHERE field_name = 'github_link';

-- ---------------------------------------------------------------------------
-- C. Optimize This Slow Endpoint: match the starter that actually ships
-- ---------------------------------------------------------------------------

UPDATE public.tasks
SET description = 'We''ll hand you a small, working API with one endpoint that''s deliberately slow. Profile it, find the actual cause, fix it, and write down the before and after numbers.',
    requirements = E'Starter repo: https://github.com/MLSA-SRM/recruit-task-slow-endpoint - clone this and start from it.\r\n\r\nNode 18 or newer, and nothing else. Run it with `npm install` then `npm start`; there is no database to provision, the starter ships with a data layer that simulates realistic query latency. The endpoint already returns a `durationMs` field, so you can measure the before and after without any profiling tools.\r\n\r\nResources: The N+1 query problem, explained https://planetscale.com/blog/what-is-n-1-query-problem-and-how-to-solve-it | Node performance measurement https://nodejs.org/api/perf_hooks.html\r\n\r\nIf you''re a 2nd year, also: Add caching in front of the fixed endpoint (in-memory with a TTL is fine, Redis if you want the practice) and write a short load test showing throughput with and without the cache. Resources: Redis docs https://redis.io/docs/latest/ | k6 docs https://k6.io/docs/'
WHERE title = 'Optimize This Slow Endpoint';

-- ---------------------------------------------------------------------------
-- D. Messy Dataset: accept the Colab notebook its deliverables already allow
-- ---------------------------------------------------------------------------

UPDATE public.submission_fields
SET field_label = 'GitHub Repo or Colab Notebook Link',
    field_description = 'A public GitHub repo, or a shared Colab notebook set to "Anyone with the link can view".'
WHERE field_name = 'github_link'
  AND task_id = (SELECT id FROM public.tasks WHERE title = 'Messy Dataset, Baseline Model');

-- ---------------------------------------------------------------------------
-- E. Rewriting an Event Announcement: word count matched to what it asks for
-- ---------------------------------------------------------------------------

UPDATE public.submission_fields
SET field_description = 'Part C alone should be 150-200 words. Keep Parts A and B to 2-3 sentences each.'
WHERE field_name = 'task1_answer'
  AND task_id = (SELECT id FROM public.tasks WHERE title = 'Rewriting an Event Announcement');

-- ---------------------------------------------------------------------------
-- F. One Event, Two Moods: restore the write-up questions from the brief
-- ---------------------------------------------------------------------------

UPDATE public.tasks
SET requirements = replace(
      requirements,
      E'Both posters must be clearly derived from the same event brief but visually distinct in tone.',
      E'Both posters must be clearly derived from the same event brief but visually distinct in tone.\r\n\r\nInclude a 2-3 line write-up answering: Why this layout? Why this color palette? Who is this designed to attract?'
    )
WHERE title = 'One Event, Two Moods';
