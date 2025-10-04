export type Survey = {
  id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export type SurveyDate = {
  id: string
  survey_id: string
  date_value: string
  created_at: string
}

export type Response = {
  id: string
  survey_id: string
  respondent_name: string
  cookie_id: string | null
  created_at: string
  updated_at: string
}

export type ResponseDetail = {
  id: string
  response_id: string
  survey_date_id: string
  availability: "available" | "maybe" | "unavailable"
  note: string | null
  created_at: string
}

export type SurveyWithDates = Survey & {
  survey_dates: SurveyDate[]
}

export type ResponseWithDetails = Response & {
  response_details: ResponseDetail[]
}
