export interface VoiceCommandResult {
  handled: boolean;
  action?: 'dictate' | 'submit' | 'clear' | 'navigate' | 'cancel' | 'help' | 'back' | 'custom';
  target?: string;
  value?: string;
  message?: string;
  isFinish?: boolean;
}