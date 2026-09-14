// src/app/features/pages/public/dashboard-v2/models/project-config.model.ts

export interface ProjectConfig {
  projectId: string;
  projectName: string;
  projectDescription: string;
  projectIcon: string;
  themeColor: string;
  welcomeMessage: string;
  greetingMessage: string;
  backgroundImage: string;
  statsCards: StatsCard[];
  courses: Course[];
  quickActions: QuickAction[];
  voiceCommands: VoiceCommand[];
  messages: SystemMessage[];
}

export interface StatsCard {
  icon: string;
  label: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendIcon?: string;
  gradient?: string;
}

export interface Course {
  id: string;
  title: string;
  instructor: string;
  progress: number;
  status: 'completed' | 'in-progress' | 'not-started' | 'pending';
  nextClass?: Date;
  category: string;
  thumbnail?: string;
}

export interface QuickAction {
  label: string;
  icon: string;
  route: string;
  voiceCommand: string[];
  description: string;
  badge?: 'new' | 'popular' | 'beta' | '';
}

export interface VoiceCommand {
  command: string;
  keywords: string[];
  action: string;
  description: string;
}

export interface SystemMessage {
  id: number;
  sender: string;
  avatar: string;
  content: string;
  time: string;
  unread: number;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  route?: string;
  roles?: string[];
}