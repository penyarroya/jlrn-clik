export interface VoiceCommandAction {
  type: 'navigate' | 'speak' | 'execute' | 'input' | 'custom';
  payload?: {
    route?: string;
    message?: string;
    command?: string;
    params?: Record<string, any>;
    [key: string]: any;
  };
}