-- Migration: Remap subdomain values that were renamed in the app but never
-- migrated on existing profiles, and clear leftover test data from the admin
-- account.
--
-- Background: DOMAIN_SUBDOMAINS in src/lib/constants.ts was updated to match
-- the wording in the recruitment task documents. Three subdomains were renamed:
--
--     'Team Operations'                 -> 'Operations'
--     'Sponsorships & Partnerships'     -> 'Sponsorship'
--     'Video Editing & Motion Graphics' -> 'Videography'
--
-- The 418 profiles that already existed kept the old strings. /apply filters
-- tasks with .in('subdomain', userSubdomains), so those applicants silently
-- stopped matching tasks: 199 profiles held at least one dead value and 11 of
-- them could see no tasks at all and were therefore unable to apply.
--
-- Verified by dry run (transaction rolled back) before writing this file:
--   199 profile rows and 61 legacy scalar values updated,
--   applicants seeing zero tasks 11 -> 0, no dead values left, no duplicates.
--
-- Created: 2026-08-24

-- ---------------------------------------------------------------------------
-- 1. subdomains[] array. array_agg(DISTINCT ...) collapses the case where a
--    profile already held both the old and the new name for the same choice.
-- ---------------------------------------------------------------------------

UPDATE public.profiles p
SET subdomains = sub.arr
FROM (
  SELECT id,
         array_agg(DISTINCT CASE s
           WHEN 'Team Operations'                 THEN 'Operations'
           WHEN 'Sponsorships & Partnerships'     THEN 'Sponsorship'
           WHEN 'Video Editing & Motion Graphics' THEN 'Videography'
           ELSE s
         END) AS arr
  FROM public.profiles, unnest(subdomains) AS s
  GROUP BY id
) sub
WHERE p.id = sub.id
  AND p.subdomains && ARRAY['Team Operations','Sponsorships & Partnerships','Video Editing & Motion Graphics'];

-- ---------------------------------------------------------------------------
-- 2. Legacy single-value subdomain column, still read as a fallback when the
--    array is empty.
-- ---------------------------------------------------------------------------

UPDATE public.profiles
SET subdomain = CASE subdomain
      WHEN 'Team Operations'                 THEN 'Operations'
      WHEN 'Sponsorships & Partnerships'     THEN 'Sponsorship'
      WHEN 'Video Editing & Motion Graphics' THEN 'Videography'
    END
WHERE subdomain IN ('Team Operations','Sponsorships & Partnerships','Video Editing & Motion Graphics');

-- ---------------------------------------------------------------------------
-- 3. Clear test data from the admin account so it stops appearing as an
--    applicant in the users list and CSV exports. The row itself must stay:
--    is_admin lives here. The onboarding flag lives in auth_check and is left
--    untouched, so admin access is unaffected.
-- ---------------------------------------------------------------------------

UPDATE public.profiles p
SET name         = 'MLSA SRM Admin',
    ra_number    = NULL,
    phone_number = NULL,
    department   = NULL,
    branch       = NULL,
    year         = NULL,
    domain       = NULL,
    subdomain    = NULL,
    domains      = NULL,
    subdomains   = NULL
FROM auth.users u
WHERE u.id = p.id
  AND u.email = 'mlsasrm14@gmail.com'
  AND p.is_admin = true;
