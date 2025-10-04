"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createClient } from "@/lib/supabase/client"
import { getDateClassName, formatDate } from "@/lib/utils/date"
import type { ResponseDetail, ResponseWithDetails, SurveyWithDates } from "@/lib/types"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Circle, XCircle, ExternalLink } from "lucide-react"

type AvailabilityAnswer = {
  detail_id: string
  survey_date_id: string
  availability: "available" | "maybe" | "unavailable"
  note: string
}

export default function EditResponsePage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [response, setResponse] = useState<ResponseWithDetails | null>(null)
  const [survey, setSurvey] = useState<SurveyWithDates | null>(null)
  const [answers, setAnswers] = useState<AvailabilityAnswer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // 回答を取得
      const { data: responseData, error: responseError } = await supabase
        .from("responses")
        .select(
          `
          *,
          response_details (*)
        `,
        )
        .eq("id", params.id)
        .single()

      if (responseError) {
        console.error("[v0] Error fetching response:", responseError)
        setError("回答の読み込みに失敗しました")
        setIsLoading(false)
        return
      }

      setResponse(responseData as ResponseWithDetails)

      // アンケートを取得
      const { data: surveyData, error: surveyError } = await supabase
        .from("surveys")
        .select(
          `
          *,
          survey_dates (*)
        `,
        )
        .eq("id", responseData.survey_id)
        .single()

      if (surveyError) {
        console.error("[v0] Error fetching survey:", surveyError)
        setError("アンケートの読み込みに失敗しました")
      } else {
        setSurvey(surveyData as SurveyWithDates)
        // 回答詳細を初期化
        const initialAnswers = responseData.response_details.map((detail: ResponseDetail) => ({
          detail_id: detail.id,
          survey_date_id: detail.survey_date_id,
          availability: detail.availability,
          note: detail.note || "",
        }))
        setAnswers(initialAnswers)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [params.id])

  const updateAnswer = (survey_date_id: string, availability: "available" | "maybe" | "unavailable") => {
    setAnswers((prev) =>
      prev.map((answer) => (answer.survey_date_id === survey_date_id ? { ...answer, availability, note: "" } : answer)),
    )
  }

  const updateNote = (survey_date_id: string, note: string) => {
    setAnswers((prev) =>
      prev.map((answer) => (answer.survey_date_id === survey_date_id ? { ...answer, note } : answer)),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const supabase = createClient()

    try {
      // 各回答詳細を更新
      for (const answer of answers) {
        const { error: updateError } = await supabase
          .from("response_details")
          .update({
            availability: answer.availability,
            note: answer.availability === "maybe" ? answer.note : null,
          })
          .eq("id", answer.detail_id)

        if (updateError) throw updateError
      }

      // 回答の更新日時を更新
      const { error: responseError } = await supabase
        .from("responses")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", params.id)

      if (responseError) throw responseError

      router.push(`/surveys/${response?.survey_id}/results`)
    } catch (err) {
      console.error("[v0] Error updating response:", err)
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

  if (!response || !survey) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-destructive">回答が見つかりません</p>
      </div>
    )
  }

  const sortedDates = [...survey.survey_dates].sort(
    (a, b) => new Date(a.date_value).getTime() - new Date(b.date_value).getTime(),
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6 md:p-10">
        <div className="mb-6">
          <Link href={`/surveys/${response.survey_id}/results`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              結果画面に戻る
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">回答の編集</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            {response.respondent_name}さんの回答 - {survey.title}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>回答内容</CardTitle>
            <CardDescription>各日程の都合を変更できます</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {sortedDates.map((date) => {
                  const answer = answers.find((a) => a.survey_date_id === date.id)
                  const dateClassName = getDateClassName(date.date_value)

                  return (
                    <Card key={date.id}>
                      <CardHeader className="pb-3">
                        <CardTitle className={`text-lg ${dateClassName}`}>{formatDate(date.date_value)}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <RadioGroup
                          value={answer?.availability || "unavailable"}
                          onValueChange={(value) =>
                            updateAnswer(date.id, value as "available" | "maybe" | "unavailable")
                          }
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="available" id={`${date.id}-available`} />
                            <Label htmlFor={`${date.id}-available`} className="flex cursor-pointer items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span>参加できます</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="maybe" id={`${date.id}-maybe`} />
                            <Label htmlFor={`${date.id}-maybe`} className="flex cursor-pointer items-center gap-2">
                              <Circle className="h-4 w-4 text-yellow-600" />
                              <span>条件付きで参加できます</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="unavailable" id={`${date.id}-unavailable`} />
                            <Label
                              htmlFor={`${date.id}-unavailable`}
                              className="flex cursor-pointer items-center gap-2"
                            >
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span>参加できません</span>
                            </Label>
                          </div>
                        </RadioGroup>

                        {answer?.availability === "maybe" && (
                          <div className="space-y-2 pt-2">
                            <Label htmlFor={`${date.id}-note`} className="text-sm text-muted-foreground">
                              備考（任意）
                            </Label>
                            <Textarea
                              id={`${date.id}-note`}
                              placeholder="条件や理由を入力してください"
                              value={answer.note}
                              onChange={(e) => updateNote(date.id, e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "更新中..." : "変更を保存"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/surveys/${response.survey_id}/results`)}
                  disabled={isSubmitting}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <a
            href={`https://Schedo-contact.formn.net/?id=${response.survey_id}&title=${encodeURIComponent(survey.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            回答依頼フォームはこちら
          </a>
        </div>
      </div>
    </div>
  )
}
