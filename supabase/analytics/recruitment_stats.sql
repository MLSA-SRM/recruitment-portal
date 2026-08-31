-- Recruitment analytics — run these in the Supabase SQL Editor.
-- All are read-only SELECTs. Nothing here modifies data.
--
-- Terminology used throughout:
--   total_submissions  = row count in submissions (one person can contribute many)
--   unique_applicants  = distinct people, counted ONCE no matter how many
--                        tasks they submitted within that slice
--
-- The distinction matters most at domain level: someone who submitted to
-- three different Technical subdomains is 3 submissions but 1 unique applicant
-- for Technical.


-- ===========================================================================
-- 1. BY SUBDOMAIN  (the narrowest slice, e.g. Technical > AI/ML)
-- ===========================================================================
SELECT
  t.domain,
  t.subdomain,
  COUNT(*)                                                        AS total_submissions,
  COUNT(DISTINCT s.applicant_id)                                  AS unique_applicants,
  COUNT(DISTINCT s.applicant_id) FILTER (WHERE p.year = 1)        AS unique_1st_year,
  COUNT(DISTINCT s.applicant_id) FILTER (WHERE p.year = 2)        AS unique_2nd_year,
  COUNT(*) FILTER (WHERE s.status = 'pending')                    AS pending,
  COUNT(*) FILTER (WHERE s.status = 'shortlisted')                AS shortlisted,
  COUNT(*) FILTER (WHERE s.status = 'rejected')                   AS rejected
FROM public.submissions s
JOIN public.tasks t     ON t.id = s.task_id
LEFT JOIN public.profiles p ON p.id = s.applicant_id
GROUP BY t.domain, t.subdomain
ORDER BY t.domain, t.subdomain;


-- ===========================================================================
-- 2. BY DOMAIN  (deduplicated ACROSS subdomains)
--
-- Note this is NOT the sum of the subdomain rows above. A person who submitted
-- to both "Web Development: Frontend" and "AI/ML" appears in two subdomain
-- rows but counts as ONE unique applicant for Technical here. That is the
-- number you asked for.
-- ===========================================================================
SELECT
  t.domain,
  COUNT(*)                                                        AS total_submissions,
  COUNT(DISTINCT s.applicant_id)                                  AS unique_applicants,
  COUNT(DISTINCT s.applicant_id) FILTER (WHERE p.year = 1)        AS unique_1st_year,
  COUNT(DISTINCT s.applicant_id) FILTER (WHERE p.year = 2)        AS unique_2nd_year,
  COUNT(DISTINCT t.subdomain)                                     AS subdomains_with_activity,
  COUNT(*) FILTER (WHERE s.status = 'pending')                    AS pending,
  COUNT(*) FILTER (WHERE s.status = 'shortlisted')                AS shortlisted,
  COUNT(*) FILTER (WHERE s.status = 'rejected')                   AS rejected
FROM public.submissions s
JOIN public.tasks t     ON t.id = s.task_id
LEFT JOIN public.profiles p ON p.id = s.applicant_id
GROUP BY t.domain
ORDER BY t.domain;


-- ===========================================================================
-- 3. OVERALL TOTALS  (deduplicated across everything)
--
-- unique_applicants here counts each person once even if they submitted
-- across multiple domains, so it will be smaller than the sum of the
-- per-domain unique counts.
-- ===========================================================================
SELECT
  COUNT(*)                                                        AS total_submissions,
  COUNT(DISTINCT s.applicant_id)                                  AS unique_applicants,
  COUNT(DISTINCT s.applicant_id) FILTER (WHERE p.year = 1)        AS unique_1st_year,
  COUNT(DISTINCT s.applicant_id) FILTER (WHERE p.year = 2)        AS unique_2nd_year,
  ROUND(COUNT(*)::numeric / NULLIF(COUNT(DISTINCT s.applicant_id), 0), 2)
                                                                  AS avg_submissions_per_applicant
FROM public.submissions s
LEFT JOIN public.profiles p ON p.id = s.applicant_id;


-- ===========================================================================
-- 4. PER-APPLICANT SUMMARY  (what the grouped dashboard view shows)
--
-- One row per person, listing every domain and subdomain they attempted.
-- Useful for spotting people spreading across many domains, and for manually
-- cross-checking the grouped admin view.
-- ===========================================================================
SELECT
  p.name,
  p.ra_number,
  p.year,
  COUNT(*)                                        AS submissions,
  COUNT(DISTINCT t.domain)                        AS domains_attempted,
  COUNT(DISTINCT t.subdomain)                     AS subdomains_attempted,
  STRING_AGG(DISTINCT t.domain, ', ' ORDER BY t.domain)          AS domains,
  STRING_AGG(DISTINCT t.subdomain, ', ' ORDER BY t.subdomain)    AS subdomains,
  COUNT(*) FILTER (WHERE s.status = 'shortlisted') AS shortlisted,
  COUNT(*) FILTER (WHERE s.status = 'rejected')    AS rejected,
  COUNT(*) FILTER (WHERE s.status = 'pending')     AS pending
FROM public.submissions s
JOIN public.profiles p ON p.id = s.applicant_id
JOIN public.tasks t    ON t.id = s.task_id
GROUP BY p.id, p.name, p.ra_number, p.year
ORDER BY submissions DESC, p.name;


-- ===========================================================================
-- 5. CROSS-DOMAIN APPLICANTS  (people who attempted more than one domain)
-- ===========================================================================
SELECT
  COUNT(*) FILTER (WHERE domains_attempted = 1) AS applicants_in_1_domain,
  COUNT(*) FILTER (WHERE domains_attempted = 2) AS applicants_in_2_domains,
  COUNT(*) FILTER (WHERE domains_attempted = 3) AS applicants_in_3_domains
FROM (
  SELECT s.applicant_id, COUNT(DISTINCT t.domain) AS domains_attempted
  FROM public.submissions s
  JOIN public.tasks t ON t.id = s.task_id
  GROUP BY s.applicant_id
) per_applicant;
