import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { formatDate, getDateClassName } from "@/lib/utils/date"
import { ArrowLeft, CheckCircle2, Circle, XCircle } from "lucide-react"
import { ResultsChart } from "@/components/results-chart"

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: survey, error: surveyError } = await supabase
    .from("surveys")
    .select(
      `
      *,
      survey_dates (*)
    `,
    )
    .eq("id", id)
    .single()

  if (surveyError || !survey) {
    notFound()
  }

  const { data: responses } = await supabase
    .from("responses")
    .select(
      `
      *,
      response_details (
        *,
        survey_dates (*)
      )
    `,
    )
    .eq("survey_id", id)
    .order("created_at", { ascending: false })

  const sortedDates = [...survey.survey_dates].sort(
    (a, b) => new Date(a.date_value).getTime() - new Date(b.date_value).getTime(),
  )

  // 集計データの作成
  const aggregatedData = sortedDates.map((date) => {
    const dateResponses = responses?.flatMap((r) => r.response_details.filter((rd) => rd.survey_date_id === date.id))

    const available = dateResponses?.filter((rd) => rd.availability === "available").length || 0
    const maybe = dateResponses?.filter((rd) => rd.availability === "maybe").length || 0
    const unavailable = dateResponses?.filter((rd) => rd.availability === "unavailable").length || 0

    return {
      date: date.date_value,
      dateId: date.id,
      available,
      maybe,
      unavailable,
      total: available + maybe + unavailable,
    }
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-6">
          <Link href={`/surveys/${id}/respond`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              戻る
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">集計結果</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            {survey.title} - {responses?.length || 0}件の回答
          </p>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>日程別集計グラフ</CardTitle>
              <CardDescription>各日程の参加可否の集計結果</CardDescription>
            </CardHeader>
            <CardContent>
              <ResultsChart data={aggregatedData} />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>回答一覧</CardTitle>
            <CardDescription>参加者ごとの回答詳細</CardDescription>
          </CardHeader>
          <CardContent>
            {responses && responses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left font-semibold">お名前</th>
                      {sortedDates.map((date) => (
                        <th key={date.id} className="p-3 text-center font-semibold">
                          <div className={`text-sm ${getDateClassName(date.date_value)}`}>
                            {formatDate(date.date_value)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response) => (
                      <tr key={response.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{response.respondent_name}</td>
                        {sortedDates.map((date) => {
                          const detail = response.response_details.find((rd) => rd.survey_date_id === date.id)
                          return (
                            <td key={date.id} className="p-3 text-center">
                              {detail?.availability === "available" && (
                                <div className="flex flex-col items-center gap-1">
                                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  <span className="text-xs text-muted-foreground">⚪︎</span>
                                </div>
                              )}
                              {detail?.availability === "maybe" && (
                                <div className="flex flex-col items-center gap-1">
                                  <Circle className="h-5 w-5 text-yellow-600" />
                                  <span className="text-xs text-muted-foreground">△</span>
                                  {detail.note && (
                                    <span className="text-xs text-muted-foreground" title={detail.note}>
                                      備考あり
                                    </span>
                                  )}
                                </div>
                              )}
                              {detail?.availability === "unavailable" && (
                                <div className="flex flex-col items-center gap-1">
                                  <XCircle className="h-5 w-5 text-red-600" />
                                  <span className="text-xs text-muted-foreground">×</span>
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">まだ回答がありません</div>
            )}
          </CardContent>
        </Card>

        {responses && responses.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>備考一覧</CardTitle>
              <CardDescription>条件付き参加の備考</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responses.map((response) => {
                  const notesDetails = response.response_details.filter((rd) => rd.availability === "maybe" && rd.note)
                  if (notesDetails.length === 0) return null

                  return (
                    <div key={response.id} className="rounded-md border p-4">
                      <h4 className="mb-2 font-semibold">{response.respondent_name}</h4>
                      <div className="space-y-2">
                        {notesDetails.map((detail) => {
                          const date = sortedDates.find((d) => d.id === detail.survey_date_id)
                          return (
                            <div key={detail.id} className="text-sm">
                              <span className={`font-medium ${date ? getDateClassName(date.date_value) : ""}`}>
                                {date ? formatDate(date.date_value) : ""}:
                              </span>{" "}
                              <span className="text-muted-foreground">{detail.note}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
