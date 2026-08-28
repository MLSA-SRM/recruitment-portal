-- Migration: Set all task deadlines to 29 Aug 2026, 4:59 AM IST.
--
-- IST is UTC+5:30, so 29 Aug 2026 04:59:59.999 IST == 28 Aug 2026 23:29:59.999 UTC.
--
-- NOTE: this deadline is deliberately NOT end-of-day, which the display layer
-- previously could not represent. formatDeadlineForDisplay() used to hardcode
-- ", 11:59 PM" and getDeadlineInstant() (formerly normalizeDeadlineToEndOfDay)
-- discarded the stored time and forced 23:59:59.999 in the viewer's timezone.
-- Both were fixed alongside this migration; the server-side gate in
-- canSubmitToTask() already compared exact instants and needed no change.
--
-- Created: 2026-08-28

UPDATE public.tasks
SET deadline = '2026-08-28T23:29:59.999Z'::timestamptz;
