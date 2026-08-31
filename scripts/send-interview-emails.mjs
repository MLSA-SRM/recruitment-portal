/**
 * Interview round mailer.
 *
 * Reads the recipient CSV exported from the Supabase query in
 * docs/interview-emails.md, applies the routing rules, renders each email,
 * and (optionally) sends via Resend.
 *
 * USAGE
 *   Dry run, writes every email to ./out/ and sends nothing:
 *     node scripts/send-interview-emails.mjs --csv "path/to/recipients.csv"
 *
 *   Real send:
 *     RESEND_API_KEY=re_xxx node scripts/send-interview-emails.mjs --csv "..." --send
 *
 *   Send only one bucket (repeatable), useful for the 100/day cap:
 *     ... --send --only BATCH_1 --only CREATIVES
 *
 * SAFETY
 *   - Dry run is the default. --send is required to actually send.
 *   - Every successful send is appended to ./out/sent.log. On restart, any
 *     address already in that log is skipped, so a crash or rate limit
 *     partway through can never double-send to the same person.
 */

import fs from 'node:fs'
import path from 'node:path'

const WHATSAPP = 'https://chat.whatsapp.com/CWCOCp4XjpgFSIgWmTW9Bo'
const FROM = 'MLSA SRM Recruitment <noreply@recruitments.msasrm.in>'
const OUT_DIR = 'out'
const SENT_LOG = path.join(OUT_DIR, 'sent.log')

const args = process.argv.slice(2)
const csvPath = args[args.indexOf('--csv') + 1]
const doSend = args.includes('--send')
const only = args.reduce((acc, a, i) => (a === '--only' ? [...acc, args[i + 1]] : acc), [])

if (!csvPath || !fs.existsSync(csvPath)) {
  console.error('Missing or unreadable --csv path')
  process.exit(1)
}

// --- CSV parsing (handles quoted fields containing commas) -----------------
function parseCsv(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++ }
      else if (ch === '"') inQuotes = false
      else field += ch
    } else if (ch === '"') inQuotes = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (ch !== '\r') field += ch
  }
  if (field || row.length) { row.push(field); rows.push(row) }
  const [header, ...body] = rows.filter(r => r.some(c => c.trim() !== ''))
  return body.map(r => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])))
}

const isNull = v => !v || v === 'null' || v === 'NULL'

/**
 * Normalise a name to "First Last" title case.
 *
 * The exported data is messy: stray leading/trailing spaces, doubled spaces,
 * and roughly fifteen names typed in full caps, which read as shouting in a
 * greeting. Single letters and dotted initials are preserved as-is so
 * "Rishi Ganapaathy T" and "S. M. Sanjana" survive intact rather than becoming
 * "Rishi Ganapaathy t" / "S. m. Sanjana".
 *
 *   " Rishi Ganapaathy T"    -> "Rishi Ganapaathy T"
 *   "HRISHIT KALITA"         -> "Hrishit Kalita"
 *   "SWETAPARNA DAS GUPTA  " -> "Swetaparna Das Gupta"
 *   "M PADMESHWARAN "        -> "M Padmeshwaran"
 *   "S. M. Sanjana"          -> "S. M. Sanjana"
 */
function properName(raw) {
  const cleaned = (raw || '').trim().replace(/\s+/g, ' ')
  if (!cleaned) return 'there'
  return cleaned
    .split(' ')
    .map((tok) => {
      if (tok.length === 1) return tok.toUpperCase()          // initial: T, S, P
      if (/^[A-Za-z]\.$/.test(tok)) return tok.toUpperCase()  // dotted initial: S.
      return tok[0].toUpperCase() + tok.slice(1).toLowerCase()
    })
    .join(' ')
}

// --- Templates -------------------------------------------------------------
const CORPORATE_LINE =
  '\nYour Corporate application is still under review. If it is accepted, you will\n' +
  'receive a separate email about it.\n'

const FRONTEND_LINE =
  '\nYour Web Development: Frontend submission is still under review. We will be in\n' +
  'touch about that one separately.\n'

function shortlistEmail({ name, subdomains, day, date, online, corporate, frontend }) {
  const modeLine = online
    ? `The next round is an online interview on ${day}, ${date}. The joining link\nand your time slot will be shared in the WhatsApp group below.`
    : `The next round is an in person interview on ${day}, ${date}. The venue will\nbe shared shortly, so please keep an eye on the WhatsApp group below.`

  // "Venue details" is wrong for an online interview, where there is no venue.
  const detailsLine = online
    ? 'Please join as soon as you can. The joining link, time slots and any updates\nwill go out there rather than over email.'
    : 'Please join as soon as you can. Venue details, time slots and any updates\nwill go out there rather than over email.'

  return `Hi ${properName(name)},

Congratulations. You have been shortlisted for the next round of MLSA SRM
recruitment.

You were shortlisted for: ${subdomains}

${modeLine}

Join the interview group here: ${WHATSAPP}

${detailsLine}
${frontend ? FRONTEND_LINE : ''}${corporate ? CORPORATE_LINE : ''}
See you there,
MLSA SRM Recruitment Team
`
}

/**
 * Acknowledgement for people who submitted ONLY to Corporate.
 *
 * They received nothing in the first send, because Corporate decisions are not
 * ready. That leaves them watching Technical and Creatives peers hear back
 * while they get silence, which reads as rejection. This says nothing about
 * their outcome, only that a decision is still coming.
 */
function corporateAckEmail({ name, subdomains }) {
  return `Hi ${properName(name)},

Thanks for submitting for ${subdomains}. We have received your work and it is
with the review team.

We have started releasing results for some domains, so you may have seen others
hear back already. Corporate decisions are still being finalised, and yours has
not been decided either way yet.

There is nothing you need to do right now. We will email you with the outcome
once Corporate decisions are made.

Thanks for the time you put into this. It is genuinely appreciated.

MLSA SRM Recruitment Team
`
}

function holdEmail({ name, subdomains, corporate }) {
  return `Hi ${properName(name)},

Thanks for submitting for ${subdomains}. We have received your work and it is
with the review team.

We have just released the first batch of shortlists for the in person interview
round. Yours is not in that batch, but that is not a rejection. We are running a
second batch of interviews and are still going through submissions for it.

There is nothing you need to do right now. We will be in touch by email once
decisions for the next batch are made, so please keep an eye on your inbox.
${corporate ? CORPORATE_LINE : ''}
Thanks for the time you put into this. It is genuinely appreciated.

MLSA SRM Recruitment Team
`
}

// --- Routing ---------------------------------------------------------------
function route(r) {
  const corporate = r.include_corporate_line === 'true'
  const tech = isNull(r.technical_bucket) ? null : r.technical_bucket
  const cMode = isNull(r.creatives_mode) ? null : r.creatives_mode
  const cSub = isNull(r.creatives_subdomain) ? null : r.creatives_subdomain
  const tSub = isNull(r.technical_subdomains_to_mention) ? null : r.technical_subdomains_to_mention

  const subs = [tSub, cSub].filter(Boolean).join(', ')

  // Creatives shortlist always beats a Technical HOLD: these people are being
  // congratulated, so they must never also receive the hold email. Their
  // Frontend submission is acknowledged with a separate line instead.
  if (tech === 'HOLD' && cMode) {
    return {
      bucket: 'CREATIVES',
      subject: 'You are through to the next round, MLSA SRM interviews',
      body: shortlistEmail({
        name: r.name, subdomains: cSub,
        day: cMode === 'Online' ? 'Thursday' : 'Tuesday',
        date: cMode === 'Online' ? '3 September 2026' : '1 September 2026',
        online: cMode === 'Online', corporate, frontend: true,
      }),
    }
  }

  if (tech === 'HOLD') {
    return {
      bucket: 'HOLD',
      subject: 'Your MLSA SRM submission, an update',
      body: holdEmail({ name: r.name, subdomains: tSub, corporate }),
    }
  }

  if (tech === 'BATCH_1' || tech === 'BATCH_2') {
    const thu = tech === 'BATCH_2'
    const techDay = thu ? 'Thursday' : 'Tuesday'

    // Guard: a Technical invite merged with a Creatives invite is only safe
    // when both fall on the same day. BATCH_1 is Tuesday and Creatives offline
    // is Tuesday; BATCH_2 is Thursday and Creatives online is Thursday. Any
    // other pairing means two separate commitments that cannot be described by
    // one interview line, and would silently send a wrong date. No such row
    // exists in the current data (Kanishk Saha is BATCH_1 + offline, same day),
    // but fail loudly rather than guess if that ever changes.
    if (cMode) {
      const creativesDay = cMode === 'Online' ? 'Thursday' : 'Tuesday'
      if (creativesDay !== techDay) {
        return {
          bucket: 'NEEDS_MANUAL',
          subject: null,
          body: null,
          note: `${r.name} <${r.email}>: Technical ${tech} on ${techDay} but Creatives ${cMode} on ${creativesDay}. Two separate days, build this email by hand.`,
        }
      }
    }

    return {
      bucket: tech,
      subject: 'You are through to the next round, MLSA SRM interviews',
      body: shortlistEmail({
        name: r.name, subdomains: subs,
        day: techDay,
        date: thu ? '3 September 2026' : '1 September 2026',
        online: false, corporate, frontend: false,
      }),
    }
  }

  if (cMode) {
    return {
      bucket: 'CREATIVES',
      subject: 'You are through to the next round, MLSA SRM interviews',
      body: shortlistEmail({
        name: r.name, subdomains: cSub,
        day: cMode === 'Online' ? 'Thursday' : 'Tuesday',
        date: cMode === 'Online' ? '3 September 2026' : '1 September 2026',
        online: cMode === 'Online', corporate, frontend: false,
      }),
    }
  }

  // Corporate-only applicant: no Technical bucket, no Creatives shortlist.
  // Note we do NOT append CORPORATE_LINE here, since the whole email is about
  // their Corporate submission and the line would just repeat itself.
  const corpSubs = isNull(r.corporate_subdomains) ? null : r.corporate_subdomains
  if (corpSubs) {
    return {
      bucket: 'CORPORATE_ACK',
      subject: 'Your MLSA SRM Corporate submission, an update',
      body: corporateAckEmail({ name: r.name, subdomains: corpSubs }),
    }
  }

  return null
}

// --- Main ------------------------------------------------------------------
const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'))
fs.mkdirSync(OUT_DIR, { recursive: true })

const alreadySent = new Set(
  fs.existsSync(SENT_LOG) ? fs.readFileSync(SENT_LOG, 'utf8').split('\n').map(l => l.trim()).filter(Boolean) : []
)

const planned = []
const manual = []
const unrouted = []

for (const r of rows) {
  if (!r.email) { unrouted.push(`${r.name}: no email address`); continue }
  const routed = route(r)
  if (!routed) { unrouted.push(`${r.name} <${r.email}>: no matching route`); continue }
  if (routed.bucket === 'NEEDS_MANUAL') { manual.push(routed.note); continue }
  if (only.length && !only.includes(routed.bucket)) continue
  planned.push({ ...routed, email: r.email, name: r.name })
}

// Every row in the CSV must end up either planned, filtered out by --only, or
// explicitly listed below. Nothing may be dropped silently.
const counts = planned.reduce((a, p) => ({ ...a, [p.bucket]: (a[p.bucket] || 0) + 1 }), {})
console.log(`Rows read: ${rows.length}`)
console.log('Planned:', counts, '| total to send:', planned.length)

if (only.length) console.log(`Filtered to buckets: ${only.join(', ')}`)

if (manual.length) {
  console.log(`\n!! ${manual.length} need manual handling, NOT included above:`)
  manual.forEach((m) => console.log('   ' + m))
}
if (unrouted.length) {
  console.log(`\n!! ${unrouted.length} could not be routed, NOT included above:`)
  unrouted.forEach((u) => console.log('   ' + u))
}

// Duplicate address check: nobody should ever be queued twice in one run.
const seen = new Set()
const dupes = planned.filter((p) => (seen.has(p.email) ? true : (seen.add(p.email), false)))
if (dupes.length) {
  console.error(`\nABORT: ${dupes.length} duplicate address(es) in this run:`)
  dupes.forEach((d) => console.error('   ' + d.email))
  process.exit(1)
}

if (!doSend) {
  for (const p of planned) {
    const safe = p.email.replace(/[^a-z0-9.@+-]/gi, '_')
    fs.writeFileSync(path.join(OUT_DIR, `${p.bucket}__${safe}.txt`),
      `To: ${p.email}\nFrom: ${FROM}\nSubject: ${p.subject}\n\n${p.body}`)
  }
  console.log(`\nDRY RUN. Wrote ${planned.length} files to ./${OUT_DIR}/. Nothing sent.`)
  console.log('Read a few, then re-run with --send.')
  process.exit(0)
}

const apiKey = process.env.RESEND_API_KEY
if (!apiKey) { console.error('RESEND_API_KEY not set'); process.exit(1) }

let sent = 0, skipped = 0, failed = 0
for (const p of planned) {
  if (alreadySent.has(p.email)) { skipped++; continue }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [p.email], subject: p.subject, text: p.body }),
    })
    if (!res.ok) {
      failed++
      console.error(`FAIL ${p.email}: ${res.status} ${await res.text()}`)
      // A 429 means the daily cap is hit; stop rather than burn through failures.
      if (res.status === 429) { console.error('\nRate limited. Stopping.'); break }
    } else {
      fs.appendFileSync(SENT_LOG, p.email + '\n')
      sent++
      console.log(`sent ${sent}/${planned.length}  ${p.email}`)
    }
  } catch (e) {
    failed++
    console.error(`ERROR ${p.email}:`, e.message)
  }
  await new Promise(r => setTimeout(r, 600)) // stay well under Resend's rate limit
}

console.log(`\nDone. sent=${sent} skipped=${skipped} failed=${failed}`)
