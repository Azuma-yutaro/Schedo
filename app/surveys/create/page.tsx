"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Plus, X } from "lucide-react"

export default function NewSurveyPage() {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dates, setDates] = useState<string[]>([""])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addDate = () => {
    setDates([...dates, ""])
  }

  const removeDate = (index: number) => {
    setDates(dates.filter((_, i) => i !== index))
  }

  const updateDate = (index: number, value: string) => {
    const newDates = [...dates]
    newDates[index] = value
    setDates(newDates)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      // バリデーション
      if (!title.trim()) {
        throw new Error("タイトルを入力してください")
      }

      const validDates = dates.filter((d) => d.trim() !== "")
      if (validDates.length === 0) {
        throw new Error("少なくとも1つの日程を入力してください")
      }

      // アンケートを作成
      const { data: survey, error: surveyError } = await supabase
        .from("surveys")
        .insert({
          title: title.trim(),
          description: description.trim() || null,
        })
        .select()
        .single()

      if (surveyError) throw surveyError

      // 日程候補を作成
      const surveyDates = validDates.map((date) => ({
        survey_id: survey.id,
        date_value: date,
      }))

      const { error: datesError } = await supabase.from("survey_dates").insert(surveyDates)

      if (datesError) throw datesError

      router.push(`/surveys/${survey.id}`)
    } catch (err) {
      console.error("[v0] Error creating survey:", err)
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6 md:p-10">
        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">新規アンケート作成</h1>
          <p className="mt-2 text-pretty text-muted-foreground">イベントのタイトルと日程候補を入力してください</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>アンケート情報</CardTitle>
            <CardDescription>参加者が回答するための情報を入力してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">イベントタイトル *</Label>
                <Input
                  id="title"
                  placeholder="例: チームミーティング"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">説明（任意）</Label>
                <Textarea
                  id="description"
                  placeholder="イベントの詳細や注意事項を入力してください"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>日程候補 *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addDate} className="gap-2 bg-transparent">
                    <Plus className="h-4 w-4" />
                    日程を追加
                  </Button>
                </div>

                <div className="space-y-3">
                  {dates.map((date, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={date}
                          onChange={(e) => updateDate(index, e.target.value)}
                          required={index === 0}
                        />
                      </div>
                      {dates.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDate(index)}
                          className="shrink-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <div className="flex gap-3">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "作成中..." : "アンケートを作成"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={isLoading}>
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
