
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  RefreshCw,
  Users,
  FileQuestion,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Trophy,
  BarChart3,
  BookOpen,
  CalendarDays,
  Clock,
  AlertCircle,
  Activity,
  Target,
  Award,
  Search,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserRound,
  Mail,
  Medal,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  ChartColumnIncreasing,
  CircleUserRound,
  FileBarChart,
  Layers3,
  Sparkles,
  X,
} from "lucide-react";

import { getAdminToken } from "../../services/api";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// ============================================
// Helpers
// ============================================

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateShort = (date) => {
  if (!date) return "";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const percentage = (value) =>
  `${Number(value || 0).toFixed(1)}%`;

const getInitials = (name = "Student") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

const getScoreColor = (value) => {
  const score = Number(value || 0);

  if (score >= 75) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-rose-600";
};

const getScoreBarColor = (value) => {
  const score = Number(value || 0);

  if (score >= 75) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
};

// ============================================
// Reusable Components
// ============================================

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  color = "blue",
  action,
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
    cyan: "bg-cyan-50 text-cyan-600",
    yellow: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={`shrink-0 rounded-2xl p-3 ${
            colors[color] || colors.blue
          }`}
        >
          <Icon size={22} />
        </div>

        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {action}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    red: "bg-rose-50 text-rose-600",
    cyan: "bg-cyan-50 text-cyan-600",
  };

  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {value}
          </h3>

          {subtitle && (
            <p className="mt-2 text-xs font-medium text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={`shrink-0 rounded-2xl p-3 ${
            colors[color] || colors.blue
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, color = "bg-blue-600" }) {
  const safeValue = Math.min(100, Math.max(0, Number(value || 0)));

  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function EmptyState({ message, icon: Icon = BarChart3 }) {
  return (
    <div className="rounded-xl py-10 text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <Icon size={25} />
      </div>
      <p className="text-sm font-semibold text-slate-500">
        {message}
      </p>
    </div>
  );
}

function StatusBadge({ passed }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
        passed
          ? "bg-emerald-50 text-emerald-700"
          : "bg-rose-50 text-rose-700"
      }`}
    >
      {passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
      {passed ? "Passed" : "Failed"}
    </span>
  );
}

function StudentAvatar({ name, size = "normal" }) {
  const dimensions =
    size === "large" ? "h-16 w-16 text-xl" : "h-11 w-11 text-sm";

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 font-black text-white shadow-sm ${dimensions}`}
    >
      {getInitials(name)}
    </div>
  );
}

function LoadingCard({ message = "Loading data..." }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
      <RefreshCw
        size={30}
        className="mx-auto mb-3 animate-spin text-blue-600"
      />
      <p className="text-sm font-semibold text-slate-500">
        {message}
      </p>
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Student directory
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalStudents: 0,
    totalPages: 0,
  });

  // Individual report
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentReport, setStudentReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const [activeView, setActiveView] = useState("overview");

  const getHeaders = () => {
    const token = getAdminToken();

    if (!token) {
      throw new Error("Admin session nahi mili. Please dobara login karein.");
    }

    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  };

  // ============================================
  // Main analytics
  // ============================================

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error("Admin session nahi mili. Please dobara login karein.");
      }

      const response = await fetch(`${API_URL}/admin/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Analytics data load nahi ho paya.");
      }

      setAnalytics(data.analytics);
    } catch (err) {
      setError(err.message || "Server connection error.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // ============================================
  // Student directory API
  // ============================================

  const fetchStudents = useCallback(async () => {
    try {
      setStudentsLoading(true);
      setStudentsError("");

      const token = getAdminToken();

      if (!token) {
        throw new Error("Admin session nahi mili. Please dobara login karein.");
      }

      const params = new URLSearchParams({
        page: String(studentPage),
        limit: "10",
      });

      if (studentSearch.trim()) {
        params.set("search", studentSearch.trim());
      }

      if (classFilter) {
        params.set("classNo", classFilter);
      }

      const response = await fetch(
        `${API_URL}/admin/analytics/students?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Students load nahi ho paye.");
      }

      setStudents(data.students || []);
      setPagination(
        data.pagination || {
          page: 1,
          limit: 10,
          totalStudents: 0,
          totalPages: 0,
        }
      );
    } catch (err) {
      setStudentsError(err.message || "Students load karne mein problem aayi.");
    } finally {
      setStudentsLoading(false);
    }
  }, [studentPage, studentSearch, classFilter]);

  useEffect(() => {
    if (activeView === "students") {
      fetchStudents();
    }
  }, [activeView, fetchStudents]);

  // ============================================
  // Individual student report
  // ============================================

  const openStudentReport = async (student) => {
    setSelectedStudent(student);
    setStudentReport(null);
    setReportError("");
    setReportLoading(true);
    setActiveView("student-report");

    try {
      const token = getAdminToken();

      if (!token) {
        throw new Error("Admin session nahi mili. Please dobara login karein.");
      }

      const response = await fetch(
        `${API_URL}/admin/analytics/students/${student._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Student report load nahi ho payi.");
      }

      setStudentReport(data);
    } catch (err) {
      setReportError(err.message || "Student report load nahi ho payi.");
    } finally {
      setReportLoading(false);
    }
  };

  const backToStudents = () => {
    setSelectedStudent(null);
    setStudentReport(null);
    setReportError("");
    setActiveView("students");
  };

  const handleRefresh = () => {
    fetchAnalytics(true);

    if (activeView === "students") {
      fetchStudents();
    }

    if (activeView === "student-report" && selectedStudent) {
      openStudentReport(selectedStudent);
    }
  };

  const overview = analytics?.overview || {};

  const classPerformance = analytics?.classPerformance || [];
  const subjectPerformance = analytics?.subjectPerformance || [];
  const topStudents = analytics?.topStudents || [];
  const recentAttempts = analytics?.recentAttempts || [];
  const registrationTrend = analytics?.registrationTrend || [];

  const maxRegistrations = useMemo(
    () =>
      Math.max(
        1,
        ...registrationTrend.map((item) =>
          Number(item.registrations || 0)
        )
      ),
    [registrationTrend]
  );

  // ============================================
  // Student directory view
  // ============================================

  const renderStudentDirectory = () => (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100">
              <Sparkles size={14} />
              STUDENT INTELLIGENCE
            </div>

            <h2 className="text-2xl font-black sm:text-3xl">
              Student Performance
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
              Search students, explore their quiz history and understand
              their academic performance.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <Users size={30} className="text-blue-200" />
            <p className="mt-2 text-2xl font-black">
              {formatNumber(pagination.totalStudents)}
            </p>
            <p className="text-xs text-blue-100/80">
              Students found
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <Filter size={18} className="text-blue-600" />
          <h3 className="font-extrabold text-slate-800">
            Find a student
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={studentSearch}
              onChange={(event) => {
                setStudentSearch(event.target.value);
                setStudentPage(1);
              }}
              placeholder="Search by student name or email..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <select
            value={classFilter}
            onChange={(event) => {
              setClassFilter(event.target.value);
              setStudentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
          >
            <option value="">All Classes</option>
            {[6, 7, 8, 9, 10, 11, 12].map((classNo) => (
              <option key={classNo} value={classNo}>
                Class {classNo}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setStudentSearch("");
              setClassFilter("");
              setStudentPage(1);
            }}
            className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h3 className="font-extrabold text-slate-900">
              Registered Students
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Select a student to view the complete report.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
            {formatNumber(pagination.totalStudents)} Total
          </span>
        </div>

        {studentsLoading ? (
          <LoadingCard message="Loading student directory..." />
        ) : studentsError ? (
          <div className="p-6 text-center">
            <AlertCircle className="mx-auto mb-3 text-rose-500" size={30} />
            <p className="text-sm font-semibold text-rose-600">
              {studentsError}
            </p>
            <button
              onClick={fetchStudents}
              className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            message="No students found for these filters."
          />
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {students.map((student) => (
                <div
                  key={student._id}
                  className="flex flex-col gap-4 p-4 transition hover:bg-blue-50/40 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <StudentAvatar name={student.name} />

                    <div className="min-w-0">
                      <h4 className="truncate font-extrabold text-slate-900">
                        {student.name || "Unnamed Student"}
                      </h4>

                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <Mail size={13} />
                        {student.email || "No email"}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700">
                          Class {student.classNo || "—"}
                        </span>

                        <span className="text-[11px] text-slate-400">
                          Joined {formatDate(student.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 sm:min-w-[310px]">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Attempts
                      </p>
                      <p className="mt-1 text-lg font-black text-slate-800">
                        {formatNumber(student.totalAttempts)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Average
                      </p>
                      <p
                        className={`mt-1 text-lg font-black ${getScoreColor(
                          student.averagePercentage
                        )}`}
                      >
                        {percentage(student.averagePercentage)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        Pass Rate
                      </p>
                      <p className="mt-1 text-lg font-black text-emerald-600">
                        {percentage(student.passPercentage)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openStudentReport(student)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Eye size={16} />
                    View Report
                    <ArrowUpRight size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-4 py-4 sm:px-5">
              <p className="text-xs font-medium text-slate-500">
                Page {pagination.page || 1} of {pagination.totalPages || 1}
                {" · "}
                {formatNumber(pagination.totalStudents)} students
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={!pagination.hasPrevPage || studentsLoading}
                  onClick={() => setStudentPage((page) => Math.max(1, page - 1))}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} />
                  Previous
                </button>

                <button
                  type="button"
                  disabled={!pagination.hasNextPage || studentsLoading}
                  onClick={() => setStudentPage((page) => page + 1)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ============================================
  // Individual student report
  // ============================================

  const renderStudentReport = () => {
    const report = studentReport;
    const student = report?.student || selectedStudent;
    const summary = report?.summary || {};

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={backToStudents}
          className="inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft size={17} />
          Back to Students
        </button>

        {reportLoading ? (
          <LoadingCard message="Preparing student performance report..." />
        ) : reportError ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 text-rose-600" size={32} />
            <p className="font-bold text-rose-700">{reportError}</p>
            <button
              onClick={() => openStudentReport(selectedStudent)}
              className="mt-4 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white"
            >
              Retry
            </button>
          </div>
        ) : report ? (
          <>
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 text-white shadow-xl">
              <div className="p-6 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <StudentAvatar name={student?.name} size="large" />

                    <div className="min-w-0">
                      <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-wider text-blue-100">
                        STUDENT PERFORMANCE REPORT
                      </span>

                      <h2 className="mt-2 truncate text-2xl font-black sm:text-3xl">
                        {student?.name || "Student"}
                      </h2>

                      <p className="mt-1 flex items-center gap-2 truncate text-sm text-blue-100/80">
                        <Mail size={14} />
                        {student?.email || "—"}
                      </p>

                      <p className="mt-2 text-xs font-semibold text-blue-100/70">
                        Class {student?.classNo || "—"}
                        {" · "}
                        Joined {formatDate(student?.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/15 bg-white/10 p-5 sm:min-w-[155px]">
                    <p className="text-xs font-semibold text-blue-100">
                      Overall Average
                    </p>
                    <p className="mt-2 text-4xl font-black">
                      {percentage(summary.averagePercentage)}
                    </p>
                    <p className="mt-1 text-xs text-blue-100/70">
                      Across submitted quizzes
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <StatCard
                title="Total Attempts"
                value={formatNumber(summary.totalAttempts)}
                subtitle="Submitted quizzes"
                icon={ClipboardList}
                color="blue"
              />

              <StatCard
                title="Passed"
                value={formatNumber(summary.passedAttempts)}
                subtitle={`${percentage(summary.passPercentage)} pass rate`}
                icon={CheckCircle2}
                color="green"
              />

              <StatCard
                title="Failed"
                value={formatNumber(summary.failedAttempts)}
                subtitle={`${percentage(summary.failPercentage)} fail rate`}
                icon={XCircle}
                color="red"
              />

              <StatCard
                title="Best Score"
                value={percentage(summary.bestPercentage)}
                subtitle="Highest quiz percentage"
                icon={Trophy}
                color="orange"
              />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={Target}
                  title="Pass & Fail Overview"
                  subtitle="Student's submitted quiz results"
                  color="green"
                />

                <div className="mb-3 flex items-end justify-between">
                  <span className="text-4xl font-black text-emerald-600">
                    {percentage(summary.passPercentage)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Pass percentage
                  </span>
                </div>

                <ProgressBar
                  value={summary.passPercentage}
                  color="bg-emerald-500"
                />

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-xs font-semibold text-emerald-700">
                      Passed
                    </p>
                    <p className="mt-1 text-2xl font-black text-emerald-700">
                      {summary.passedAttempts || 0}
                    </p>
                  </div>

                  <div className="rounded-xl bg-rose-50 p-4">
                    <p className="text-xs font-semibold text-rose-700">
                      Failed
                    </p>
                    <p className="mt-1 text-2xl font-black text-rose-700">
                      {summary.failedAttempts || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={ChartColumnIncreasing}
                  title="Marks Summary"
                  subtitle="Total marks across submitted quizzes"
                  color="blue"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-blue-50 p-4">
                    <p className="text-xs font-semibold text-blue-700">
                      Obtained Marks
                    </p>
                    <p className="mt-2 text-2xl font-black text-blue-700">
                      {formatNumber(summary.totalObtainedMarks)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-indigo-50 p-4">
                    <p className="text-xs font-semibold text-indigo-700">
                      Maximum Marks
                    </p>
                    <p className="mt-2 text-2xl font-black text-indigo-700">
                      {formatNumber(summary.totalMaximumMarks)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-slate-100 p-4">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-semibold text-slate-500">
                      Average percentage
                    </span>
                    <span className="font-black text-slate-900">
                      {percentage(summary.averagePercentage)}
                    </span>
                  </div>

                  <div className="mt-3">
                    <ProgressBar
                      value={summary.averagePercentage}
                      color="bg-blue-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={BookOpen}
                title="Subject-wise Performance"
                subtitle="Identify strong and weak subjects"
                color="purple"
              />

              {report.subjectPerformance?.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {report.subjectPerformance.map((item) => (
                    <div
                      key={item.subject}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="truncate font-extrabold text-slate-800">
                          {item.subject}
                        </h3>

                        <span
                          className={`shrink-0 text-lg font-black ${getScoreColor(
                            item.averagePercentage
                          )}`}
                        >
                          {percentage(item.averagePercentage)}
                        </span>
                      </div>

                      <ProgressBar
                        value={item.averagePercentage}
                        color={getScoreBarColor(item.averagePercentage)}
                      />

                      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                        <span>{item.totalAttempts} attempts</span>
                        <span className="font-semibold text-emerald-600">
                          Passed: {item.passed}
                        </span>
                        <span className="font-semibold text-rose-500">
                          Failed: {item.failed}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No subject performance available yet." />
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={Layers3}
                title="Chapter-wise Performance"
                subtitle="Performance in individual chapters"
                color="orange"
              />

              {report.chapterPerformance?.length ? (
                <div className="space-y-4">
                  {report.chapterPerformance.map((item, index) => (
                    <div
                      key={`${item.subject}-${item.chapter}-${index}`}
                      className="rounded-xl border border-slate-100 p-4"
                    >
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-blue-600">
                            {item.subject}
                          </p>
                          <h3 className="mt-1 font-bold text-slate-800">
                            {item.chapter}
                          </h3>
                        </div>

                        <span
                          className={`text-lg font-black ${getScoreColor(
                            item.averagePercentage
                          )}`}
                        >
                          {percentage(item.averagePercentage)}
                        </span>
                      </div>

                      <ProgressBar
                        value={item.averagePercentage}
                        color={getScoreBarColor(item.averagePercentage)}
                      />

                      <p className="mt-2 text-xs text-slate-500">
                        {item.totalAttempts} quiz attempts
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No chapter performance available yet." />
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <SectionHeading
                  icon={Clock}
                  title="Complete Quiz History"
                  subtitle="Every submitted quiz attempt by this student"
                  color="cyan"
                />
              </div>

              {report.quizHistory?.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Quiz</th>
                        <th className="px-5 py-4">Subject / Chapter</th>
                        <th className="px-5 py-4">Questions</th>
                        <th className="px-5 py-4">Score</th>
                        <th className="px-5 py-4">Percentage</th>
                        <th className="px-5 py-4">Result</th>
                        <th className="px-5 py-4">Date</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {report.quizHistory.map((result) => (
                        <tr
                          key={result._id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-800">
                              {result.quiz?.title || "Quiz unavailable"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {result.quiz?.classNo
                                ? `Class ${result.quiz.classNo}`
                                : "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-semibold text-slate-700">
                              {result.quiz?.subject || "—"}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">
                              {result.quiz?.chapter || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            <p>{result.attemptedQuestions || 0} attempted</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {result.correctAnswers || 0} correct ·{" "}
                              {result.wrongAnswers || 0} wrong
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm font-bold text-slate-800">
                            {result.obtainedMarks} / {result.totalMarks}
                          </td>

                          <td className="px-5 py-4">
                            <span
                              className={`font-black ${getScoreColor(
                                result.percentage
                              )}`}
                            >
                              {percentage(result.percentage)}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge passed={result.isPassed} />
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-500">
                            {formatDate(result.submittedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="This student has not submitted any quiz yet." />
              )}
            </div>
          </>
        ) : null}
      </div>
    );
  };

  // ============================================
  // Dashboard
  // ============================================

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <Link
              to="/admin/dashboard"
              className="mb-2 inline-flex items-center gap-2 text-xs font-bold text-blue-600 transition hover:text-blue-800"
            >
              <ArrowLeft size={15} />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-3 text-white shadow-md">
                <BarChart3 size={23} />
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                  Analytics Dashboard
                </h1>
                <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
                  Aao Padai Kare · Platform Intelligence
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 disabled:opacity-50 sm:text-sm"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {error && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              {error}
            </div>

            <button
              onClick={() => fetchAnalytics()}
              className="rounded-lg bg-rose-100 px-4 py-2 font-bold hover:bg-rose-200"
            >
              Try Again
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveView("overview")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
              activeView === "overview"
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BarChart3 size={17} />
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveView("students")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
              activeView === "students" || activeView === "student-report"
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users size={17} />
            Student Performance
          </button>
        </div>

        {activeView === "students" ? (
          renderStudentDirectory()
        ) : activeView === "student-report" ? (
          renderStudentReport()
        ) : loading && !analytics ? (
          <LoadingCard message="Loading platform analytics..." />
        ) : analytics ? (
          <>
            <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 p-6 text-white shadow-lg sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-5">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100">
                    <Activity size={14} />
                    PLATFORM OVERVIEW
                  </div>

                  <h2 className="text-2xl font-black sm:text-3xl">
                    Welcome to Analytics
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-blue-100/80">
                    Monitor student registrations, quiz participation and
                    academic performance from one dashboard.
                  </p>
                </div>

                <div className="hidden rounded-2xl border border-white/15 bg-white/10 p-5 sm:block">
                  <GraduationCap size={42} className="text-blue-100" />
                  <p className="mt-2 text-xs font-semibold text-blue-100">
                    MP Board · Classes 6–12
                  </p>
                </div>
              </div>
            </section>

            <section>
              <SectionHeading
                icon={Activity}
                title="Platform Overview"
                subtitle="Live statistics from your database"
                color="blue"
                action={
                  <button
                    onClick={() => setActiveView("students")}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    View Students
                    <ArrowUpRight size={15} />
                  </button>
                }
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total Students"
                  value={formatNumber(overview.totalStudents)}
                  subtitle="Registered students"
                  icon={Users}
                  color="blue"
                />

                <StatCard
                  title="Total Quizzes"
                  value={formatNumber(overview.totalQuizzes)}
                  subtitle={`${formatNumber(overview.publishedQuizzes)} published`}
                  icon={FileQuestion}
                  color="purple"
                />

                <StatCard
                  title="Quiz Attempts"
                  value={formatNumber(overview.totalAttempts)}
                  subtitle={`${formatNumber(overview.activeAttempts)} currently active`}
                  icon={ClipboardList}
                  color="cyan"
                />

                <StatCard
                  title="Average Score"
                  value={percentage(overview.averagePercentage)}
                  subtitle={`${formatNumber(overview.averageObtainedMarks)} average marks`}
                  icon={TrendingUp}
                  color="orange"
                />
              </div>
            </section>

            <section>
              <SectionHeading
                icon={FileBarChart}
                title="Quiz Statistics"
                subtitle="Publishing and student result overview"
                color="purple"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Published Quizzes"
                  value={formatNumber(overview.publishedQuizzes)}
                  subtitle="Available to students"
                  icon={CheckCircle2}
                  color="green"
                />

                <StatCard
                  title="Draft Quizzes"
                  value={formatNumber(overview.draftQuizzes)}
                  subtitle="Not published yet"
                  icon={BookOpen}
                  color="orange"
                />

                <StatCard
                  title="Passed Attempts"
                  value={formatNumber(overview.passCount)}
                  subtitle={`${percentage(overview.passPercentage)} pass rate`}
                  icon={Award}
                  color="green"
                />

                <StatCard
                  title="Failed Attempts"
                  value={formatNumber(overview.failCount)}
                  subtitle={`${percentage(overview.failPercentage)} fail rate`}
                  icon={XCircle}
                  color="red"
                />
              </div>
            </section>

            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={Target}
                  title="Pass Percentage"
                  subtitle="Overall quiz performance"
                  color="green"
                />

                <div className="mb-3 flex items-end justify-between">
                  <span className="text-4xl font-black text-emerald-600">
                    {percentage(overview.passPercentage)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {formatNumber(overview.passCount)} passed
                  </span>
                </div>

                <ProgressBar
                  value={overview.passPercentage}
                  color="bg-emerald-500"
                />

                <div className="mt-5 flex flex-wrap justify-between gap-2 text-sm">
                  <span className="font-semibold text-emerald-700">
                    Passed: {formatNumber(overview.passCount)}
                  </span>
                  <span className="font-semibold text-rose-600">
                    Failed: {formatNumber(overview.failCount)}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <SectionHeading
                  icon={TrendingUp}
                  title="Average Performance"
                  subtitle="Average percentage across submitted results"
                  color="blue"
                />

                <div className="mb-3 flex items-end justify-between">
                  <span className="text-4xl font-black text-blue-600">
                    {percentage(overview.averagePercentage)}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Average score
                  </span>
                </div>

                <ProgressBar
                  value={overview.averagePercentage}
                  color="bg-blue-600"
                />

                <p className="mt-5 text-sm text-slate-500">
                  Average marks obtained:{" "}
                  <strong className="text-slate-800">
                    {formatNumber(overview.averageObtainedMarks)}
                  </strong>
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={GraduationCap}
                title="Class-wise Performance"
                subtitle="Quiz attempts and average scores by class"
                color="purple"
              />

              {classPerformance.length === 0 ? (
                <EmptyState message="No class performance data available yet." />
              ) : (
                <div className="space-y-6">
                  {classPerformance.map((item) => (
                    <div key={item.classNo}>
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <span className="font-bold text-slate-800">
                          Class {item.classNo}
                        </span>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span>{formatNumber(item.totalAttempts)} attempts</span>
                          <span className="font-black text-blue-600">
                            {percentage(item.averagePercentage)}
                          </span>
                        </div>
                      </div>

                      <ProgressBar
                        value={item.averagePercentage}
                        color="bg-purple-600"
                      />

                      <div className="mt-2 flex gap-4 text-xs">
                        <span className="text-emerald-600">
                          Passed: {item.passed}
                        </span>
                        <span className="text-rose-500">
                          Failed: {item.failed}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={BookOpen}
                title="Subject-wise Performance"
                subtitle="Subject average percentage and attempts"
                color="orange"
              />

              {subjectPerformance.length === 0 ? (
                <EmptyState message="No subject performance data available yet." />
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {subjectPerformance.map((item) => (
                    <div
                      key={item.subject}
                      className="rounded-xl border border-slate-100 bg-slate-50/70 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="truncate font-bold text-slate-800">
                          {item.subject || "Other"}
                        </h3>

                        <span className="shrink-0 text-lg font-black text-blue-600">
                          {percentage(item.averagePercentage)}
                        </span>
                      </div>

                      <ProgressBar
                        value={item.averagePercentage}
                        color="bg-blue-600"
                      />

                      <div className="mt-3 flex justify-between text-xs text-slate-500">
                        <span>{formatNumber(item.totalAttempts)} attempts</span>
                        <span>Passed: {formatNumber(item.passed)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeading
                icon={CalendarDays}
                title="Student Registration Trend"
                subtitle="New student registrations over the last 7 days"
                color="cyan"
              />

              {registrationTrend.length === 0 ? (
                <EmptyState message="No registration data available." />
              ) : (
                <>
                  <div className="flex h-52 items-end justify-around gap-3 border-b border-slate-200 pb-2">
                    {registrationTrend.map((item) => {
                      const count = Number(item.registrations || 0);
                      const height = (count / maxRegistrations) * 100;

                      return (
                        <div
                          key={item.date}
                          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                        >
                          <span className="text-xs font-bold text-slate-600">
                            {count}
                          </span>

                          <div className="flex h-full w-full items-end justify-center">
                            <div
                              title={`${count} registrations`}
                              className="w-full max-w-12 rounded-t-lg bg-blue-600 transition-all duration-500 hover:bg-blue-700"
                              style={{
                                height: `${Math.max(height, 3)}%`,
                              }}
                            />
                          </div>

                          <span className="text-[10px] font-medium text-slate-500 sm:text-xs">
                            {formatDateShort(item.date)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p className="mt-4 text-xs text-slate-400">
                    Registration count is based on student account creation dates.
                  </p>
                </>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <SectionHeading
                  icon={Trophy}
                  title="Top Performing Students"
                  subtitle="Ranked by average quiz percentage"
                  color="yellow"
                  action={
                    <button
                      onClick={() => setActiveView("students")}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      All Students
                      <ArrowUpRight size={14} />
                    </button>
                  }
                />
              </div>

              {topStudents.length === 0 ? (
                <EmptyState message="No student results available yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Rank</th>
                        <th className="px-5 py-4">Student</th>
                        <th className="px-5 py-4">Class</th>
                        <th className="px-5 py-4">Attempts</th>
                        <th className="px-5 py-4">Average</th>
                        <th className="px-5 py-4">Best Score</th>
                        <th className="px-5 py-4">Report</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {topStudents.map((student, index) => (
                        <tr
                          key={student.studentId || index}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <div
                              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${
                                index === 0
                                  ? "bg-amber-100 text-amber-700"
                                  : index === 1
                                  ? "bg-slate-200 text-slate-700"
                                  : index === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-blue-50 text-blue-600"
                              }`}
                            >
                              {index + 1}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-800">
                              {student.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {student.email}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            Class {student.classNo}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {student.totalAttempts}
                          </td>

                          <td className="px-5 py-4 font-extrabold text-emerald-600">
                            {percentage(student.averagePercentage)}
                          </td>

                          <td className="px-5 py-4 font-bold text-blue-600">
                            {percentage(student.bestPercentage)}
                          </td>

                          <td className="px-5 py-4">
                            <button
                              type="button"
                              onClick={() =>
                                openStudentReport({
                                  _id: student.studentId,
                                  name: student.name,
                                  email: student.email,
                                  classNo: student.classNo,
                                })
                              }
                              className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <SectionHeading
                  icon={Clock}
                  title="Recent Quiz Attempts"
                  subtitle="Latest 10 submitted quiz results"
                  color="blue"
                />
              </div>

              {recentAttempts.length === 0 ? (
                <EmptyState message="No quiz attempts have been submitted yet." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[750px] text-left">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Student</th>
                        <th className="px-5 py-4">Quiz</th>
                        <th className="px-5 py-4">Class</th>
                        <th className="px-5 py-4">Score</th>
                        <th className="px-5 py-4">Result</th>
                        <th className="px-5 py-4">Submitted</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {recentAttempts.map((result) => (
                        <tr
                          key={result._id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-800">
                              {result.student?.name || "Student unavailable"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {result.student?.email || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-800">
                              {result.quiz?.title || "Quiz unavailable"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {result.quiz?.subject || "—"}
                            </p>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {result.quiz?.classNo
                              ? `Class ${result.quiz.classNo}`
                              : "—"}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-800">
                              {result.obtainedMarks} / {result.totalMarks}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {percentage(result.percentage)}
                            </p>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge passed={result.isPassed} />
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-500">
                            {formatDate(result.submittedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-400">
              <p>
                © {new Date().getFullYear()} Aao Padai Kare. All rights reserved.
              </p>

              <p className="flex items-center gap-2">
                <Activity size={14} />
                Admin Analytics Dashboard
              </p>
            </footer>
          </>
        ) : (
          !error && (
            <EmptyState message="Analytics data is not available." />
          )
        )}
      </main>
    </div>
  );
}
