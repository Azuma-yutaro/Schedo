import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { formatDate } from "@/lib/utils/date"
import { Calendar, Plus } from "lucide-react"

export default async function HomePage() {
  const supabase = await createClient()

  const { data: surveys, error } = await supabase
    .from("surveys")
    .select(
      `
      *,
      survey_dates (*)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching surveys:", error)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl p-6 md:p-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-balance text-4xl font-bold tracking-tight">Schedo</h1>
            <p className="mt-2 text-pretty text-muted-foreground">イベントの日程を簡単に調整できるツールです</p>
          </div>
          <Link href="/surveys/create">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              新規作成
            </Button>
          </Link>
        </div>

        {surveys && surveys.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {surveys.map((survey) => (
              <Link key={survey.id} href={`/surveys/${survey.id}`}>
                <Card className="transition-all hover:shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-balance">{survey.title}</CardTitle>
                    {survey.description && (
                      <CardDescription className="text-pretty line-clamp-2">{survey.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{survey.survey_dates?.length || 0}件の日程候補</span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">作成日: {formatDate(survey.created_at)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">アンケートがありません</h3>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                新しいアンケートを作成して、日程調整を始めましょう
              </p>
              <Link href="/surveys/create">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  新規作成
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
