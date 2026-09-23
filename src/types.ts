export interface Article {
  id: string;
  title: string;
  content: string;
  sourceUrl?: string;
  priority: 'high' | 'normal';
  category?: string;
  estimatedReadTimeMinutes?: number;
  addedAt: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
  style?: string;
}

export interface Chapter {
  id: string;
  storyTitle: string;
  originalArticleTitle?: string;
  keyTakeaways: string[];
  whyItMatters: string;
  startTimeSeconds?: number;
  durationSeconds?: number;
  dialogue: DialogueLine[];
}

export interface Briefing {
  id: string;
  createdAt: string;
  title: string;
  headline: string;
  estimatedMinutes: number;
  actualDurationSeconds: number;
  executiveSummary: string;
  chapters: Chapter[];
  fullAudioWavBase64?: string;
  style: 'podcast_duo' | 'npr_anchor' | 'executive_summary' | 'casual_commute';
  voiceA: string;
  voiceB: string;
}

export interface CommuterProfile {
  role: string;
  industry: string;
  interests: string[];
}

export type CommuteStyle = 'podcast_duo' | 'npr_anchor' | 'executive_summary' | 'casual_commute';

export interface VoiceOption {
  id: string;
  name: string;
  gender: 'Female' | 'Male' | 'Neutral';
  tone: string;
}
