"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import type { SurveyDate, SurveyWithDates } from "@/lib/types"
import { ArrowLeft, Plus, X } from "lucide-react"
import Link from "next/link"

export default function EditSurveyPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [survey, setSurvey] = useState<SurveyWithDates | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dates, setDates] = useState<Array<{ id?: string; date_value: string; isNew?: boolean }>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSurvey = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("surveys")
        .select(
          `
          *,
          survey_dates (*)
        `,
        )
        .eq("id", params.id)
        .single()

      if (error) {
        console.error("[v0] Error fetching survey:", error)
        setError("アンケートの読み込みに失敗しました")
      } else if (data) {
        setSurvey(data as SurveyWithDates)
        setTitle(data.title)
        setDescription(data.description || "")
        setDates(
          data.survey_dates
            .sort((a: SurveyDate, b: SurveyDate) => new Date(a.date_value).getTime() - new Date(b.date_value).getTime())
            .map((d: SurveyDate) => ({ id: d.id, date_value: d.date_value })),
        )
      }
      setIsLoading(false)
    }

    fetchSurvey()
  }, [params.id])

  const addDate = () => {
    setDates([...dates, { date_value: "", isNew: true }])
  }

  const removeDate = (index: number) => {
    setDates(dates.filter((_, i) => i !== index))
  }

  const updateDate = (index: number, value: string) => {
    const newDates = [...dates]
    newDates[index] = { ...newDates[index], date_value: value }
    setDates(newDates)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()

    try {
      // バリデーション
      if (!title.trim()) {
        throw new Error("タイトルを入力してください")
      }

      const validDates = dates.filter((d) => d.date_value.trim() !== "")
      if (validDates.length === 0) {
        throw new Error("少なくとも1つの日程を入力してください")
      }

      // アンケート情報を更新
      const { error: surveyError } = await supabase
        .from("surveys")
        .update({
          title: title.trim(),
          description: description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id)

      if (surveyError) throw surveyError

      // 既存の日程IDを取得
      const existingDateIds = dates.filter((d) => d.id && !d.isNew).map((d) => d.id!)

      // 削除された日程を特定して削除
      const originalDateIds = survey?.survey_dates.map((d) => d.id) || []
      const deletedDateIds = originalDateIds.filter((id) => !existingDateIds.includes(id))

      if (deletedDateIds.length > 0) {
        const { error: deleteError } = await supabase.from("survey_dates").delete().in("id", deletedDateIds)
        if (deleteError) throw deleteError
      }

      // 既存の日程を更新
      for (const date of validDates.filter((d) => d.id && !d.isNew)) {
        const { error: updateError } = await supabase
          .from("survey_dates")
          .update({ date_value: date.date_value })
          .eq("id", date.id!)

        if (updateError) throw updateError
      }

      // 新しい日程を追加
      const newDates = validDates
        .filter((d) => d.isNew || !d.id)
        .map((d) => ({
          survey_id: params.id,
          date_value: d.date_value,
        }))

      if (newDates.length > 0) {
        const { error: insertError } = await supabase.from("survey_dates").insert(newDates)
        if (insertError) throw insertError
      }

      router.push(`/surveys/${params.id}`)
    } catch (err) {
      console.error("[v0] Error updating survey:", err)
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    )
  }

  if (!survey) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">アンケートが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6 md:p-10">
        <div className="mb-6">
          <Link href={`/surveys/${params.id}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">アンケート編集</h1>
          <p className="mt-2 text-pretty text-muted-foreground">アンケートの情報を編集できます</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>アンケート情報</CardTitle>
            <CardDescription>タイトル、説明、日程候補を編集してください</CardDescription>
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
                    <div key={date.id || index} className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          type="date"
                          value={date.date_value}
                          onChange={(e) => updateDate(index, e.target.value)}
                          required
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
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "更新中..." : "変更を保存"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/surveys/${params.id}`)}
                  disabled={isSubmitting}
                >
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
