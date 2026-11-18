
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Award,
  Target,
  TrendingUp,
  ClipboardCheck,
  ArrowRight,
  LoaderCircle,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { api } from "../services/api";

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function StudentProgressOverview() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadResults() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getStudentQuizResults();

      setResults(
        Array.isArray(response?.results) ? response.results : []
      );
    } catch (err) {
      console.error("Student progress error:", err);
      setError(err.message || "Performance data load nahi hua.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResults();
  }, []);

  const stats = useMemo(() => {
    const total = results.length;

    const average = total
      ? results.reduce(
          (sum, item) => sum + Number(item.percentage || 0),
          0
        ) / total
      : 0;

    const passed = results.filter(
      (item) => item.isPassed === true
    ).length;

    const best = total
      ? Math.max(...results.map((item) => Number(item.percentage || 0)))
      : 0;

    return {
      total,
      average: average.toFixed(1),
      passed,
      best: best.toFixed(1),
    };
  }, [results]);

  const subjects = useMemo(() => {
    const groups = {};

    results.forEach((item) => {
      const subject = item.quiz?.subject || "Other";

      if (!groups[subject]) {
        groups[subject] = {
          total: 0,
          score: 0,
        };
      }

      groups[subject].total += 1;
      groups[subject].score += Number(item.percentage || 0);
    });

    return Object.entries(groups)
      .map(([name, value]) => ({
        name,
        average: value.score / value.total,
        attempts: value.total,
      }))
      .sort((a, b) => b.average - a.average);
  }, [results]);

  const recentResults = results.slice(0, 5);

  if (loading) {
    return (
      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <LoaderCircle
          size={28}
          className="mx-auto animate-spin text-indigo-600"
        />
        <p className="mt-3 text-sm font-semibold text-slate-500">
          आपका प्रदर्शन लोड हो रहा है...
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 space-y-6">

      {/* HEADER */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[10px] font-black tracking-[0.18em] text-indigo-600">
            YOUR PERFORMANCE
          </p>

          <h2 className="mt-2 text-2xl font-black text-slate-900">
            आपकी पढ़ाई का प्रदर्शन
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            आपके पूरे किए गए ऑनलाइन टेस्ट के आधार पर।
          </p>
        </div>

        <Link
          to="/student/quiz-history"
          className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900"
        >
          पूरी हिस्ट्री देखें
          <ArrowRight size={16} />
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-700">{error}</p>

          <button
            onClick={loadResults}
            className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-red-700"
          >
            <RefreshCw size={15} />
            फिर से कोशिश करें
          </button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            title: "कुल टेस्ट",
            value: stats.total,
            icon: ClipboardCheck,
            color: "bg-blue-50 text-blue-700",
          },
          {
            title: "औसत स्कोर",
            value: `${stats.average}%`,
            icon: Activity,
            color: "bg-violet-50 text-violet-700",
          },
          {
            title: "पास हुए टेस्ट",
            value: stats.passed,
            icon: Award,
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            title: "सबसे अच्छा स्कोर",
            value: `${stats.best}%`,
            icon: TrendingUp,
            color: "bg-amber-50 text-amber-700",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon size={21} />
                </div>
              </div>

              <p className="mt-5 text-xs font-semibold text-slate-500">
                {item.title}
              </p>

              <h3 className="mt-1 text-2xl font-black text-slate-900">
                {item.value}
              </h3>
            </div>
          );
        })}
      </div>

      {/* EMPTY STATE */}
      {results.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <BookOpen size={28} />
          </div>

          <h3 className="mt-5 text-lg font-black text-slate-900">
            अभी कोई टेस्ट पूरा नहीं हुआ
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            अपना पहला ऑनलाइन टेस्ट दें। उसके बाद आपका स्कोर और प्रदर्शन
            यहाँ दिखाई देगा।
          </p>

          <Link
            to="/student/quizzes"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
          >
            टेस्ट शुरू करें
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {results.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">

          {/* SUBJECT PERFORMANCE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900">
                  विषय के अनुसार प्रदर्शन
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  पूरे किए गए टेस्ट का औसत स्कोर
                </p>
              </div>

              <Target size={21} className="text-indigo-600" />
            </div>

            <div className="mt-7 space-y-6">
              {subjects.map((subject) => (
                <div key={subject.name}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">
                      {subject.name}
                    </span>

                    <span className="text-sm font-black text-indigo-700">
                      {subject.average.toFixed(1)}%
                    </span>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-700"
                      style={{
                        width: `${Math.min(100, Math.max(0, subject.average))}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-[10px] text-slate-400">
                    {subject.attempts} टेस्ट
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT RESULTS */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-900">
                  हाल के टेस्ट
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  आपके नवीनतम परिणाम
                </p>
              </div>

              <ClipboardCheck size={21} className="text-indigo-600" />
            </div>

            <div className="mt-5 divide-y divide-slate-100">
              {recentResults.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 py-4"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">
                      {item.quiz?.title || "Online Quiz"}
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {item.quiz?.subject || "—"} · {formatDate(item.submittedAt)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-lg font-black text-slate-900">
                      {Number(item.percentage || 0).toFixed(1)}%
                    </p>

                    <span
                      className={`text-[10px] font-bold ${
                        item.isPassed
                          ? "text-emerald-600"
                          : "text-red-500"
                      }`}
                    >
                      {item.isPassed ? "पास" : "पास नहीं"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/student/quiz-history"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
            >
              सभी परिणाम देखें
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
