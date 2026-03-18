export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

export interface Model {
  id: string;
  model_name: string;
  input_cost_per_token: number | null;
  output_cost_per_token: number | null;
  tpm: number | null;
  rpm: number | null;
  litellm_updated_at: string | null;
  litellm_created_at: string | null;
  litellm_updated_by: string | null;
  litellm_created_by: string | null;
  general_model_name: string | null;
  release_date: string | null;
  context_length: number | null;
}

export interface Project {
  id: string;
  project_name: string;
  project_alias: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  member_count: number;
  model_count: number;
  my_role: "owner" | "member" | null;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: "owner" | "member";
  added_by: string | null;
  added_at: string;
  user: User | null;
}

export interface ProjectModelEntry {
  id: string;
  project_id: string;
  model_id: string;
  added_at: string;
  added_by: string | null;
  model: Model | null;
}

export interface Key {
  id: string;
  key_display: string;
  key_alias: string;
  key_token: string;
  project_id: string;
  user_id: string | null;
  type: "service" | "personal";
  spend: number;
  max_budget: number | null;
  expires: string | null;
  models: string[];
  created_at: string;
  updated_at: string;
  last_active: string | null;
  tpm_limit: number | null;
  rpm_limit: number | null;
  created_by: string;
}

export interface KeyCreateResponse extends Key {
  raw_key: string | null;
}

export interface AuthState {
  token: string | null;
  user: User | null;
}
