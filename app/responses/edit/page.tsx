"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { getCookieId } from "@/lib/utils/cookie"
import Link from "next/link"

type SavedResponse = {
  survey_id: string
  response_id: string
  respondent_name: string
}

export default function EditResponseRequestPage() {
  const router = useRouter()
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([])
  const [name, setName] = useState("")
  const [surveyId, setSurveyId] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // localStorageから保存された回答を取得
    if (typeof window !== "undefined") {
      const saved = JSON.parse(localStorage.getItem("my_responses") || "[]")
      setSavedResponses(saved)
    }
  }, [])

  const handleFindResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      if (!name.trim() || !surveyId.trim()) {
        throw new Error("お名前とアンケートIDを入力してください")
      }

      // Cookie IDで検索
      const cookieId = getCookieId()
      const { data: responsesByCookie } = await supabase
        .from("responses")
        .select("*")
        .eq("survey_id", surveyId.trim())
        .eq("cookie_id", cookieId)

      if (responsesByCookie && responsesByCookie.length > 0) {
        router.push(`/responses/${responsesByCookie[0].id}/edit`)
        return
      }

      // 名前で検索
      const { data: responsesByName } = await supabase
        .from("responses")
        .select("*")
        .eq("survey_id", surveyId.trim())
        .eq("respondent_name", name.trim())

      if (responsesByName && responsesByName.length > 0) {
        router.push(`/responses/${responsesByName[0].id}/edit`)
        return
      }

      throw new Error("回答が見つかりませんでした。お名前とアンケートIDを確認してください。")
    } catch (err) {
      console.error("[v0] Error finding response:", err)
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">回答の編集</h1>
          <p className="mt-2 text-pretty text-muted-foreground">過去の回答を編集できます</p>
        </div>

        {savedResponses.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>最近の回答</CardTitle>
              <CardDescription>このデバイスから送信した回答</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {savedResponses.map((response, index) => (
                  <Link key={index} href={`/responses/${response.response_id}/edit`}>
                    <Button variant="outline" className="w-full justify-start bg-transparent">
                      {response.respondent_name} - アンケートID: {response.survey_id.slice(0, 8)}...
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>回答を検索</CardTitle>
            <CardDescription>お名前とアンケートIDで回答を検索します</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFindResponse} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">お名前 *</Label>
                <Input
                  id="name"
                  placeholder="山田太郎"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surveyId">アンケートID *</Label>
                <Input
                  id="surveyId"
                  placeholder="アンケートのURLに含まれるID"
                  value={surveyId}
                  onChange={(e) => setSurveyId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">例: https://example.com/surveys/[ここがID]/respond</p>
              </div>

              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "検索中..." : "回答を検索"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
