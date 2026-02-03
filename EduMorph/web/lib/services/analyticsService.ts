import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type {
  AnalyticsInsight,
  StudentReport,
  SubjectReport,
} from "@/types/features";
import { ProgressTracker } from "./progressTracker";

export class AnalyticsService {
  /**
   * Generate performance insights for a student
   */
  static async generateInsights(studentId: string): Promise<AnalyticsInsight[]> {
    const metrics = await ProgressTracker.getPerformanceMetrics(studentId);
    const gaps = await ProgressTracker.identifyLearningGaps(studentId);

    if (!metrics) return [];

    const insights: AnalyticsInsight[] = [];

    // Achievement insights
    metrics.strengths.forEach((strength) => {
      insights.push({
        type: "achievement",
        title: `Excelling in ${strength}`,
        description: `You're performing excellently in ${strength}! Keep up the great work.`,
        actionItems: [
          `Consider helping peers with ${strength}`,
          "Try advanced materials to challenge yourself",
        ],
        createdAt: new Date(),
      });
    });

    // Weakness insights with recommendations
    metrics.weaknesses.forEach((weakness) => {
      const relatedGaps = gaps.filter((g) => g.subject === weakness);
      insights.push({
        type: "weakness",
        title: `Improvement needed in ${weakness}`,
        description: `Focus on strengthening your understanding of ${weakness}.`,
        actionItems: relatedGaps.length > 0
          ? relatedGaps[0].suggestedResources
          : [
              `Schedule dedicated study time for ${weakness}`,
              `Seek help from teacher or tutor`,
              `Practice with additional exercises`,
            ],
        createdAt: new Date(),
      });
    });

    // Study pattern recommendations
    if (metrics.consistency < 50) {
      insights.push({
        type: "recommendation",
        title: "Improve Study Consistency",
        description: "Regular study sessions lead to better retention and understanding.",
        actionItems: [
          "Set a daily study schedule",
          "Use calendar reminders",
          "Start with small, manageable sessions",
        ],
        createdAt: new Date(),
      });
    }

    if (metrics.learningVelocity < 3) {
      insights.push({
        type: "recommendation",
        title: "Increase Learning Pace",
        description: "Try to cover more topics each week for faster progress.",
        actionItems: [
          "Allocate more study time each day",
          "Break complex topics into smaller parts",
          "Use active learning techniques",
        ],
        createdAt: new Date(),
      });
    }

    // Save insights
    const insightsRef = doc(db, "insights", studentId);
    await setDoc(insightsRef, {
      studentId,
      insights: insights.map((i) => ({
        ...i,
        createdAt: Timestamp.fromDate(i.createdAt),
      })),
      generatedAt: Timestamp.now(),
    });

    return insights;
  }

  /**
   * Generate comprehensive student report
   */
  static async generateStudentReport(
    studentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<StudentReport> {
    const progress = await ProgressTracker.getStudentProgress(studentId);
    const metrics = await ProgressTracker.getPerformanceMetrics(studentId);

    if (!metrics) {
      throw new Error("No performance data available");
    }

    // Filter progress within date range
    const periodProgress = progress.filter(
      (p) => p.completedAt >= startDate && p.completedAt <= endDate,
    );

    // Group by subject
    const subjectMap = new Map<string, StudentProgress[]>();
    periodProgress.forEach((p) => {
      if (!subjectMap.has(p.subject)) {
        subjectMap.set(p.subject, []);
      }
      subjectMap.get(p.subject)!.push(p);
    });

    // Generate subject reports
    const subjects: SubjectReport[] = Array.from(subjectMap.entries()).map(
      ([subject, progressList]) => {
        const avgScore =
          progressList.reduce((sum, p) => sum + p.score, 0) / progressList.length;
        const topicsCompleted = new Set(progressList.map((p) => p.topic)).size;

        // Determine grade
        let grade = "F";
        if (avgScore >= 90) grade = "A+";
        else if (avgScore >= 85) grade = "A";
        else if (avgScore >= 80) grade = "B+";
        else if (avgScore >= 75) grade = "B";
        else if (avgScore >= 70) grade = "C+";
        else if (avgScore >= 65) grade = "C";
        else if (avgScore >= 60) grade = "D";

        return {
          subject,
          grade,
          score: avgScore,
          topicsCompleted,
          topicsTotal: topicsCompleted + 5, // Placeholder
          strengths: metrics.strengths.includes(subject)
            ? ["Consistent performance", "Good understanding"]
            : [],
          improvements: metrics.weaknesses.includes(subject)
            ? ["Needs more practice", "Review fundamentals"]
            : [],
        };
      },
    );

    const report: StudentReport = {
      studentId,
      reportId: `${studentId}-${Date.now()}`,
      period: { start: startDate, end: endDate },
      overallGrade: this.calculateOverallGrade(metrics.overallScore),
      subjects,
      attendance: 85, // Placeholder
      behavioralNotes: ["Engaged in class", "Participates actively"],
      recommendations: [
        ...metrics.weaknesses.map((w) => `Focus on improving ${w}`),
        "Maintain current study habits for strong subjects",
      ],
      generatedAt: new Date(),
    };

    // Save report
    const reportRef = doc(db, "reports", report.reportId);
    await setDoc(reportRef, {
      ...report,
      period: {
        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(endDate),
      },
      generatedAt: Timestamp.fromDate(report.generatedAt),
    });

    return report;
  }

  private static calculateOverallGrade(score: number): string {
    if (score >= 90) return "A+";
    if (score >= 85) return "A";
    if (score >= 80) return "B+";
    if (score >= 75) return "B";
    if (score >= 70) return "C+";
    if (score >= 65) return "C";
    if (score >= 60) return "D";
    return "F";
  }
}
