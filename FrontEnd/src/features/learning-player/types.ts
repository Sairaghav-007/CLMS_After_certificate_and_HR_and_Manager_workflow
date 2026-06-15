export interface LearningNote {
  id: string;
  courseId: string;
  moduleId: string;
  resourceId: string;
  moduleName: string;
  courseName: string;
  timestamp: number;
  note: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerSettings {
  quality: 'auto' | '1080p' | '720p' | '480p';
  playbackSpeed: number;
}

export interface LearningAnalytics {
  notesCount: number;
  revisitedTimestamps: { timestamp: number; count: number }[];
  learningPauses: number;
  mostDifficultModules: { moduleId: string; noteCount: number }[];
}
