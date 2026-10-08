export interface RateRow {
  key: string | number;
  label: string;
  employees: number;
  left: number;
  stayed: number;
  rate: number | null;
  low_sample: boolean;
}
export interface RateResponse {
  overall_rate: number | null;
  min_group_size: number;
  rows: RateRow[];
}
export interface Kpis {
  total_employees: number;
  employees_left: number;
  employees_remaining: number;
  attrition_rate: number | null;
  avg_monthly_income: number | null;
  avg_years_at_company: number | null;
  avg_job_satisfaction: number | null;
  avg_age: number | null;
}
export interface DataQuality {
  total_records: number;
  total_columns: number;
  missing_values: number;
  duplicate_records: number;
  duplicate_employee_numbers: number;
  invalid_values: number;
  columns_dropped: string[];
  rows_removed: number;
  issues: { check: string; count: number; action: string }[];
  transformations: string[];
}
export interface DashboardResponse {
  kpis: Kpis;
  distribution: { label: string; value: number }[];
  data_quality: DataQuality | null;
}
export interface Correlation {
  key: string;
  label: string;
  pearson_r: number;
  p_value: number;
  spearman_rho: number;
  strength: string;
  direction: string;
  mean_left: number;
  mean_stayed: number;
}
export interface AttritionResponse {
  overall_rate: number | null;
  overtime: RateResponse;
  business_travel: RateResponse;
  age_group: RateResponse;
  distance_group: RateResponse;
  gender: RateResponse;
  education: RateResponse;
  correlations: Correlation[];
}
export interface SatisfactionResponse {
  job_satisfaction: RateResponse;
  work_life_balance: RateResponse;
  environment_satisfaction: RateResponse;
}
export interface IncomeStats { n: number; mean: number; median: number; q1: number; q3: number; min: number; max: number }
export interface CompensationResponse {
  overall_rate: number | null;
  stayed: IncomeStats | null;
  left: IncomeStats | null;
  mean_difference_pct: number | null;
  histogram: { label: string; stayed: number; left: number; stayed_pct: number; left_pct: number }[];
  by_job_level: RateRow[];
  by_income_band: RateRow[];
}
export interface TenureResponse {
  tenure_group: RateResponse;
  promotion_group: RateResponse;
  experience_group: RateResponse;
  career_comparison: {
    key: string; label: string;
    stayed_mean: number | null; left_mean: number | null;
    stayed_median: number | null; left_median: number | null;
  }[];
}
export interface Insight { id: string; category: string; text: string; verdict: string; level: string }
export interface Recommendation { id: string; text: string; evidence: string }
export interface Segment { segment: string; employees: number; left: number; rate: number; lift: number | null }
export interface InsightsResponse {
  min_group_size: number;
  message?: string;
  insights: Insight[];
  recommendations: Recommendation[];
  segments: { min_group_size: number; rows: Segment[]; overall_rate?: number };
}
export interface EmployeeRow {
  employee_number: number; age: number; department: string; job_role: string; monthly_income: number;
  over_time: string; years_at_company: number; job_satisfaction: number; work_life_balance: number; attrition: string;
}
export interface EmployeesResponse { total: number; page: number; page_size: number; pages: number; rows: EmployeeRow[] }

export const FILTER_KEYS = [
  "department", "job_role", "gender", "overtime", "business_travel",
  "education", "job_satisfaction", "work_life_balance", "age_group", "tenure_group",
] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];
export type Filters = Record<FilterKey, string>;
export type FilterOptions = Record<FilterKey, { value: string; label: string }[]>;
