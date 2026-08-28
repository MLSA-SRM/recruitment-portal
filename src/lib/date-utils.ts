/**
 * Date and timezone utilities for consistent handling across the application
 */

/**
 * Converts a date string to end of day in UTC timezone
 * @param dateString - Date string (YYYY-MM-DD format)
 * @returns ISO string with time set to 23:59:59.999Z
 */
export function toEndOfDayUTC(dateString: string): string {
  if (!dateString) return ''
  
  // If already has time, extract just the date part
  const dateOnly = dateString.split('T')[0]
  
  // Set to end of day in UTC
  return `${dateOnly}T23:59:59.999Z`
}

/**
 * Converts a date string to start of day in UTC timezone
 * @param dateString - Date string (YYYY-MM-DD format)
 * @returns ISO string with time set to 00:00:00.000Z
 */
export function toStartOfDayUTC(dateString: string): string {
  if (!dateString) return ''
  
  // If already has time, extract just the date part
  const dateOnly = dateString.split('T')[0]
  
  // Set to start of day in UTC
  return `${dateOnly}T00:00:00.000Z`
}

/**
 * The timezone deadlines are defined in. Recruitment is run out of SRM in
 * India, so deadlines mean a wall-clock time in IST regardless of where the
 * viewer (or the server) happens to be. Formatting explicitly in IST keeps
 * server-rendered pages (Vercel runs in UTC) and client-rendered pages (the
 * student's own timezone) showing the same date and time.
 */
export const DEADLINE_TIME_ZONE = 'Asia/Kolkata'

/**
 * Returns the exact instant a deadline falls at.
 *
 * This previously discarded the stored time and forced 23:59:59.999 in the
 * viewer's local timezone. That silently broke any deadline that isn't end of
 * day: a 29 Aug 4:59 AM IST cutoff would have been treated as 29 Aug 11:59 PM
 * IST, staying open ~19 hours too long. The server-side submission gate in
 * canSubmitToTask() always compared exact instants, so the two disagreed.
 *
 * @param deadline - Deadline string from database
 * @returns Date object for that exact instant
 */
export function getDeadlineInstant(deadline: string): Date {
  if (!deadline) return new Date()

  return new Date(deadline)
}

/**
 * Formats a date for display in IST
 * @param dateString - ISO date string
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string
 */
export function formatDateForDisplay(
  dateString: string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
): string {
  if (!dateString) return ''

  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { timeZone: DEADLINE_TIME_ZONE, ...options })
}

/**
 * Formats a deadline for display, showing its actual date and time in IST.
 * @param dateString - ISO date string
 * @returns Formatted deadline string, e.g. "Aug 29, 2026, 4:59 AM IST"
 */
export function formatDeadlineForDisplay(dateString: string): string {
  if (!dateString) return ''

  const formatted = new Date(dateString).toLocaleString('en-US', {
    timeZone: DEADLINE_TIME_ZONE,
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return `${formatted} IST`
}

/**
 * Checks if a deadline has passed (comparing with current time)
 * @param deadline - Deadline string
 * @returns true if deadline has passed
 */
export function isDeadlinePassed(deadline: string): boolean {
  if (!deadline) return false

  const now = new Date()
  const deadlineDate = getDeadlineInstant(deadline)

  return deadlineDate < now
}

/**
 * Gets the minimum date for date inputs (today)
 * @returns Date string in YYYY-MM-DD format
 */
export function getMinDateForInput(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Converts a datetime-local input value to UTC end of day
 * @param inputValue - Value from datetime-local input
 * @returns UTC ISO string
 */
export function convertDateTimeInputToUTC(inputValue: string): string {
  if (!inputValue) return ''
  
  // If it's a date-only input (YYYY-MM-DD), convert to end of day
  if (!inputValue.includes('T')) {
    return toEndOfDayUTC(inputValue)
  }
  
  // If it's a datetime input, ensure it has timezone info
  if (!inputValue.includes('Z') && !inputValue.includes('+') && !inputValue.includes('-', 10)) {
    return `${inputValue}Z`
  }
  
  return inputValue
}
