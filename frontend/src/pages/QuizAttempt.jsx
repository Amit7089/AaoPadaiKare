
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  Loader2,
  Send,
  Trophy,
  XCircle,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function QuizAttempt() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const attemptIdRef = useRef(null);
  const expiresAtRef = useRef(null);
  const serverOffsetRef = useRef(0);

  const submittedRef = useRef(false);
  const submitRef = useRef(null);
  const token = localStorage.getItem("studentToken");

  // ============================================
  // Load quiz and start backend attempt
  // ============================================
  useEffect(() => {
    let cancelled = false;

    const startQuiz = async () => {
      try {
        setLoading(true);
        setError("");

        if (!token) {
          navigate("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/student/quizzes/${id}/start`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Quiz start nahi ho paya.");
        }

        if (
          !data.quiz ||
          !Array.isArray(data.quiz.questions) ||
          !data.attempt?._id ||
          !data.attempt?.expiresAt ||
          !data.attempt?.serverTime
        ) {
          throw new Error("Server se invalid quiz attempt data mila.");
        }

        if (cancelled) return;

        // Store backend-generated attempt details
        attemptIdRef.current = data.attempt._id;
        expiresAtRef.current = new Date(
          data.attempt.expiresAt
        ).getTime();

        // Calculate difference between server and browser clocks
        const serverTime = new Date(
          data.attempt.serverTime
        ).getTime();

        serverOffsetRef.current = serverTime - Date.now();

        const remainingSeconds = Math.max(
          0,
          Math.ceil(
            (expiresAtRef.current - serverTime) / 1000
          )
        );

        setQuiz(data.quiz);
        setTimeLeft(remainingSeconds);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Something went wrong.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    startQuiz();

    return () => {
      cancelled = true;
    };
  }, [id, navigate, token]);

  // ============================================
  // Submit quiz
  // ============================================
  const submitQuiz = useCallback(
    async (autoSubmit = false) => {
      if (
        !quiz ||
        !attemptIdRef.current ||
        submittedRef.current
      ) {
        return;
      }

      if (!autoSubmit) {
        const confirmed = window.confirm(
          "Kya aap sach mein quiz submit karna chahte hain?"
        );

        if (!confirmed) return;
      }

      submittedRef.current = true;
      setSubmitting(true);
      setError("");

      try {
        const submittedAnswers = Object.entries(answers).map(
          ([questionId, selectedOptionIndex]) => ({
            questionId,
            selectedOptionIndex,
          })
        );

        const response = await fetch(
          `${API_URL}/student/quizzes/${id}/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              attemptId: attemptIdRef.current,
              answers: submittedAnswers,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Quiz submit nahi hua."
          );
        }

        setResult(data.result);
      } catch (err) {
        submittedRef.current = false;
        setError(
          err.message || "Quiz submit karne mein error aaya."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [quiz, answers, id, token]
  );

  // Keep latest submit function available to timer
  useEffect(() => {
    submitRef.current = submitQuiz;
  }, [submitQuiz]);

  // ============================================
  // Countdown using backend expiry time
  // ============================================
  useEffect(() => {
    if (
      !quiz ||
      result ||
      loading ||
      !expiresAtRef.current
    ) {
      return;
    }

    const updateTimer = () => {
      const serverNow =
        Date.now() + serverOffsetRef.current;

      const remainingMilliseconds =
        expiresAtRef.current - serverNow;

      const remainingSeconds = Math.max(
        0,
        Math.ceil(remainingMilliseconds / 1000)
      );

      setTimeLeft(remainingSeconds);

      if (remainingMilliseconds <= 0) {
        clearInterval(timer);

        // Attempt auto submission at timeout.
        // Backend will enforce the actual deadline.
        submitRef.current?.(true);
      }
    };

    updateTimer();

    const timer = setInterval(updateTimer, 500);

    return () => clearInterval(timer);
  }, [quiz, result, loading]);

  // ============================================
  // Format timer
  // ============================================
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

  // ============================================
  // Select answer
  // ============================================
  const selectAnswer = (questionId, optionIndex) => {
    if (result || submitting || timeLeft <= 0) return;

    setAnswers((previous) => ({
      ...previous,
      [questionId]: optionIndex,
    }));
  };

  // ============================================
  // Navigate questions
  // ============================================
  const goToQuestion = (index) => {
    if (
      index >= 0 &&
      index < quiz.questions.length
    ) {
      setCurrentQuestion(index);
    }
  };

  // ============================================
  // Loading screen
  // ============================================
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />
          <p className="mt-3 font-semibold text-slate-600">
            Starting Quiz...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // Error screen
  // ============================================
  if (error && !quiz) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />

          <h2 className="mt-3 text-xl font-bold text-slate-800">
            Quiz Load Failed
          </h2>

          <p className="mt-2 text-slate-600">{error}</p>

          <button
            onClick={() => navigate("/student/quizzes")}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) return null;

  // ============================================
  // Result screen
  // ============================================
  if (result) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-3xl border bg-white p-6 text-center shadow-sm sm:p-10">
          <Trophy className="mx-auto h-16 w-16 text-yellow-500" />

          <h1 className="mt-4 text-3xl font-black text-slate-900">
            Quiz Submitted!
          </h1>

          <p className="mt-2 text-slate-500">
            Your answers have been evaluated successfully.
          </p>

          <div className="mt-8 rounded-2xl bg-indigo-50 p-6">
            <p className="text-sm font-semibold text-indigo-700">
              Your Score
            </p>

            <div className="mt-2 text-5xl font-black text-indigo-700">
              {result.obtainedMarks}/{result.totalMarks}
            </div>

            <p className="mt-2 text-lg font-bold text-slate-700">
              {result.percentage}%
            </p>

            <div
              className={`mt-4 inline-flex rounded-full px-5 py-2 font-bold ${
                result.isPassed
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {result.isPassed ? "PASSED" : "NOT PASSED"}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-slate-800">
                {result.totalQuestions}
              </p>
              <p className="text-xs text-slate-500">Total</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-indigo-600">
                {result.attemptedQuestions}
              </p>
              <p className="text-xs text-slate-500">Attempted</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-green-600">
                {result.correctAnswers}
              </p>
              <p className="text-xs text-slate-500">Correct</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-2xl font-black text-red-600">
                {result.wrongAnswers}
              </p>
              <p className="text-xs text-slate-500">Wrong</p>
            </div>
          </div>

          <button
            onClick={() => navigate("/student/quizzes")}
            className="mt-8 w-full rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700"
          >
            Back to Quizzes
          </button>
        </div>
      </div>
    );
  }

  const questions = quiz.questions;
  const question = questions[currentQuestion];

  const answeredCount = Object.keys(answers).length;
  const unansweredCount = questions.length - answeredCount;

  return (
    <div className="min-h-screen bg-slate-50 px-3 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-5 flex flex-col justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <button
              onClick={() => navigate("/student/quizzes")}
              className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600"
            >
              <ArrowLeft size={17} />
              Back to Quizzes
            </button>

            <h1 className="text-xl font-black text-slate-900 sm:text-2xl">
              {quiz.title}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Class {quiz.classNo} · {quiz.subject} · {quiz.chapter}
            </p>
          </div>

          <div
            className={`flex items-center gap-3 rounded-xl px-5 py-3 ${
              timeLeft <= 60
                ? "bg-red-50 text-red-600"
                : "bg-indigo-50 text-indigo-700"
            }`}
          >
            <Clock size={23} />

            <div>
              <p className="text-xs font-semibold">
                Time Remaining
              </p>

              <p className="text-xl font-black tabular-nums">
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-5 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-bold text-slate-700">
              Question {currentQuestion + 1} of {questions.length}
            </span>

            <span className="font-bold text-indigo-600">
              {answeredCount} Answered
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${(answeredCount / questions.length) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* Question area */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-lg bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700">
                  Question {currentQuestion + 1}
                </span>

                <span className="text-sm font-bold text-slate-500">
                  {question.marks} Marks
                </span>
              </div>

              <h2 className="text-lg font-bold leading-relaxed text-slate-900 sm:text-xl">
                {question.questionText}
              </h2>

              <div className="mt-7 space-y-3">
                {question.options.map((option, index) => {
                  const selected =
                    answers[question._id] === index;

                  const optionText =
                    typeof option === "string"
                      ? option
                      : option.label || option.text || "";

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={submitting || timeLeft <= 0}
                      onClick={() =>
                        selectAnswer(question._id, index)
                      }
                      className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition ${
                        selected
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                          selected
                            ? "bg-indigo-600 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>

                      <span
                        className={`font-semibold ${
                          selected
                            ? "text-indigo-800"
                            : "text-slate-700"
                        }`}
                      >
                        {optionText}
                      </span>

                      {selected && (
                        <CheckCircle2
                          className="ml-auto shrink-0 text-indigo-600"
                          size={21}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Previous / Next */}
              <div className="mt-8 flex items-center justify-between gap-3 border-t pt-5">
                <button
                  onClick={() =>
                    goToQuestion(currentQuestion - 1)
                  }
                  disabled={
                    currentQuestion === 0 || submitting
                  }
                  className="flex items-center gap-2 rounded-xl border px-4 py-3 font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft size={18} />
                  Previous
                </button>

                {currentQuestion < questions.length - 1 ? (
                  <button
                    onClick={() =>
                      goToQuestion(currentQuestion + 1)
                    }
                    disabled={submitting || timeLeft <= 0}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
                  >
                    Next
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => submitQuiz(false)}
                    disabled={submitting || timeLeft <= 0}
                    className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Send size={18} />
                    )}
                    Submit Test
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}
          </div>

          {/* Question palette */}
          <div>
            <div className="rounded-2xl border bg-white p-5 shadow-sm">
              <h3 className="font-black text-slate-900">
                Question Palette
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Select a question to navigate.
              </p>

              <div className="mt-5 grid grid-cols-5 gap-2">
                {questions.map((item, index) => {
                  const answered =
                    answers[item._id] !== undefined;

                  const active = currentQuestion === index;

                  return (
                    <button
                      key={item._id}
                      onClick={() => goToQuestion(index)}
                      disabled={submitting || timeLeft <= 0}
                      className={`flex h-10 items-center justify-center rounded-lg border-2 text-sm font-black transition ${
                        active
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : answered
                          ? "border-green-200 bg-green-50 text-green-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-3 border-t pt-5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-green-500" />
                  Answered
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded border border-slate-300 bg-white" />
                  Not Answered
                </div>

                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded bg-indigo-600" />
                  Current Question
                </div>
              </div>

              <div className="mt-6 rounded-xl bg-slate-50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">
                    Answered
                  </span>

                  <strong className="text-green-600">
                    {answeredCount}
                  </strong>
                </div>

                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-slate-500">
                    Unanswered
                  </span>

                  <strong className="text-red-500">
                    {unansweredCount}
                  </strong>
                </div>
              </div>

              <button
                onClick={() => submitQuiz(false)}
                disabled={submitting || timeLeft <= 0}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <Flag size={18} />
                )}

                Submit Test
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
