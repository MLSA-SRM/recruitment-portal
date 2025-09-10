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
 * Normalizes a deadline to end of day for consistent comparison
 * @param deadline - Deadline string from database
 * @returns Date object set to end of day in local timezone
 */
export function normalizeDeadlineToEndOfDay(deadline: string): Date {
  if (!deadline) return new Date()
  
  const base = new Date(deadline)
  // Set to end of day in local timezone for consistent comparison
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999)
}

/**
 * Formats a date for display in the user's local timezone
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
  return date.toLocaleDateString('en-US', options)
}

/**
 * Checks if a deadline has passed (comparing with current time)
 * @param deadline - Deadline string
 * @returns true if deadline has passed
 */
export function isDeadlinePassed(deadline: string): boolean {
  if (!deadline) return false
  
  const now = new Date()
  const deadlineDate = normalizeDeadlineToEndOfDay(deadline)
  
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
