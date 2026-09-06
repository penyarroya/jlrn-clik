export interface FieldConfig {
  name: string;
  label: string;
  synonyms: string[];
  type: 'text' | 'password' | 'email' | 'number' | 'phone' | 'date' | 'search' | 'textarea';
  maxLength?: number;
  minLength?: number;
  pattern?: RegExp;
  placeholder?: string;
}