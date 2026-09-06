export interface FilterResult {
  valid: boolean;
  text?: string;
  reason?: string;
  isWakeWord?: boolean;
  similarity?: number;
}