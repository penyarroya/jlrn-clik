export interface DictationResult {
  success: boolean;
  text: string;
  originalText: string;
  processedText: string;
  parts?: string[];
}