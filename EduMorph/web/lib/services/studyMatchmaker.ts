import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { StudyMatch, StudyPreferences } from "@/types/features";
import { ProgressTracker } from "./progressTracker";

export class StudyMatchmaker {
  /**
   * Find compatible study partners for a student
   */
  static async findStudyMatches(
    studentId: string,
    preferences: StudyPreferences,
  ): Promise<StudyMatch[]> {
    // Get all users with student role
    const usersQuery = query(
      collection(db, "users"),
      where("role", "==", "student"),
    );
    const usersSnapshot = await getDocs(usersQuery);

    const candidates: Array<{ uid: string; data: any }> = [];

    usersSnapshot.forEach((doc) => {
      if (doc.id !== studentId) {
        candidates.push({ uid: doc.id, data: doc.data() });
      }
    });

    // Get student metrics
    const studentMetrics =
      await ProgressTracker.getPerformanceMetrics(studentId);

    if (!studentMetrics) return [];

    // Calculate compatibility scores
    const matches: StudyMatch[] = [];

    for (const candidate of candidates) {
      const candidateMetrics = await ProgressTracker.getPerformanceMetrics(
        candidate.uid,
      );

      if (!candidateMetrics) continue;

      // Find common subjects
      const commonSubjects = preferences.subjects.filter((subject) =>
        Object.keys(candidateMetrics.subjectScores).includes(subject),
      );

      if (commonSubjects.length === 0) continue;

      // Calculate compatibility score
      const compatibilityScore = this.calculateCompatibility(
        studentMetrics,
        candidateMetrics,
        commonSubjects,
        preferences,
      );

      if (compatibilityScore >= 60) {
        const match: StudyMatch = {
          matchId: `${studentId}-${candidate.uid}`,
          student1: studentId,
          student2: candidate.uid,
          commonSubjects,
          compatibilityScore,
          studyPreferences: preferences,
          matchedAt: new Date(),
        };

        matches.push(match);
      }
    }

    // Sort by compatibility score
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    // Save top matches
    for (const match of matches.slice(0, 5)) {
      const matchRef = doc(db, "studyMatches", match.matchId);
      await setDoc(matchRef, match);
    }

    return matches.slice(0, 5);
  }

  /**
   * Calculate compatibility score between two students
   */
  private static calculateCompatibility(
    metrics1: any,
    metrics2: any,
    commonSubjects: string[],
    preferences: StudyPreferences,
  ): number {
    let score = 0;

    // Common subjects weight: 40%
    score += (commonSubjects.length / preferences.subjects.length) * 40;

    // Similar performance level weight: 30%
    const scoreDiff = Math.abs(metrics1.overallScore - metrics2.overallScore);
    score += Math.max(0, (30 - scoreDiff)) * (30 / 30);

    // Consistency similarity weight: 30%
    const consistencyDiff = Math.abs(
      metrics1.consistency - metrics2.consistency,
    );
    score += Math.max(0, (30 - consistencyDiff)) * (30 / 30);

    return Math.round(score);
  }
}
