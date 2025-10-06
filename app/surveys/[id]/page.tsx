import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils/date"
import { ArrowLeft, Edit, ExternalLink } from "lucide-react"
import type { SurveyDate } from "@/lib/types"

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: survey, error } = await supabase
    .from("surveys")
    .select(
      `
      *,
      survey_dates (*)
    `,
    )
    .eq("id", id)
    .single()

  if (error || !survey) {
    notFound()
  }

  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("survey_id", id)
    .order("created_at", { ascending: false })

  const responseCount = responses?.length || 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-6 md:p-10">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              一覧に戻る
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-balance text-4xl font-bold tracking-tight">{survey.title}</h1>
              {survey.description && <p className="mt-2 text-pretty text-muted-foreground description">{survey.description}</p>}
            </div>
            <Link href={`/surveys/${id}/edit`}>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Edit className="h-4 w-4" />
                編集
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>回答する</CardTitle>
              <CardDescription>あなたの都合の良い日程を選択してください</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/surveys/${id}/respond`}>
                <Button className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  回答画面を開く
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>結果を見る</CardTitle>
              <CardDescription>現在 {responseCount} 件の回答があります</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/surveys/${id}/results`}>
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  <ExternalLink className="h-4 w-4" />
                  結果画面を開く
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>回答を編集</CardTitle>
              <CardDescription>回答者一覧から編集できます</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/surveys/${id}/edit-responses`}>
                <Button variant="outline" className="w-full gap-2 bg-transparent">
                  <Edit className="h-4 w-4" />
                  回答者一覧を開く
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>日程候補</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {survey.survey_dates
                ?.sort((a: SurveyDate, b: SurveyDate) => new Date(a.date_value).getTime() - new Date(b.date_value).getTime())
                .map((date: SurveyDate) => (
                  <div key={date.id} className="rounded-md border p-3">
                    <p className="font-medium">{formatDate(date.date_value)}</p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
