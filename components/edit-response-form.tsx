"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { createClient } from "@/lib/supabase/client"
import { getDateClassName, formatDate } from "@/lib/utils/date"
import type { ResponseWithDetails, SurveyWithDates } from "@/lib/types"
import { CheckCircle2, Circle, XCircle } from "lucide-react"

type AvailabilityAnswer = {
  detail_id: string
  survey_date_id: string
  availability: "available" | "maybe" | "unavailable"
  note: string
}

type EditResponseFormProps = {
  response: ResponseWithDetails
  survey: SurveyWithDates
}

export function EditResponseForm({ response, survey }: EditResponseFormProps) {
  const router = useRouter()
  const [answers, setAnswers] = useState<AvailabilityAnswer[]>(() => {
    return response.response_details.map((detail) => ({
      detail_id: detail.id,
      survey_date_id: detail.survey_date_id,
      availability: detail.availability,
      note: detail.note || "",
    }))
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateAnswer = (survey_date_id: string, availability: "available" | "maybe" | "unavailable") => {
    console.log("[v0] updateAnswer called with:", { survey_date_id, availability })
    setAnswers((prev) => {
      const updated = prev.map((answer) => {
        if (answer.survey_date_id === survey_date_id) {
          console.log("[v0] Updating answer for date:", survey_date_id)
          return { ...answer, availability, note: availability === "maybe" ? answer.note : "" }
        }
        return answer
      })
      console.log("[v0] New answers state:", updated)
      return updated
    })
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
        .eq("id", response.id)

      if (responseError) throw responseError

      router.push(`/surveys/${response.survey_id}/edit-responses`)
      router.refresh()
    } catch (err) {
      console.error("[v0] Error updating response:", err)
      setError(err instanceof Error ? err.message : "エラーが発生しました")
    } finally {
      setIsSubmitting(false)
    }
  }

  const sortedDates = [...survey.survey_dates].sort(
    (a, b) => new Date(a.date_value).getTime() - new Date(b.date_value).getTime(),
  )

  console.log("[v0] Initial answers:", answers)
  console.log(
    "[v0] Sorted dates:",
    sortedDates.map((d) => ({ id: d.id, date: d.date_value })),
  )

  return (
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

              console.log("[v0] Rendering date:", { dateId: date.id, answer })

              return (
                <Card key={date.id} className="bg-gradient-to-br from-purple-50/50 to-pink-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className={`text-lg ${dateClassName}`}>{formatDate(date.date_value)}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <RadioGroup
                      key={`radio-${date.id}`}
                      name={`availability-${date.id}`}
                      value={answer?.availability || "unavailable"}
                      onValueChange={(value) => {
                        console.log("[v0] RadioGroup onValueChange:", { dateId: date.id, value })
                        updateAnswer(date.id, value as "available" | "maybe" | "unavailable")
                      }}
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
                        <Label htmlFor={`${date.id}-unavailable`} className="flex cursor-pointer items-center gap-2">
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
              onClick={() => router.push(`/surveys/${response.survey_id}/edit-responses`)}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
