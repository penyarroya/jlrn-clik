export interface DuplicateCheckResult {
  valid: boolean;
  reason?: string;
  similarity?: number;
}