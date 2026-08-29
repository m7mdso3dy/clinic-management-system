export function toDateInputValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayDateInputValue(): string {
  return toDateInputValue(new Date().toISOString())
}

export function dateInputToIso(value: string): string | null {
  if (value.trim() === '') return null

  const date = new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return null

  return date.toISOString()
}
