-- Migration: Remove per-year task duplication; one task row per subdomain
-- Description: target_year no longer gates task visibility. Drops the NOT NULL
-- constraint, deletes the 34 previously-seeded (task, year) rows (cascades to their
-- submission_fields and any test submissions against them), and re-inserts 17 single
-- rows. Any second-year-specific ask is folded into that task's own requirements text.
-- Created: 2026-08-23

ALTER TABLE public.tasks ALTER COLUMN target_year DROP NOT NULL;

DELETE FROM public.tasks WHERE title IN ('Live-Sync Mini App', 'Fix This Broken UI', 'Accessible Custom Component', 'Optimize This Slow Endpoint', 'API in an Unfamiliar Framework', 'Background Job Queue', 'RAG Mini Q&A Bot', 'Messy Dataset, Baseline Model', 'Sponsorship Trade-offs', 'Event-Day Contingency Planning', 'Resolving Cross-Team Conflicts', 'Handling a PR Incident', 'Rewriting an Event Announcement', 'Reimagine an Event', 'Tell a Story in 5 Frames', 'One Event, Two Moods', 'Add the Hook');

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Live-Sync Mini App', 'Build a small app where multiple open browser tabs see each other''s actions in real time: a shared sticky-note board, live cursor positions, or a shared poll that updates as votes come in. Use React for the interface and either WebSockets or Server-Sent Events for the real-time part. Two tabs open side by side should be enough to demo it.', 'Technical', 'Web Development: Frontend', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Node 18 or newer. A WebSocket server is easiest with a small Express or Fastify backend and the `ws` library, or Socket.IO if you''d rather have reconnection handling built in. If you go the SSE route, you only need a single HTTP endpoint that stays open and streams events.

Resources: WebSocket API (MDN) https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API | Server-Sent Events (MDN) https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events | Socket.IO docs https://socket.io/docs/v4/

If you''re a 2nd year, also: Add optimistic UI updates, and handle two tabs editing the same note or cursor position at the same moment without one silently overwriting the other. Then make the state survive a refresh: closing a tab and reopening it should restore where things were, not reset to empty.', 'GitHub repo, README, and a 2-3 min video walkthrough (see submission fields). Include a one-line note on how you resolved simultaneous edits, if applicable.', '4-6 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'github_link', 'url', 'GitHub Repository Link', 'Public repo, or add the recruitment GitHub account as a collaborator if private.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'video_walkthrough', 'url', 'Video Walkthrough Link (2-3 min)', 'Unlisted YouTube, Loom, or Drive link. Screen record running the project and talk through one decision you made and why.', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Fix This Broken UI', 'We''ll hand you a small React app with four bugs planted in it on purpose: a stale closure that shows the wrong value, a missing list key causing weird re-render behavior, a layout bug that only appears on narrow screens, and an accessibility issue a screen reader would catch. Find all four, fix them, and add a one-line comment at each fix explaining what was actually wrong. This is a debugging task, not a rebuild: please don''t rewrite the app from scratch, we specifically want to see how you diagnose someone else''s code.', 'Technical', 'Web Development: Frontend', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Node 18 or newer, and a browser with dev tools (React DevTools is genuinely useful here). For the accessibility bug, VoiceOver on macOS or NVDA on Windows will catch it directly, but the axe DevTools browser extension works too.

Resources: React docs on state and closures https://react.dev/learn | ARIA Authoring Practices Guide https://www.w3.org/WAI/ARIA/apg/ | axe DevTools https://www.deque.com/axe/devtools/

If you''re a 2nd year, also: After the four fixes, add one small new feature to the same app (your choice, keep it small). The new feature has to be keyboard-accessible on its own, and covered by at least one automated test using React Testing Library.', 'GitHub repo with the four fixes and one-line comments explaining each, README, and a video walkthrough pointing at each bug''s actual line.', '2-4 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'github_link', 'url', 'GitHub Repository Link', 'Public repo, or add the recruitment GitHub account as a collaborator if private.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'video_walkthrough', 'url', 'Video Walkthrough Link (2-3 min)', 'Unlisted YouTube, Loom, or Drive link. Screen record running the project and talk through one decision you made and why.', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Accessible Custom Component', 'Build one non-trivial UI component completely from scratch, no component library: a multi-select dropdown, a virtualized long list, or a drag-to-reorder list. It needs full keyboard navigation and correct focus management, not just mouse support.', 'Technical', 'Web Development: Frontend', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Just React and Node 18 or newer. Deliberately skip Radix, MUI, and similar libraries for this one, the point is building the primitive yourself.

Resources: ARIA Authoring Practices Guide https://www.w3.org/WAI/ARIA/apg/ | MDN keyboard-accessible guide https://developer.mozilla.org/en-US/docs/Web/Accessibility/Guides/Keyboard-navigable_JavaScript

If you''re a 2nd year, also: Make the component work correctly with a screen reader, not just a keyboard. Then support both a controlled and an uncontrolled usage mode, the way real component libraries do (compare how a native <input> supports both value and defaultValue).', 'GitHub repo, README, and a video walkthrough. A short Storybook page or plain demo page is welcome but not required.', '3-5 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'github_link', 'url', 'GitHub Repository Link', 'Public repo, or add the recruitment GitHub account as a collaborator if private.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'video_walkthrough', 'url', 'Video Walkthrough Link (2-3 min)', 'Unlisted YouTube, Loom, or Drive link. Screen record running the project and talk through one decision you made and why.', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Optimize This Slow Endpoint', 'We''ll hand you a small, working API with one endpoint that''s deliberately slow: either an N+1 query problem or a missing index. Profile it, find the actual cause, fix it, and write down the before and after numbers.', 'Technical', 'Web Development: Backend', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Node 18+ or Python 3.10+ depending on which starter you''re given, plus whatever database the starter uses (local SQLite or Postgres, nothing to provision). `console.time`/`console.timeEnd` or Python''s `time.perf_counter` is genuinely enough.

Resources: Postgres EXPLAIN https://www.postgresql.org/docs/current/using-explain.html | The N+1 query problem, explained https://planetscale.com/blog/what-is-n-1-query-problem-and-how-to-solve-it

If you''re a 2nd year, also: Add caching in front of the fixed endpoint (in-memory with a TTL is fine, Redis if you want the practice) and write a short load test showing throughput with and without the cache. Resources: Redis docs https://redis.io/docs/latest/ | k6 docs https://k6.io/docs/', 'GitHub repo, README with your before/after numbers, and a video walkthrough.', '2-4 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'github_link', 'url', 'GitHub Repository Link', 'Public repo, or add the recruitment GitHub account as a collaborator if private.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'video_walkthrough', 'url', 'Video Walkthrough Link (2-3 min)', 'Unlisted YouTube, Loom, or Drive link. Screen record running the project and talk through one decision you made and why.', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('API in an Unfamiliar Framework', 'Build a small CRUD API with authentication, but in a framework you haven''t used before. If you''re comfortable in Node/Express, try FastAPI. If you''re a Python person, try Express or a minimal Go HTTP server. The concepts (routing, validation, auth, status codes) are ones you already know, the point is proving you can carry them into new syntax.', 'Technical', 'Web Development: Backend', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Whatever runtime the framework needs (Node 18+, Python 3.10+, or Go 1.21+). Keep auth simple, a signed JWT or a hardcoded API key check is fine.

Resources: FastAPI docs https://fastapi.tiangolo.com/ | Express docs https://expressjs.com/ | Go net/http https://pkg.go.dev/net/http

If you''re a 2nd year, also: Add rate limiting and structured logging (JSON logs with a request ID on every line), then containerize the whole thing with a working Dockerfile someone else could docker run without reading your code first. Resources: Docker getting started https://docs.docker.com/get-started/', 'GitHub repo, README noting which framework you picked and one thing that surprised you, and a video walkthrough.', '3-5 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'github_link', 'url', 'GitHub Repository Link', 'Public repo, or add the recruitment GitHub account as a collaborator if private.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'video_walkthrough', 'url', 'Video Walkthrough Link (2-3 min)', 'Unlisted YouTube, Loom, or Drive link. Screen record running the project and talk through one decision you made and why.', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Background Job Queue', 'Build a small job queue: something submits jobs (an API endpoint is fine), a worker processes them asynchronously, and failed jobs retry a couple of times before giving up. BullMQ with Redis is the well-trodden path, but a simpler cron-plus-database-polling approach is completely acceptable.', 'Technical', 'Web Development: Backend', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Node 18+ (or Python with Celery), and Redis if you go the BullMQ route (a free Upstash Redis instance works, no local install needed).

Resources: BullMQ docs https://docs.bullmq.io/ | Upstash Redis (free tier) https://upstash.com/ | Celery docs https://docs.celeryq.dev/en/stable/

If you''re a 2nd year, also: Add a dead-letter queue for jobs that fail every retry, and build a tiny status page (even a single unstyled HTML page is fine) showing pending, running, succeeded, and dead job counts.', 'GitHub repo, README, and a video walkthrough that actually triggers a job that fails on purpose.', '3-5 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'github_link', 'url', 'GitHub Repository Link', 'Public repo, or add the recruitment GitHub account as a collaborator if private.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'video_walkthrough', 'url', 'Video Walkthrough Link (2-3 min)', 'Unlisted YouTube, Loom, or Drive link. Screen record running the project and talk through one decision you made and why.', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('RAG Mini Q&A Bot', 'We''ll give you a small set of documents. Build a question-answering tool that actually retrieves relevant passages from those specific documents before answering, rather than just forwarding the question straight to an LLM. We want to see the retrieval step, not just a wrapped API call.', 'Technical', 'AI/ML', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Python 3.10+, an embeddings model (OpenAI''s embeddings API, or a free local model via sentence-transformers), and a simple vector store (even an in-memory list with cosine similarity is fine at this scale).

Resources: LangChain RAG concepts https://python.langchain.com/docs/concepts/rag/ | sentence-transformers https://www.sbert.net/ | Plain-language embeddings explainer https://simonwillison.net/2023/Oct/23/embeddings/

If you''re a 2nd year, also: Show which document and passage each answer actually came from (a citation, not just a confident-sounding answer). Then handle the case where the answer genuinely isn''t in the documents: the bot should say so rather than making something up.', 'GitHub repo, README, and a video showing one question with a real cited answer and one question the documents don''t cover.', '4-6 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'github_link', 'url', 'GitHub Repository Link', 'Public repo, or add the recruitment GitHub account as a collaborator if private.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'video_walkthrough', 'url', 'Video Walkthrough Link (2-3 min)', 'Unlisted YouTube, Loom, or Drive link. Screen record running the project and talk through one decision you made and why.', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Messy Dataset, Baseline Model', 'We''ll give you a small, deliberately messy CSV (missing values, a few outliers, inconsistent types in places). Explore it, clean what needs cleaning, build a baseline classifier or regressor, and write up what you found and why you made the choices you made. We''re evaluating your reasoning here as much as your model''s accuracy.', 'Technical', 'AI/ML', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Python 3.10+, pandas, and scikit-learn. A Jupyter notebook or Google Colab is the natural format.

Resources: pandas docs https://pandas.pydata.org/docs/ | scikit-learn getting started https://scikit-learn.org/stable/getting_started.html | Google Colab https://colab.research.google.com/

If you''re a 2nd year, also: Compare at least two different modeling approaches and justify, specifically for this dataset, which one you''d actually ship. Add a short error analysis: what does the model get wrong, and what''s the pattern.', 'A GitHub repo or a shared, viewable Colab notebook link, plus README/writeup and video walkthrough.', '3-5 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'github_link', 'url', 'GitHub Repository Link', 'Public repo, or add the recruitment GitHub account as a collaborator if private.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'video_walkthrough', 'url', 'Video Walkthrough Link (2-3 min)', 'Unlisted YouTube, Loom, or Drive link. Screen record running the project and talk through one decision you made and why.', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Sponsorship Trade-offs', 'Shared scenario: MSA SRM is planning its flagship two-day hackathon for October 2026, expecting 400+ participants across roughly 80 teams. Recruitment is happening 9 weeks out, and the core team is short-staffed for an event of this scale. You''ve just joined the team five days ago.', 'Corporate', 'Sponsorship', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Task 1: Three companies have responded to outreach, and you have 12 days until sponsor branding must be finalized for print.

Company A: a fast-growing fintech startup offering ₹50,000 cash, but wants exclusive branding rights across all materials and final approval on any sponsor-related content 48 hours before it''s published.

Company B: an enterprise SaaS company offering ₹20,000 cash plus free 1-year software licenses for the club''s next 3 projects, no exclusivity clause, but typically takes 2 weeks to approve anything.

Company C: a regional recruitment firm offering ₹30,000 worth of swag in exchange for an on-campus booth and resume access to all participants.

For what it''s worth, Company B''s rep also mentioned on the call that they personally loved the reel from last year''s closing ceremony.

Which would you prioritize, and in what order would you pursue the rest? Justify the trade-offs you''re weighing, not just what each one offers.', 'Written answers to Task 1 and Task 2 via the submission form fields below.', '30-40 minutes')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'task1_answer', 'textarea', 'Task 1 - Sponsorship Prioritization', 'Keep it under 200 words unless the task says otherwise.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'task2_reflection', 'textarea', 'Task 2 - Reflection', 'In 3-4 sentences: describe one specific time (in a club, class project, internship, or personal project) where your plan didn''t work and you had to adapt on the spot. What did you change, and why?', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Event-Day Contingency Planning', 'Shared scenario: MSA SRM is planning its flagship two-day hackathon for October 2026, expecting 400+ participants across roughly 80 teams. Recruitment is happening 9 weeks out, and the core team is short-staffed for an event of this scale. You''ve just joined the team five days ago.', 'Corporate', 'Event Management & Logistics', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Task 1: Nine days before the event, three things land at once.

The auditorium booked for the opening ceremony is double-booked by the university for a placement drive. The only alternate hall seats 250, you''re expecting 400.

Your keynote speaker''s flight got rescheduled; they can now only join for 45 minutes instead of the promised 90.

The logistics budget just got cut by 15% because a sponsor payment is delayed.

Unrelated to any of this: maintenance flagged last semester that the alternate hall''s projector glitches with HDMI cables longer than 3 metres.

Draft a same-day contingency plan. What do you change first, what do you deprioritize, and what do you tell participants versus keep internal? Walk through the sequencing, not just the final plan.', 'Written answers to Task 1 and Task 2 via the submission form fields below.', '30-40 minutes')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'task1_answer', 'textarea', 'Task 1 - Contingency Plan', 'Keep it under 200 words unless the task says otherwise.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'task2_reflection', 'textarea', 'Task 2 - Reflection', 'In 3-4 sentences: describe one specific time (in a club, class project, internship, or personal project) where your plan didn''t work and you had to adapt on the spot. What did you change, and why?', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Resolving Cross-Team Conflicts', 'Shared scenario: MSA SRM is planning its flagship two-day hackathon for October 2026, expecting 400+ participants across roughly 80 teams. Recruitment is happening 9 weeks out, and the core team is short-staffed for an event of this scale. You''ve just joined the team five days ago.', 'Corporate', 'Operations', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Task 1: All six club verticals submit event requirements into one shared spreadsheet. For this event, three verticals have each submitted conflicting requirements for the same volunteer pool on the same day, each assuming they''d get first pick.

Separately, and unrelated to the clash: the Design vertical mentioned they''re piloting a new Figma plugin for wireframe versioning.

Propose a resolution process, not just for this one clash, but one that prevents this exact conflict from recurring in future cycles. What''s the one process change you''d make, and what trade-off does it introduce?', 'Written answers to Task 1 and Task 2 via the submission form fields below.', '30-40 minutes')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'task1_answer', 'textarea', 'Task 1 - Process Proposal', 'Keep it under 200 words unless the task says otherwise.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'task2_reflection', 'textarea', 'Task 2 - Reflection', 'In 3-4 sentences: describe one specific time (in a club, class project, internship, or personal project) where your plan didn''t work and you had to adapt on the spot. What did you change, and why?', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Handling a PR Incident', 'Shared scenario: MSA SRM is planning its flagship two-day hackathon for October 2026, expecting 400+ participants across roughly 80 teams. Recruitment is happening 9 weeks out, and the core team is short-staffed for an event of this scale. You''ve just joined the team five days ago.', 'Corporate', 'PR & Outreach', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Task 1: Two hours ago, a meme posted on the club''s Instagram poking fun at a rival college''s tech fest picked up angry comments, including one from a faculty member calling it "unprofessional and embarrassing for the institution." The post already has 3,000+ organic likes.

You also notice the caption has an unrelated typo: "recieve" instead of "receive."

Do you take it down, leave it up, or something in between? Write the actual first message you''d send in the internal team group chat in the next 10 minutes, and explain why that specific wording, not a general PR framework.', 'Written answers to Task 1 and Task 2 via the submission form fields below.', '30-40 minutes')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'task1_answer', 'textarea', 'Task 1 - Internal Team Message', 'Keep it under 200 words unless the task says otherwise.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'task2_reflection', 'textarea', 'Task 2 - Reflection', 'In 3-4 sentences: describe one specific time (in a club, class project, internship, or personal project) where your plan didn''t work and you had to adapt on the spot. What did you change, and why?', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Rewriting an Event Announcement', 'Shared scenario: MSA SRM is planning its flagship two-day hackathon for October 2026, expecting 400+ participants across roughly 80 teams. Recruitment is happening 9 weeks out, and the core team is short-staffed for an event of this scale. You''ve just joined the team five days ago.', 'Corporate', 'Content Writing', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Task 1: Last year''s hackathon announcement opened with: "Get ready for an epic 24 hours of code, chaos, and cracking the case!" For reference only, that post picked up 47 shares.

Part A. In 2-3 sentences, name one specific weakness in this line for a heist/mystery-themed event, and explain why it undermines the theme.

Part B. Rewrite the opening line to fix that specific weakness.

Part C. Using your new opening line, write the full Instagram announcement post (150-200 words) that would actually go out. It needs to: hook in the first sentence, establish the heist/mystery theme, mention it''s happening this October, include one intriguing detail designed to spark curiosity (you can invent one, a clue, a countdown, a locked doc, anything consistent with the theme), and close with a clear call-to-action. Write in the club''s voice: energetic but not cringe, confident without over-explaining.', 'Written answers (Parts A, B, and C) to Task 1, and Task 2, via the submission form fields below.', '30-40 minutes')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'task1_answer', 'textarea', 'Task 1 - Parts A, B, and C', 'Keep it under 200 words unless the task says otherwise.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'task2_reflection', 'textarea', 'Task 2 - Reflection', 'In 3-4 sentences: describe one specific time (in a club, class project, internship, or personal project) where your plan didn''t work and you had to adapt on the spot. What did you change, and why?', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Reimagine an Event', 'Pick any past or upcoming SRM MSA event and redesign its poster / social media creative from scratch (an original take, not a touch-up).', 'Creatives', 'Graphic Design', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Use Microsoft brand colors without directly copying official MS templates.

Establish a clear visual hierarchy (headline, supporting text, call-to-action).

Include a 1-line rationale explaining your design choices (palette, typography, layout).

Evaluation criteria: originality, brand alignment, visual hierarchy, and clarity of rationale.

Tools: open choice (Figma or Canva), Figma strongly preferred.', '1 Instagram post (1080x1080 px) and 1 Instagram story (1080x1920 px). Create a Google Drive folder named GraphicDesign_[YourName], upload the final exported files, and include a doc with your 1-line rationale and the editable project link (Figma link strongly preferred). Set the folder to "Anyone with the link can view."', '2-4 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'drive_folder_link', 'url', 'Google Drive Folder Link', 'Set folder access to "Anyone with the link can view" before submitting.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'writeup', 'textarea', 'Design Rationale', '1-line rationale explaining your palette, typography, and layout choices.', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Tell a Story in 5 Frames', 'Shoot a 5-photo series around one theme: "Campus Life," "Behind the Scenes of Tech," or "A Day in the Life of a Student Ambassador."', 'Creatives', 'Photography', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Show range: at least one candid shot, one composed/staged shot, and one detail/macro shot.

Include a 2-3 line caption written as if posting for the official MSA Instagram account.

Evaluation criteria: composition, lighting awareness, storytelling, and caption quality.

Tools: basic phone photography is acceptable, no professional camera required.', '5 high-resolution photos, numbered 1-5 in sequence. Create a Google Drive folder named Photography_[YourName], upload the photos, and include a doc with your 2-3 line Instagram caption. Set the folder to "Anyone with the link can view."', '2-4 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'drive_folder_link', 'url', 'Google Drive Folder Link', 'Set folder access to "Anyone with the link can view" before submitting.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'writeup', 'textarea', 'Instagram Caption', '2-3 line caption written as if posting for the official MSA Instagram account.', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('One Event, Two Moods', 'Take one event brief (e.g., "Hackathon Kickoff") and design two poster versions with distinct tones: one energetic/bold and one minimal/professional.', 'Creatives', 'UI/UX Design', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Both posters must be clearly derived from the same event brief but visually distinct in tone.

Evaluation criteria: contrast between the two moods, layout reasoning, and clarity of the write-up.

Tools: Figma (most preferred) or Canva.', '2 poster versions, exported as image or PDF files (1080x1350 px recommended). Create a Google Drive folder named UIUX_[YourName], upload both versions, and include a doc with your write-up and the working design link (Figma link strongly preferred). Set the folder to "Anyone with the link can view."', '3-5 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'drive_folder_link', 'url', 'Google Drive Folder Link', 'Set folder access to "Anyone with the link can view" before submitting.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'writeup', 'textarea', 'Design Write-up', '2-3 lines answering: Why this layout? Why this color palette? Who is this designed to attract?', true, 2);
END $$;

DO $$
DECLARE new_task_id bigint;
BEGIN
INSERT INTO public.tasks (title, description, domain, subdomain, target_year, deadline, requirements, deliverables, estimated_duration)
VALUES ('Add the Hook', 'Take a video clip without a strong opening and edit the first 3 seconds to immediately grab attention (using cuts, text, zooms, audio hooks, etc.).', 'Creatives', 'Videography', NULL, '2026-08-27T23:59:59.999Z'::timestamptz, 'Source clip can be your own footage or any royalty-free clip, credit the source if it isn''t yours.

The final edit should be under 60 seconds total, with the first 3 seconds doing the heavy lifting.

Evaluation criteria: impact of the hook, pacing, creativity of the edit, and clarity of the accompanying note.

Tools: any editing tool (CapCut, Premiere Rush, InShot, DaVinci Resolve, etc.), open choice.', 'One edited video clip, vertical 1080x1920 (9:16), .mp4 or .mov. Create a Google Drive folder named Videography_[YourName], upload the final file, and include a doc with your editing note and project link if applicable. Set the folder to "Anyone with the link can view."', '2-4 hours')
RETURNING id INTO new_task_id;
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'drive_folder_link', 'url', 'Google Drive Folder Link', 'Set folder access to "Anyone with the link can view" before submitting.', true, 1);
INSERT INTO public.submission_fields (task_id, field_name, field_type, field_label, field_description, is_required, display_order)
VALUES (new_task_id, 'writeup', 'textarea', 'Editing Note', '1-2 lines on the editing choices you made and why (cuts, text, audio, pacing).', true, 2);
END $$;
