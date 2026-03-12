export interface Asset {
  id: number;
  name: string;
  type: string;
  description: string;
  owner: string;
}

export interface Risk {
  id: number;
  asset_id: number;
  asset_name?: string;
  threat: string;
  vulnerability: string;
  likelihood: number;
  impact: number;
  risk_score: number;
  risk_level: string;
  mitigation_strategy: string;
}
