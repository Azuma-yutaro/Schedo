export function getCookieId(): string {
  if (typeof window === "undefined") return ""

  const cookieName = "schedule_tool_user_id"
  const cookies = document.cookie.split(";")

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=")
    if (name === cookieName) {
      return value
    }
  }

  // Cookie IDが存在しない場合は新規作成
  const newId = crypto.randomUUID()
  document.cookie = `${cookieName}=${newId}; path=/; max-age=${60 * 60 * 24 * 365}` // 1年間有効
  return newId
}
