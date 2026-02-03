"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import {
  BarChart,
  TrendingUp,
  Clock,
  Target,
  Award,
  BookOpen,
  Users,
  Calendar,
} from "lucide-react";
import { ProgressTracker } from "@/lib/services/progressTracker";
import type { PerformanceMetrics, StudentProgress } from "@/types/features";

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recentProgress, setRecentProgress] = useState<StudentProgress[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      redirect("/");
    }

    if (user && userProfile) {
      loadDashboardData();
    }
  }, [user, userProfile, loading]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      const [metricsData, progressData] = await Promise.all([
        ProgressTracker.getPerformanceMetrics(user.uid),
        ProgressTracker.getStudentProgress(user.uid),
      ]);

      setMetrics(metricsData);
      setRecentProgress(progressData.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const isStudent = userProfile?.role === "student";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-2">
          {isStudent ? "Student Dashboard" : "Teacher Dashboard"}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm md:text-base">
          Welcome back, {userProfile?.displayName}!
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        <StatCard
          icon={<Target className="text-blue-500" />}
          title="Overall Score"
          value={`${Math.round(metrics?.overallScore || 0)}%`}
          trend="+5%"
        />
        <StatCard
          icon={<Clock className="text-green-500" />}
          title="Study Streak"
          value={`${metrics?.consistency || 0}%`}
          subtitle="Consistency"
        />
        <StatCard
          icon={<BookOpen className="text-purple-500" />}
          title="Topics Completed"
          value={recentProgress.length.toString()}
          subtitle="This week"
        />
        <StatCard
          icon={<Award className="text-yellow-500" />}
          title="Learning Velocity"
          value={`${metrics?.learningVelocity || 0}/wk`}
          subtitle="Topics per week"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={24} />
            Recent Progress
          </h2>
          <div className="space-y-3">
            {recentProgress.map((progress, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 md:p-4 bg-slate-50 dark:bg-slate-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-white truncate">
                    {progress.topic}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {progress.subject}
                  </p>
                </div>
                <div className="ml-4 flex-shrink-0">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      progress.score >= 80
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : progress.score >= 60
                          ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {progress.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white mb-4">
            Performance Insights
          </h2>
          
          <div className="mb-6">
            <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-2">
              <Award size={16} />
              Strengths
            </h3>
            <div className="space-y-2">
              {metrics?.strengths.map((strength, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-slate-700 dark:text-slate-300"
                >
                  {strength}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-2 flex items-center gap-2">
              <Target size={16} />
              Areas to Improve
            </h3>
            <div className="space-y-2">
              {metrics?.weaknesses.map((weakness, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm text-slate-700 dark:text-slate-300"
                >
                  {weakness}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  trend?: string;
  subtitle?: string;
}

function StatCard({ icon, title, value, trend, subtitle }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-4 md:p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
          {icon}
        </div>
        {trend && (
          <span className="text-sm font-medium text-green-500">{trend}</span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
        {title}
      </h3>
      <p className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
