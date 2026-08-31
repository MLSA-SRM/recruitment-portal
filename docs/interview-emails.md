# Interview round — email scenarios

Status: **spec complete, nothing sent yet.**

Dates:
- **Tuesday 1 September 2026** — offline interviews, Batch 1 + Creatives offline
- **Thursday 3 September 2026** — Batch 2 offline, Creatives online

Settled config:
- Sender: `noreply@recruitments.msasrm.in` (verified Resend domain)
- WhatsApp interview group: `https://chat.whatsapp.com/CWCOCp4XjpgFSIgWmTW9Bo`
- **No em dashes anywhere in email copy.** Templates below are already clean;
  keep it that way if you edit them.

---

## Routing matrix

| # | Audience | Count | Template | Interview | WhatsApp |
|---|---|---|---|---|---|
| A | Technical 1st yr, AI/ML | 20 | 1 | Offline, Tue 1 Sep | Yes |
| B | Technical 1st yr, Web Dev (FE 15 + BE 5) | 20 | 1 | Offline, Tue 1 Sep | Yes |
| C | Technical 2nd yr, AI/ML | 13 | 1 | Offline, Thu 3 Sep | Yes |
| D | Technical 2nd yr, Backend | 10 | 1 | Offline, Thu 3 Sep | Yes |
| E | Technical 2nd yr, Frontend only | 28 | 3 | None yet | No |
| F | Creatives offline list | 6 | 1 | Offline, Tue 1 Sep | Yes |
| G | Creatives online list | 6 | 2 | Online, Thu 3 Sep | Yes |
| H | Corporate only | all | **No email** | — | — |

Coverage check, every Technical applicant accounted for:

| Subdomain | Unique | 1st yr | 2nd yr |
|---|---|---|---|
| AI/ML | 33 | 20 → A | 13 → C |
| Web Dev: Backend | 15 | 5 → B | 10 → D |
| Web Dev: Frontend | 43 | 15 → B | 28 → E |

---

## Routing rules

**Rule 0.** One person receives exactly one email. Never two.

**Rule 1.** Multiple subdomains, same day: one email, one slot, list all of them.

**Rule 2.** Technical Batch 1 and Batch 2 cannot collide, because batch is
decided by year and a person has one year.

Confirmed sub-case, 2nd year who submitted to Frontend *and* AI/ML or Backend:
- In AI/ML and/or Backend, so Batch 2 invite wins. Email lists only the AI/ML
  and/or Backend subdomains. Frontend is not mentioned at all. No hold email.
- Frontend only, so hold email.

**Rule 3.** Cross-domain (Technical + Creatives): resolved below, no clashes.

**Rule 4 (Corporate).** Anyone receiving *any* email who also submitted to
Corporate gets the Corporate line appended. Corporate decisions go out
separately later, and this stops people reading silence as rejection. Applies
to every template, including the hold email.

---

## Cross-domain overlaps: 3 people, zero multi-day clashes

| Name | RA | Yr | Creatives | Technical | Outcome |
|---|---|---|---|---|---|
| Kanishk Saha | RA2611043010060 | 1 | Graphic Design, offline Tue | Frontend, 1st yr, Batch 1 Tue | Same day. One email, both subdomains. |
| Akshaya V | RA2511003011820 | 2 | UI/UX, online Thu | Frontend only, hold | Creatives invite + Frontend line |
| Prathiyuksha D M | RA2511053010060 | 2 | UI/UX, online Thu | Frontend only, hold | Creatives invite + Frontend line |

Two consequences:

1. **Kanishk Saha needs two panels on Tuesday**, Creatives and Technical.
   Whoever builds the slot schedule must not double-book him. Only person
   affected.
2. **Akshaya V and Prathiyuksha D M must not receive Template 3.** They get
   Template 2 with the Frontend line instead.

---

## Template 1 — Shortlisted, offline interview
*(A, B, C, D, F)*

**Subject:** You are through to the next round, MLSA SRM interviews

```
Hi {{first_name}},

Congratulations. You have been shortlisted for the next round of MLSA SRM
recruitment.

You were shortlisted for: {{shortlisted_subdomains}}

The next round is an in person interview on {{interview_day}},
{{interview_date}}. The venue will be shared shortly, so please keep an eye on
the WhatsApp group below.

Join the interview group here: https://chat.whatsapp.com/CWCOCp4XjpgFSIgWmTW9Bo

Please join as soon as you can. Venue details, time slots and any updates will
go out there rather than over email.
{{corporate_line}}
See you there,
MLSA SRM Recruitment Team
```

---

## Template 2 — Shortlisted, online interview
*(G)*

**Subject:** You are through to the next round, MLSA SRM interviews

```
Hi {{first_name}},

Congratulations. You have been shortlisted for the next round of MLSA SRM
recruitment.

You were shortlisted for: {{shortlisted_subdomains}}

The next round is an online interview on {{interview_day}},
{{interview_date}}. The joining link and your time slot will be shared in the
WhatsApp group below.

Join the interview group here: https://chat.whatsapp.com/CWCOCp4XjpgFSIgWmTW9Bo

Please join as soon as you can. All updates will go out there rather than over
email.
{{frontend_line}}{{corporate_line}}
See you there,
MLSA SRM Recruitment Team
```

---

## Template 3 — Submission received, still under review
*(E, Technical only, no WhatsApp link)*

**Subject:** Your MLSA SRM submission, an update

```
Hi {{first_name}},

Thanks for submitting for {{submitted_subdomains}}. We have received your work
and it is with the review team.

We have just released the first batch of shortlists for the in person interview
round. Yours is not in that batch, but that is not a rejection. We are running a
second batch of interviews and are still going through submissions for it.

There is nothing you need to do right now. We will be in touch by email once
decisions for the next batch are made, so please keep an eye on your inbox.
{{corporate_line}}
Thanks for the time you put into this. It is genuinely appreciated.

MLSA SRM Recruitment Team
```

---

## Conditional blocks

**`{{corporate_line}}`** — include only when the person also submitted to
Corporate. Surround with blank lines.

```
Your Corporate application is still under review. If it is accepted, you will
receive a separate email about it.
```

**`{{frontend_line}}`** — Akshaya V and Prathiyuksha D M only.

```
Your Web Development: Frontend submission is still under review. We will be in
touch about that one separately.
```

---

## Recipient list query

One row per person, routing already applied.

```sql
WITH creatives_shortlist(ra_number, creatives_subdomain, creatives_mode) AS (
  VALUES
    ('RA2611009010311','Graphic Design','Online'),
    ('RA2611067010091','Graphic Design','Online'),
    ('RA2511003011820','UI/UX Design','Online'),
    ('RA2611037010154','Graphic Design','Online'),
    ('RA2511053010060','UI/UX Design','Online'),
    ('RA2611026011826','Videography','Online'),
    ('RA2611003010739','Graphic Design','Offline'),
    ('RA2611043010060','Graphic Design','Offline'),
    ('RA2611043010070','Graphic Design','Offline'),
    ('RA2611030010204','Graphic Design','Offline'),
    ('RA2611026011101','Videography','Offline'),
    ('RA2511003010769','Graphic Design','Offline')
),
tech AS (
  SELECT
    s.applicant_id,
    BOOL_OR(t.subdomain = 'AI/ML')                     AS has_aiml,
    BOOL_OR(t.subdomain = 'Web Development: Backend')  AS has_backend,
    BOOL_OR(t.subdomain = 'Web Development: Frontend') AS has_frontend
  FROM public.submissions s
  JOIN public.tasks t ON t.id = s.task_id
  WHERE t.domain = 'Technical'
  GROUP BY s.applicant_id
),
corp AS (
  SELECT DISTINCT s.applicant_id
  FROM public.submissions s
  JOIN public.tasks t ON t.id = s.task_id
  WHERE t.domain = 'Corporate'
)
SELECT
  p.name,
  u.email,
  p.ra_number,
  p.year,
  CASE
    WHEN tech.applicant_id IS NULL                          THEN NULL
    WHEN p.year = 1                                         THEN 'BATCH_1'
    WHEN p.year = 2 AND (tech.has_aiml OR tech.has_backend) THEN 'BATCH_2'
    WHEN p.year = 2                                         THEN 'HOLD'
  END AS technical_bucket,
  -- Frontend deliberately omitted for BATCH_2
  CASE
    WHEN p.year = 2 AND (tech.has_aiml OR tech.has_backend)
      THEN CONCAT_WS(', ',
             CASE WHEN tech.has_aiml    THEN 'AI/ML' END,
             CASE WHEN tech.has_backend THEN 'Web Development: Backend' END)
    ELSE CONCAT_WS(', ',
             CASE WHEN tech.has_aiml     THEN 'AI/ML' END,
             CASE WHEN tech.has_backend  THEN 'Web Development: Backend' END,
             CASE WHEN tech.has_frontend THEN 'Web Development: Frontend' END)
  END AS technical_subdomains_to_mention,
  c.creatives_subdomain,
  c.creatives_mode,
  (corp.applicant_id IS NOT NULL) AS include_corporate_line
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
LEFT JOIN tech ON tech.applicant_id = p.id
LEFT JOIN corp ON corp.applicant_id = p.id
LEFT JOIN creatives_shortlist c ON c.ra_number = p.ra_number
WHERE tech.applicant_id IS NOT NULL OR c.ra_number IS NOT NULL
ORDER BY technical_bucket NULLS LAST, p.year, p.name;
```

Sanity checks on the output:
- `BATCH_1` at most 40, fewer if anyone submitted to two 1st year subdomains
- `BATCH_2` at most 23
- `HOLD` around 26, and must not contain Akshaya V or Prathiyuksha D M
- Creatives rows: 12
- `include_corporate_line = true` on however many also did Corporate

---

## Template selection

| Row shape | Template | Interview line |
|---|---|---|
| `BATCH_1`, no creatives | 1 | Offline, Tue 1 Sep |
| `BATCH_2`, no creatives | 1 | Offline, Thu 3 Sep |
| `HOLD`, no creatives | 3 | none |
| `creatives_mode = Offline` only | 1 | Offline, Tue 1 Sep |
| `creatives_mode = Online` only | 2 | Online, Thu 3 Sep |
| Kanishk Saha, BATCH_1 + Offline | 1 | Offline Tue, both subdomains |
| Akshaya V / Prathiyuksha D M | 2 + `frontend_line` | Online Thu |

Append `corporate_line` to any row where `include_corporate_line` is true.

---

## Send order, working around the 100/day cap

Resend free plan allows 100 emails per day. Split by urgency, not arbitrarily.

**Today (about 74 emails).** Everything with an interview attached, because
Batch 1 and Creatives offline are interviewing tomorrow morning.

1. Batch 1 Technical, up to 40
2. Creatives offline, 6 (Kanishk already counted in Batch 1)
3. Creatives online, 6
4. Batch 2 Technical, up to 23

**After midnight (about 26 emails).** The hold group. Nothing time critical for
them, and the email explicitly says there is nothing to do right now.

Check the Resend dashboard for today's usage before starting. Deadline night
OTP and password reset mail may already have consumed part of the allowance.
