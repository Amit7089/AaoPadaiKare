
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Loader2,
  ClipboardList,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function StudentQuizHistory() {
  const navigate = useNavigate();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("studentToken");

  // Fetch student's quiz history
  const fetchResults = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_URL}/student/results`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Results load nahi ho sake."
        );
      }

      setResults(
        Array.isArray(data.results) ? data.results : []
      );
    } catch (err) {
      setError(
        err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  // Format submission date
  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Statistics
  const totalTests = results.length;

  const passedTests = results.filter(
    (result) => result.isPassed
  ).length;

  const failedTests = totalTests - passedTests;

  const averagePercentage =
    totalTests > 0
      ? (
          results.reduce(
            (sum, result) =>
              sum + (Number(result.percentage) || 0),
            0
          ) / totalTests
        ).toFixed(1)
      : "0.0";

  // Open exact attempt using Result ID
  const handleViewResult = (resultId) => {
    if (!resultId) {
      setError("Result ID nahi mila. Please refresh karke try karein.");
      return;
    }

    navigate(`/student/quizzes/${resultId}/result`);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />

          <p className="mt-3 font-semibold text-slate-600">
            Loading your results...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-indigo-600">
              <Trophy size={18} />
              STUDENT PERFORMANCE
            </p>

            <h1 className="text-3xl font-black text-slate-900">
              My Quiz Results
            </h1>

            <p className="mt-2 text-slate-500">
              Track your test performance and previous attempts.
            </p>
          </div>

          <button
            onClick={fetchResults}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-xl border bg-white px-5 py-3 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={18}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <span>{error}</span>

            <button
              onClick={() => setError("")}
              className="font-black"
            >
              ✕
            </button>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total Tests */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-500">
                Total Tests
              </p>

              <ClipboardList
                className="text-indigo-600"
                size={23}
              />
            </div>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              {totalTests}
            </h2>
          </div>

          {/* Passed */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-500">
                Passed
              </p>

              <CheckCircle2
                className="text-green-600"
                size={23}
              />
            </div>

            <h2 className="mt-3 text-3xl font-black text-green-600">
              {passedTests}
            </h2>
          </div>

          {/* Failed */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-500">
                Not Passed
              </p>

              <XCircle
                className="text-red-500"
                size={23}
              />
            </div>

            <h2 className="mt-3 text-3xl font-black text-red-500">
              {failedTests}
            </h2>
          </div>

          {/* Average */}
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-slate-500">
                Average Score
              </p>

              <Trophy
                className="text-yellow-500"
                size={23}
              />
            </div>

            <h2 className="mt-3 text-3xl font-black text-slate-900">
              {averagePercentage}%
            </h2>
          </div>
        </div>

        {/* Test History */}
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">

          <div className="border-b p-5">
            <h2 className="text-xl font-black text-slate-900">
              Test History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your recently submitted quizzes and previous attempts.
            </p>
          </div>

          {results.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <BookOpen className="mx-auto h-14 w-14 text-slate-300" />

              <h3 className="mt-4 text-xl font-bold text-slate-800">
                No Results Yet
              </h3>

              <p className="mt-2 text-slate-500">
                You have not submitted any quiz yet.
              </p>

              <button
                onClick={() => navigate("/student/quizzes")}
                className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700"
              >
                Explore Quizzes
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-left">

                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">
                      Quiz Details
                    </th>

                    <th className="px-5 py-4">
                      Score
                    </th>

                    <th className="px-5 py-4">
                      Percentage
                    </th>

                    <th className="px-5 py-4">
                      Date
                    </th>

                    <th className="px-5 py-4">
                      Status
                    </th>

                    <th className="px-5 py-4">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {results.map((result) => (
                    <tr
                      key={result._id}
                      className="transition hover:bg-slate-50"
                    >

                      {/* Quiz Details */}
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {result.quiz?.title || "Quiz"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {result.quiz?.subject || "Subject"} · Class{" "}
                          {result.quiz?.classNo || "N/A"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {result.quiz?.chapter || ""}
                        </p>
                      </td>

                      {/* Score */}
                      <td className="px-5 py-4 font-bold text-slate-800">
                        {result.obtainedMarks}/{result.totalMarks}
                      </td>

                      {/* Percentage */}
                      <td className="px-5 py-4">
                        <span className="font-bold text-indigo-600">
                          {result.percentage}%
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {formatDate(result.submittedAt)}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                            result.isPassed
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {result.isPassed
                            ? "Passed"
                            : "Not Passed"}
                        </span>
                      </td>

                      {/* View Exact Result */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() =>
                            handleViewResult(result._id)
                          }
                          disabled={!result._id}
                          className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
          <Clock size={16} />

          Results are displayed with the latest submissions first.
        </div>

      </div>
    </div>
  );
}
