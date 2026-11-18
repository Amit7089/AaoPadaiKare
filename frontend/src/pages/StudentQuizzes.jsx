
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ClipboardList,
  Clock,
  BookOpen,
  GraduationCap,
  ArrowRight,
  RefreshCw,
  LoaderCircle,
  AlertCircle,
  FileQuestion,
  CheckCircle2,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function StudentQuizzes() {
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("studentToken");

      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      const response = await fetch(`${API_URL}/student/quizzes`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Quizzes load nahi ho paye.");
      }

      const quizData = Array.isArray(data)
        ? data
        : data.quizzes || data.data || [];

      setQuizzes(quizData);
    } catch (err) {
      setError(err.message || "Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleStartQuiz = (quizId) => {
    navigate(`/student/quizzes/${quizId}`);
  };

  return (
    <div className="min-h-screen bg-[#f7f8fc] px-4 py-7 sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              to="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              <ArrowRight className="rotate-180" size={16} />
              Back to Dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                <ClipboardList size={26} />
              </div>

              <div>
                <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                  Online Quizzes & Tests
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Test your knowledge and improve your preparation.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchQuizzes}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* INFO BANNER */}
        <section className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-[#172554] to-indigo-700 p-6 text-white sm:p-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                <GraduationCap size={15} />
                MP BOARD EXAM PREPARATION
              </div>

              <h2 className="mt-4 text-2xl font-black">
                Practice Makes Perfect!
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-indigo-100">
                Apne available online tests attempt karein, apni performance
                check karein aur exam preparation ko improve karein.
              </p>
            </div>

            <div className="hidden h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-white/20 bg-white/10 sm:flex">
              <FileQuestion size={54} />
            </div>
          </div>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle className="mt-0.5 shrink-0" size={21} />
            <div>
              <p className="font-bold">Unable to load quizzes</p>
              <p className="mt-1 text-sm">{error}</p>
              <button
                onClick={fetchQuizzes}
                className="mt-3 text-sm font-bold underline"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center rounded-3xl border border-slate-200 bg-white">
            <div className="text-center">
              <LoaderCircle
                className="mx-auto animate-spin text-indigo-600"
                size={40}
              />
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Loading your quizzes...
              </p>
            </div>
          </div>
        ) : !error && quizzes.length === 0 ? (
          /* EMPTY STATE */
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600">
              <ClipboardList size={38} />
            </div>

            <h2 className="mt-6 text-xl font-black text-slate-900">
              No Quizzes Available
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Abhi aapki class ke liye koi published quiz available nahi hai.
              Admin ke quiz publish karne ke baad yahan dikhai dega.
            </p>

            <Link
              to="/dashboard"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              Back to Dashboard
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          /* QUIZ LIST */
          <>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Available Tests
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a test and start your preparation.
                </p>
              </div>

              <span className="rounded-xl bg-indigo-50 px-4 py-2 text-sm font-extrabold text-indigo-700">
                {quizzes.length} {quizzes.length === 1 ? "Quiz" : "Quizzes"}
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {quizzes.map((quiz) => (
                <div
                  key={quiz._id}
                  className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                      <FileQuestion size={25} />
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <CheckCircle2
                        size={13}
                        className="mr-1 inline"
                      />
                      Published
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-black text-slate-900">
                    {quiz.title}
                  </h3>

                  <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">
                    {quiz.description || "Test your knowledge with this quiz."}
                  </p>

                  <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <GraduationCap size={17} className="text-indigo-600" />
                      Class {quiz.classNo}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <BookOpen size={17} className="text-indigo-600" />
                      {quiz.subject}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <ClipboardList size={17} className="text-indigo-600" />
                      {quiz.chapter || "General Test"}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <Clock size={17} className="text-indigo-600" />
                        <p className="mt-2 text-xs text-slate-400">
                          Duration
                        </p>
                        <p className="font-extrabold text-slate-800">
                          {quiz.durationMinutes} min
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <CheckCircle2 size={17} className="text-emerald-600" />
                        <p className="mt-2 text-xs text-slate-400">
                          Total Marks
                        </p>
                        <p className="font-extrabold text-slate-800">
                          {quiz.totalMarks ?? "—"}
                        </p>
                      </div>
                    </div>

                    <div className="text-xs font-semibold text-slate-500">
                      Passing Marks: {quiz.passingMarks ?? "—"}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartQuiz(quiz._id)}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-extrabold text-white transition hover:bg-indigo-700"
                  >
                    Start Quiz
                    <ArrowRight size={17} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
