import { PerformanceMetrics, StudentProgress } from "@/types/features";

export class DifficultyAdjuster {
  /**
   * Determine the appropriate difficulty level for a student based on performance
   */
  static adjustDifficulty(
    currentDifficulty: "beginner" | "intermediate" | "advanced",
    recentPerformance: StudentProgress[],
    metrics: PerformanceMetrics,
  ): "beginner" | "intermediate" | "advanced" {
    if (recentPerformance.length < 3) {
      return currentDifficulty; // Not enough data
    }

    // Calculate average score for recent attempts
    const avgScore =
      recentPerformance.reduce((sum, p) => sum + p.score, 0) /
      recentPerformance.length;

    // Calculate average attempts
    const avgAttempts =
      recentPerformance.reduce((sum, p) => sum + p.attempts, 0) /
      recentPerformance.length;

    // Decision logic
    if (currentDifficulty === "beginner") {
      // Move to intermediate if consistently scoring above 80% with few attempts
      if (avgScore >= 80 && avgAttempts <= 1.5 && metrics.consistency >= 70) {
        return "intermediate";
      }
    } else if (currentDifficulty === "intermediate") {
      // Move to advanced if mastering intermediate content
      if (avgScore >= 85 && avgAttempts <= 1.3 && metrics.consistency >= 80) {
        return "advanced";
      }
      // Move back to beginner if struggling
      if (avgScore < 60 || avgAttempts > 2.5) {
        return "beginner";
      }
    } else if (currentDifficulty === "advanced") {
      // Move back to intermediate if struggling
      if (avgScore < 70 || avgAttempts > 2) {
        return "intermediate";
      }
    }

    return currentDifficulty;
  }

  /**
   * Get recommended difficulty for a specific subject
   */
  static getRecommendedDifficulty(
    subject: string,
    metrics: PerformanceMetrics,
  ): "beginner" | "intermediate" | "advanced" {
    const subjectScore = metrics.subjectScores[subject] || 0;

    if (subjectScore >= 80 && metrics.consistency >= 70) {
      return "advanced";
    } else if (subjectScore >= 60 && metrics.consistency >= 50) {
      return "intermediate";
    } else {
      return "beginner";
    }
  }

  /**
   * Calculate adaptive learning speed multiplier
   */
  static getLearningSpeadMultiplier(metrics: PerformanceMetrics): number {
    // Base multiplier is 1.0
    let multiplier = 1.0;

    // Adjust based on overall score
    if (metrics.overallScore >= 85) {
      multiplier += 0.3; // Fast learner
    } else if (metrics.overallScore >= 70) {
      multiplier += 0.1; // Steady learner
    } else if (metrics.overallScore < 50) {
      multiplier -= 0.3; // Needs more time
    }

    // Adjust based on consistency
    if (metrics.consistency >= 80) {
      multiplier += 0.2;
    } else if (metrics.consistency < 40) {
      multiplier -= 0.2;
    }

    // Keep multiplier between 0.5 and 1.5
    return Math.max(0.5, Math.min(1.5, multiplier));
  }

  /**
   * Generate personalized study recommendations
   */
  static generateStudyRecommendations(
    metrics: PerformanceMetrics,
  ): string[] {
    const recommendations: string[] = [];

    // Based on overall score
    if (metrics.overallScore < 60) {
      recommendations.push(
        "Focus on reviewing fundamental concepts before moving forward",
      );
      recommendations.push(
        "Consider scheduling more practice sessions each week",
      );
    } else if (metrics.overallScore >= 85) {
      recommendations.push(
        "Excellent progress! You're ready for more challenging material",
      );
    }

    // Based on consistency
    if (metrics.consistency < 50) {
      recommendations.push(
        "Try to study regularly - consistency is key to retention",
      );
      recommendations.push("Set a daily study schedule and stick to it");
    }

    // Based on learning velocity
    if (metrics.learningVelocity < 3) {
      recommendations.push(
        "Increase your study pace to complete more topics each week",
      );
    } else if (metrics.learningVelocity > 10) {
      recommendations.push(
        "Great pace! Make sure to review previous topics to ensure retention",
      );
    }

    // Based on strengths and weaknesses
    if (metrics.weaknesses.length > 0) {
      recommendations.push(
        `Focus extra time on: ${metrics.weaknesses.join(", ")}`,
      );
    }

    if (metrics.strengths.length > 0) {
      recommendations.push(
        `Great job in: ${metrics.strengths.join(", ")}! Keep it up!`,
      );
    }

    return recommendations;
  }
}
