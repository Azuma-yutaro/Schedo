"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createClient } from "@/lib/supabase/client"
import { getCookieId } from "@/lib/utils/cookie"
import { getDateClassName, formatDate } from "@/lib/utils/date"
import type { SurveyDate, SurveyWithDates } from "@/lib/types"
import { CheckCircle2, Triangle, XCircle, ExternalLink } from "lucide-react"
import Link from "next/link"

type AvailabilityAnswer = {
  survey_date_id: string
  availability: "available" | "maybe" | "unavailable"
  note: string
}

export default function RespondPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [survey, setSurvey] = useState<SurveyWithDates | null>(null)
  const [name, setName] = useState("")
  const [answers, setAnswers] = useState<AvailabilityAnswer[]>([])
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
        // 初期化: すべての日程に対して「参加できる」状態を作成
        const initialAnswers = data.survey_dates.map((date: SurveyDate) => ({
          survey_date_id: date.id,
          availability: "available" as const,
          note: "",
        }))
        setAnswers(initialAnswers)
      }
      setIsLoading(false)
    }

    fetchSurvey()
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
      // バリデーション
      if (!name.trim()) {
        throw new Error("お名前を入力してください")
      }

      // 重複チェック
      const { data: existingResponses } = await supabase
        .from("responses")
        .select("respondent_name")
        .eq("survey_id", params.id)
        .eq("respondent_name", name.trim())

      if (existingResponses && existingResponses.length > 0) {
        throw new Error("この名前は既に使用されています。別の名前を入力してください。")
      }

      const cookieId = getCookieId()

      // 回答を作成
      const { data: response, error: responseError } = await supabase
        .from("responses")
        .insert({
          survey_id: params.id,
          respondent_name: name.trim(),
          cookie_id: cookieId,
        })
        .select()
        .single()

      if (responseError) throw responseError

      // 回答詳細を作成
      const responseDetails = answers.map((answer) => ({
        response_id: response.id,
        survey_date_id: answer.survey_date_id,
        availability: answer.availability,
        note: answer.availability === "maybe" ? answer.note : null,
      }))

      const { error: detailsError } = await supabase.from("response_details").insert(responseDetails)

      if (detailsError) throw detailsError

      // localStorageに保存（編集用）
      if (typeof window !== "undefined") {
        const savedResponses = JSON.parse(localStorage.getItem("my_responses") || "[]")
        savedResponses.push({
          survey_id: params.id,
          response_id: response.id,
          respondent_name: name.trim(),
        })
        localStorage.setItem("my_responses", JSON.stringify(savedResponses))
      }

      router.push(`/surveys/${params.id}/results`)
    } catch (err) {
      console.error("[v0] Error submitting response:", err)
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

  const sortedDates = [...survey.survey_dates].sort(
    (a: SurveyDate, b: SurveyDate) => new Date(a.date_value).getTime() - new Date(b.date_value).getTime(),
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6 md:p-10">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold tracking-tight text-[#d4c5f9] hover:text-[#c5b3e8] transition-colors"
          >
            Schedo
          </Link>
          <Link href={`/surveys/${params.id}/results`}>
            <Button variant="outline" className="gap-2 bg-transparent">
              結果画面を見る
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">{survey.title}</h1>
          {survey.description && <p className="mt-2 text-pretty text-muted-foreground">{survey.description}</p>}
        </div>

        <Card className="border-[#d4c5f9]/50 shadow-lg shadow-[#d4c5f9]/10">
          <CardHeader className="bg-gradient-to-br from-[#d4c5f9]/10 to-[#ffc9e0]/10">
            <CardTitle>回答フォーム</CardTitle>
            <CardDescription>お名前と各日程の都合を選択してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">お名前 *</Label>
                <Input
                  id="name"
                  placeholder="山田太郎"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="border-[#d4c5f9]/30 focus-visible:ring-[#d4c5f9]"
                />
              </div>

              <div className="space-y-4">
                <Label>日程の都合</Label>
                {sortedDates.map((date: SurveyDate) => {
                  const answer = answers.find((a) => a.survey_date_id === date.id)
                  const dateClassName = getDateClassName(date.date_value)

                  return (
                    <Card key={date.id} className="border-[#d4c5f9]/30">
                      <CardHeader className="pb-3 bg-gradient-to-r from-[#d4c5f9]/5 to-transparent">
                        <CardTitle className={`text-lg ${dateClassName}`}>{formatDate(date.date_value)}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <RadioGroup
                          value={answer?.availability || "available"}
                          onValueChange={(value) =>
                            updateAnswer(date.id, value as "available" | "maybe" | "unavailable")
                          }
                        >
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="available" id={`${date.id}-available`} className="h-5 w-5" />
                            <Label
                              htmlFor={`${date.id}-available`}
                              className="flex cursor-pointer items-center gap-2 text-base"
                            >
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                              <span>参加できる</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="maybe" id={`${date.id}-maybe`} className="h-5 w-5" />
                            <Label
                              htmlFor={`${date.id}-maybe`}
                              className="flex cursor-pointer items-center gap-2 text-base"
                            >
                              <Triangle className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                              <span>条件付きで参加できる</span>
                            </Label>
                          </div>
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="unavailable" id={`${date.id}-unavailable`} className="h-5 w-5" />
                            <Label
                              htmlFor={`${date.id}-unavailable`}
                              className="flex cursor-pointer items-center gap-2 text-base"
                            >
                              <XCircle className="h-5 w-5 text-red-600" />
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
                              placeholder="条件や理由を入力"
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

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#d4c5f9] hover:bg-[#c5b3e8] text-black"
              >
                {isSubmitting ? "送信中..." : "回答を送信"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <a
            href={`https://Schedo-contact.formn.net/?id=${params.id}&title=${encodeURIComponent(survey.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            回答の変更依頼はこちら
          </a>
        </div>
      </div>
    </div>
  )
}
