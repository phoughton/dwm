export interface BatchRequestCounts {
  total: number;
  completed: number;
  failed: number;
}

export interface Batch {
  id: string;
  object: string;
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'expired';
  created_at: number;
  completed_at: number | null;
  failed_at: number | null;
  cancelled_at: number | null;
  input_file_id: string;
  output_file_id: string | null;
  error_file_id: string | null;
  endpoint: string;
  completion_window: string;
  request_counts: BatchRequestCounts;
  metadata: Record<string, string> | null;
}

export interface BatchListResponse {
  data: Batch[];
  has_more: boolean;
  first_id: string | null;
  last_id: string | null;
}
