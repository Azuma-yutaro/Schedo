import { notFound } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, Edit } from "lucide-react"

export default async function EditResponsesListPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  // アンケート情報を取得
  const { data: survey, error: surveyError } = await supabase.from("surveys").select("*").eq("id", id).single()

  if (surveyError || !survey) {
    notFound()
  }

  // このアンケートの全回答を取得
  const { data: responses, error: responsesError } = await supabase
    .from("responses")
    .select("*")
    .eq("survey_id", id)
    .order("created_at", { ascending: false })

  if (responsesError) {
    console.error("[v0] Error fetching responses:", responsesError)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl p-6 md:p-10">
        <div className="mb-6">
          <Link href={`/surveys/${id}`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              アンケート詳細に戻る
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">回答者一覧</h1>
          <p className="mt-2 text-pretty text-muted-foreground">{survey.title}</p>
        </div>

        {!responses || responses.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <p className="text-muted-foreground">まだ回答がありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {responses.map((response) => (
              <Link key={response.id} href={`/surveys/${id}/edit-responses/${response.id}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{response.respondent_name}</CardTitle>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardDescription>
                      回答日時: {new Date(response.created_at).toLocaleString("ja-JP")}
                      {response.updated_at !== response.created_at && (
                        <span className="ml-2 text-xs">
                          (更新: {new Date(response.updated_at).toLocaleString("ja-JP")})
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
