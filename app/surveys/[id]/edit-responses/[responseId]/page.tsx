import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { EditResponseForm } from "@/components/edit-response-form"

export default async function EditResponsePage({
  params,
}: {
  params: Promise<{ id: string; responseId: string }>
}) {
  const { id, responseId } = await params
  const supabase = await createClient()

  // 回答を取得
  const { data: response, error: responseError } = await supabase
    .from("responses")
    .select(
      `
      *,
      response_details (*)
    `,
    )
    .eq("id", responseId)
    .single()

  if (responseError || !response) {
    notFound()
  }

  // アンケートIDが一致するか確認
  if (response.survey_id !== id) {
    redirect(`/surveys/${response.survey_id}/edit-responses/${responseId}`)
  }

  // アンケートを取得
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

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6 md:p-10">
        <div className="mb-6">
          <Link href={`/surveys/${id}/edit-responses`}>
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              回答者一覧に戻る
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-balance text-4xl font-bold tracking-tight">回答の編集</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            {response.respondent_name}さんの回答 - {survey.title}
          </p>
        </div>

        <EditResponseForm response={response} survey={survey} />

        <div className="mt-6 text-center">
          <a
            href={`https://Schedo-contact.formn.net/?id=${id}&title=${encodeURIComponent(survey.title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ExternalLink className="h-4 w-4" />
            回答依頼フォームはこちら
          </a>
        </div>
      </div>
    </div>
  )
}
