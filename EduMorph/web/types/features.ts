// Student Progress Tracking Types
export interface StudentProgress {
  studentId: string;
  subject: string;
  topic: string;
  completedAt: Date;
  score: number;
  timeSpent: number; // minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  attempts: number;
}

export interface LearningGap {
  studentId: string;
  subject: string;
  topic: string;
  weakPoints: string[];
  suggestedResources: string[];
  priority: "high" | "medium" | "low";
  identifiedAt: Date;
}

export interface PerformanceMetrics {
  studentId: string;
  overallScore: number;
  subjectScores: { [subject: string]: number };
  strengths: string[];
  weaknesses: string[];
  learningVelocity: number; // topics per week
  consistency: number; // 0-100
  lastUpdated: Date;
}

// Study Path Types
export interface StudyPathStep {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number; // minutes
  prerequisites: string[];
  resources: Resource[];
  completed: boolean;
  order: number;
}

export interface Resource {
  id: string;
  type: "video" | "article" | "exercise" | "quiz";
  title: string;
  url: string;
  duration?: number;
}

// Analytics Types
export interface AnalyticsInsight {
  type: "strength" | "weakness" | "recommendation" | "achievement";
  title: string;
  description: string;
  actionItems: string[];
  createdAt: Date;
}

// Report Types
export interface StudentReport {
  studentId: string;
  reportId: string;
  period: { start: Date; end: Date };
  overallGrade: string;
  subjects: SubjectReport[];
  attendance: number;
  behavioralNotes: string[];
  recommendations: string[];
  generatedAt: Date;
}

export interface SubjectReport {
  subject: string;
  grade: string;
  score: number;
  topicsCompleted: number;
  topicsTotal: number;
  strengths: string[];
  improvements: string[];
}

// Matchmaking Types
export interface StudyMatch {
  matchId: string;
  student1: string;
  student2: string;
  commonSubjects: string[];
  compatibilityScore: number;
  studyPreferences: StudyPreferences;
  matchedAt: Date;
}

export interface StudyPreferences {
  subjects: string[];
  studyTime: "morning" | "afternoon" | "evening" | "night";
  studyStyle: "visual" | "auditory" | "kinesthetic" | "reading";
  goals: string[];
}

// Dashboard Types
export interface DashboardData {
  role: "student" | "teacher";
  stats: DashboardStats;
  recentActivity: Activity[];
  upcomingTasks: Task[];
}

export interface DashboardStats {
  totalStudents?: number;
  totalHours: number;
  averageScore: number;
  completedLessons: number;
  streakDays: number;
}

export interface Activity {
  id: string;
  type: "lesson" | "quiz" | "assignment" | "achievement";
  title: string;
  timestamp: Date;
  metadata?: any;
}

export interface Task {
  id: string;
  title: string;
  dueDate: Date;
  priority: "high" | "medium" | "low";
  completed: boolean;
}
