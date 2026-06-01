export type Role = 'admin' | 'project_manager' | 'viewer'
export type ProjectStatus = 'active' | 'inactive' | 'archived'
export type TGStatus = 'draft' | 'live' | 'paused' | 'closed' | 'archived'
export type SessionStatus =
  | 'started'
  | 'prescreened'
  | 'completed'
  | 'terminated'
  | 'quota_full'
  | 'dropped'
  | 'fraud_hold'
  | 'never_reached_client'
  | 'security_terminated'
export type SessionQualityFlag = 'normal' | 'fast' | 'speeder' | 'slow'
export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type RespondentTier = 'bronze' | 'silver' | 'gold' | 'platinum'
export type ReportType = 'performance' | 'respondent_analysis' | 'reconciliation'
export type ReportLevel = 'target_group' | 'project' | 'account'
export type ReportStatus = 'processing' | 'completed' | 'failed'

export interface OrgUser {
  id: string
  org_id: string
  email: string
  full_name: string
  display_code: string
  role: Role
  is_active: boolean
}

export interface Project {
  id: string
  org_id: string
  business_unit_id: string
  name: string
  short_code: string
  customer_ref_number?: string
  status: ProjectStatus
  created_by: string
  last_activity_at?: string
  created_at: string
  updated_at: string
  target_group_count: number
}

export interface TGStats {
  entrants_count: number
  prescreens_count: number
  completes_count: number
  terminates_count: number
  dropouts_count: number
  conversion_rate?: string
  incidence_rate_actual?: string
  drop_off_rate?: string
  first_complete_at?: string
  last_complete_at?: string
  updated_at: string
}

export interface TargetGroup {
  id: string
  project_id: string
  name: string
  short_code: string
  status: TGStatus
  country_code?: string
  language_code?: string
  study_type: string
  completes_goal?: number
  expected_loi_minutes?: number
  expected_ir_pct?: number
  days_in_field: number
  start_date?: string
  end_date?: string
  timezone: string
  daily_start_time?: string
  daily_end_time?: string
  collects_pii: boolean
  base_cpi?: string
  budget_cap?: string
  boost_cpi?: string
  max_cpi?: string
  prevent_overfilling: boolean
  balanced_fill: boolean
  project_manager_id?: string
  industry?: string
  industry_lock_out: boolean
  live_survey_url?: string
  test_survey_url?: string
  launched_at?: string
  closed_at?: string
  last_complete_at?: string
  created_at: string
  updated_at: string
  stats?: TGStats
}

export interface FillRateEntry {
  date: string
  completes_count: number
  cumulative_completes: number
}

export interface ChangelogEntry {
  id: string
  changed_by: string
  change_type: string
  previous_value?: string
  new_value?: string
  created_at: string
}

export interface SessionRespondent {
  country_code?: string
  tier?: RespondentTier | string
  total_points?: number
  surveys_completed?: number
  interests?: string[]
}

export interface Session {
  id: string
  respondent_id?: string
  mode: string
  status: SessionStatus
  reason_label?: string
  completion_source?: string
  started_at: string
  completed_at?: string
  completion_time_ms?: number
  device_type?: DeviceType | string
  browser?: string
  os_name?: string
  quality_flag?: SessionQualityFlag | string | null
  speed_ratio?: number | null
  respondent?: SessionRespondent | null
}

export interface ProfileAttribute {
  id: string
  code: string
  category: string
  response_type: 'range' | 'single_punch' | 'multi_punch' | 'open_text'
  scope: string
  country_code?: string
  is_active: boolean
  sort_order: number
  options?: ProfileAttributeOption[]
  translations?: AttributeTranslation[]
}

export interface AttributeTranslation {
  language_code: string
  question_text: string
}

export interface ProfileAttributeOption {
  id: string
  code: string
  display_order: number
  is_active: boolean
  translations: { language_code: string; label: string }[]
}

export interface ProfileCondition {
  id: string
  option_id?: string
  range_min?: number
  range_max?: number
}

export interface TGProfile {
  id: string
  attribute_id: string
  quotas_enabled: boolean
  sort_order: number
  attribute: ProfileAttribute
  conditions: ProfileCondition[]
}

export interface RateCardEntry {
  id: string
  loi_min_minutes: number
  loi_max_minutes: number
  ir_min_pct: number
  ir_max_pct: number
  cpi_amount: string
}

export interface Report {
  id: string
  org_id: string
  report_type: ReportType
  level: ReportLevel
  reference_id: string
  reference_name: string
  date_from?: string
  date_to?: string
  status: ReportStatus
  requested_by: string
  file_url?: string
  row_count?: number
  created_at: string
  completed_at?: string
}

export type RedemptionStatus = 'pending' | 'approved' | 'rejected' | 'paid'

export interface Redemption {
  id: string
  respondent_id: string
  /** May be 0 when API omits points or uses an alternate field (normalized in lib/redemptions). */
  points: number
  method: string
  status: RedemptionStatus
  requested_at: string
  processed_at?: string
  rejection_note?: string
  created_at?: string
}

export interface CpiLookupResult {
  cpi_amount: string
  currency: string
  loi_bracket: string
  ir_bracket: string
}

export interface FeasibilityResult {
  feasible_count: number
  status: 'ok' | 'low' | 'at_risk' | 'unknown'
  base_population: number
  applied_ir_pct: number
  profiles_applied: number
  country_code: string
  completes_goal: number
}

export interface SessionSummaryRow {
  status: string
  reason_label: string | null
  description: string
  count: number
}

export interface LoginResponse {
  access_token: string
  token_type: string
}
