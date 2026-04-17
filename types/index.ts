export type ReviewModel = 'claude-haiku-4-5' | 'claude-sonnet-4-6';

export type ReviewScope = 'quality' | 'security' | 'style';

export interface ReviewRequest {
  diff: string;
  model: ReviewModel;
  scopes: ReviewScope[];
}

export interface GitHubRepo {
  full_name: string;
  name: string;
  owner: string;
  private: boolean;
  updated_at: string;
}

export interface GitHubPR {
  number: number;
  title: string;
  html_url: string;
  user: string;
  created_at: string;
  changed_files: number;
  additions: number;
  deletions: number;
}
