export function isWeekend(date: Date): "saturday" | "sunday" | null {
  const day = date.getDay()
  if (day === 6) return "saturday"
  if (day === 0) return "sunday"
  return null
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date)
}

export function getDateClassName(dateString: string): string {
  const date = new Date(dateString)
  const weekend = isWeekend(date)

  if (weekend === "saturday") return "text-blue-600 dark:text-blue-400"
  if (weekend === "sunday") return "text-red-600 dark:text-red-400"
  return "text-foreground"
}
