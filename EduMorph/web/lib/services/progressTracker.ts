import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type {
  StudentProgress,
  LearningGap,
  PerformanceMetrics,
} from "@/types/features";

export class ProgressTracker {
  /**
   * Record student progress for a completed activity
   */
  static async recordProgress(progress: Omit<StudentProgress, "completedAt">) {
    const progressData: StudentProgress = {
      ...progress,
      completedAt: new Date(),
    };

    const progressRef = doc(collection(db, "progress"));
    await setDoc(progressRef, {
      ...progressData,
      completedAt: Timestamp.fromDate(progressData.completedAt),
    });

    // Update performance metrics
    await this.updatePerformanceMetrics(progress.studentId);

    return progressData;
  }

  /**
   * Get all progress for a student
   */
  static async getStudentProgress(
    studentId: string,
  ): Promise<StudentProgress[]> {
    const q = query(
      collection(db, "progress"),
      where("studentId", "==", studentId),
      orderBy("completedAt", "desc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        completedAt: data.completedAt.toDate(),
      } as StudentProgress;
    });
  }

  /**
   * Identify learning gaps based on progress and performance
   */
  static async identifyLearningGaps(studentId: string): Promise<LearningGap[]> {
    const progress = await this.getStudentProgress(studentId);

    const gapMap = new Map<string, LearningGap>();

    // Analyze progress for patterns
    progress.forEach((item) => {
      const key = `${item.subject}-${item.topic}`;

      if (item.score < 60 || item.attempts > 2) {
        const existingGap = gapMap.get(key);

        if (!existingGap) {
          const gap: LearningGap = {
            studentId,
            subject: item.subject,
            topic: item.topic,
            weakPoints: [],
            suggestedResources: [],
            priority: item.score < 40 ? "high" : item.score < 60 ? "medium" : "low",
            identifiedAt: new Date(),
          };

          // Generate suggested resources based on difficulty
          gap.suggestedResources = this.generateSuggestedResources(
            item.subject,
            item.topic,
            item.difficulty,
          );

          gapMap.set(key, gap);
        }
      }
    });

    // Save gaps to database
    const gaps = Array.from(gapMap.values());
    for (const gap of gaps) {
      const gapRef = doc(
        collection(db, "learningGaps"),
        `${gap.studentId}-${gap.subject}-${gap.topic}`,
      );
      await setDoc(
        gapRef,
        {
          ...gap,
          identifiedAt: Timestamp.fromDate(gap.identifiedAt),
        },
        { merge: true },
      );
    }

    return gaps;
  }

  /**
   * Update performance metrics for a student
   */
  private static async updatePerformanceMetrics(studentId: string) {
    const progress = await this.getStudentProgress(studentId);

    if (progress.length === 0) return;

    // Calculate overall score
    const overallScore =
      progress.reduce((sum, p) => sum + p.score, 0) / progress.length;

    // Calculate subject scores
    const subjectScores: { [key: string]: number } = {};
    const subjectCounts: { [key: string]: number } = {};

    progress.forEach((p) => {
      if (!subjectScores[p.subject]) {
        subjectScores[p.subject] = 0;
        subjectCounts[p.subject] = 0;
      }
      subjectScores[p.subject] += p.score;
      subjectCounts[p.subject]++;
    });

    Object.keys(subjectScores).forEach((subject) => {
      subjectScores[subject] /= subjectCounts[subject];
    });

    // Identify strengths and weaknesses
    const strengths = Object.entries(subjectScores)
      .filter(([_, score]) => score >= 75)
      .map(([subject]) => subject);

    const weaknesses = Object.entries(subjectScores)
      .filter(([_, score]) => score < 60)
      .map(([subject]) => subject);

    // Calculate learning velocity (topics per week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const recentProgress = progress.filter(
      (p) => p.completedAt >= oneWeekAgo,
    );
    const learningVelocity = recentProgress.length;

    // Calculate consistency (based on regular study pattern)
    const consistency = this.calculateConsistency(progress);

    const metrics: PerformanceMetrics = {
      studentId,
      overallScore,
      subjectScores,
      strengths,
      weaknesses,
      learningVelocity,
      consistency,
      lastUpdated: new Date(),
    };

    const metricsRef = doc(db, "performanceMetrics", studentId);
    await setDoc(metricsRef, {
      ...metrics,
      lastUpdated: Timestamp.fromDate(metrics.lastUpdated),
    });

    return metrics;
  }

  /**
   * Calculate consistency score based on study patterns
   */
  private static calculateConsistency(progress: StudentProgress[]): number {
    if (progress.length < 7) return 50; // Not enough data

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const recentProgress = progress.filter(
      (p) => p.completedAt >= last30Days,
    );

    if (recentProgress.length === 0) return 0;

    // Group by day
    const dayMap = new Map<string, number>();
    recentProgress.forEach((p) => {
      const day = p.completedAt.toISOString().split("T")[0];
      dayMap.set(day, (dayMap.get(day) || 0) + 1);
    });

    const activeDays = dayMap.size;
    const consistency = Math.min(100, (activeDays / 30) * 100);

    return Math.round(consistency);
  }

  /**
   * Generate suggested resources based on subject and difficulty
   */
  private static generateSuggestedResources(
    subject: string,
    topic: string,
    difficulty: string,
  ): string[] {
    return [
      `Review ${difficulty} level materials for ${topic}`,
      `Practice exercises on ${topic}`,
      `Watch tutorial videos about ${subject} - ${topic}`,
      `Join study group for ${subject}`,
    ];
  }

  /**
   * Get performance metrics for a student
   */
  static async getPerformanceMetrics(
    studentId: string,
  ): Promise<PerformanceMetrics | null> {
    const metricsRef = doc(db, "performanceMetrics", studentId);
    const metricsSnap = await getDoc(metricsRef);

    if (!metricsSnap.exists()) {
      // Generate new metrics
      return await this.updatePerformanceMetrics(studentId);
    }

    const data = metricsSnap.data();
    return {
      ...data,
      lastUpdated: data.lastUpdated.toDate(),
    } as PerformanceMetrics;
  }
}
