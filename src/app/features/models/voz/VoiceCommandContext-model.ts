import { FieldConfig } from "./FieldConfig-model";

export interface VoiceCommandContext {
  componentName: string;
  fields: FieldConfig[];
  customCommands?: {
    [key: string]: (text: string) => boolean | void;
  };
  onNavigate?: (route: string) => void;
  onSubmit?: () => void;
  onClear?: () => void;
  onCancel?: () => void;
}