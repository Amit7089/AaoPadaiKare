
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  BookOpen,
  Award,
  RefreshCw,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function QuizResultDetails() {
  // URL parameter now contains RESULT ID, not Quiz ID
  const { id: resultId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("studentToken");

  // Fetch exact attempt result using Result ID
  const fetchResult = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        navigate("/login");
        return;
      }

      if (!resultId) {
        throw new Error("Result ID not found.");
      }

      const response = await fetch(
        `${API_URL}/student/results/${resultId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Result load nahi ho saka."
        );
      }

      setResult(data.result);
    } catch (err) {
      setError(
        err.message || "Something went wrong."
      );
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [resultId, token]);

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "N/A";
    }

    return parsedDate.toLocaleString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Loading screen
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-indigo-600" />

          <p className="mt-3 font-semibold text-slate-600">
            Loading detailed result...
          </p>
        </div>
      </div>
    );
  }

  // Error screen
  if (error || !result) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-white p-7 text-center shadow-sm">
          <XCircle className="mx-auto h-12 w-12 text-red-500" />

          <h2 className="mt-4 text-xl font-black text-slate-900">
            Result Not Available
          </h2>

          <p className="mt-2 text-slate-500">
            {error || "Result nahi mila."}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={fetchResult}
              className="flex items-center justify-center gap-2 rounded-xl border px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw size={17} />
              Try Again
            </button>

            <button
              onClick={() => navigate("/student/quiz-history")}
              className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
            >
              Back to History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const quiz = result.quiz || {};
  const answers = Array.isArray(result.answers)
    ? result.answers
    : [];

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">

        {/* Back Button */}
        <button
          onClick={() => navigate("/student/quiz-history")}
          className="mb-6 flex items-center gap-2 font-bold text-slate-600 transition hover:text-indigo-600"
        >
          <ArrowLeft size={19} />
          Back to Quiz History
        </button>

        {/* Result Header */}
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">

          <div
            className={`p-7 text-center sm:p-10 ${
              result.isPassed
                ? "bg-green-50"
                : "bg-red-50"
            }`}
          >
            <div
              className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
                result.isPassed
                  ? "bg-green-100"
                  : "bg-red-100"
              }`}
            >
              {result.isPassed ? (
                <Trophy
                  size={42}
                  className="text-green-600"
                />
              ) : (
                <Award
                  size={42}
                  className="text-red-500"
                />
              )}
            </div>

            <h1 className="mt-5 text-3xl font-black text-slate-900">
              {result.isPassed
                ? "Congratulations!"
                : "Keep Practicing!"}
            </h1>

            <p className="mt-2 font-semibold text-slate-600">
              {quiz.title || "Quiz Result"}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {quiz.subject || "Subject"} · Class{" "}
              {quiz.classNo || "N/A"}
            </p>

            <div
              className={`mt-5 inline-flex rounded-full px-5 py-2 text-sm font-black ${
                result.isPassed
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }`}
            >
              {result.isPassed ? "PASSED" : "NOT PASSED"}
            </div>
          </div>

          {/* Score Cards */}
          <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-3 sm:p-8">

            <div className="rounded-2xl bg-indigo-50 p-5 text-center">
              <p className="text-sm font-bold text-indigo-600">
                Total Score
              </p>

              <p className="mt-2 text-4xl font-black text-indigo-700">
                {result.obtainedMarks}/{result.totalMarks}
              </p>
            </div>

            <div className="rounded-2xl bg-purple-50 p-5 text-center">
              <p className="text-sm font-bold text-purple-600">
                Percentage
              </p>

              <p className="mt-2 text-4xl font-black text-purple-700">
                {result.percentage}%
              </p>
            </div>

            <div className="rounded-2xl bg-green-50 p-5 text-center">
              <p className="text-sm font-bold text-green-600">
                Correct Answers
              </p>

              <p className="mt-2 text-4xl font-black text-green-700">
                {result.correctAnswers}
              </p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">

          <div className="rounded-2xl border bg-white p-5">
            <BookOpen
              className="text-indigo-600"
              size={23}
            />

            <p className="mt-3 text-2xl font-black text-slate-900">
              {result.totalQuestions}
            </p>

            <p className="text-sm text-slate-500">
              Total Questions
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <CheckCircle2
              className="text-green-600"
              size={23}
            />

            <p className="mt-3 text-2xl font-black text-green-600">
              {result.attemptedQuestions}
            </p>

            <p className="text-sm text-slate-500">
              Attempted
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <XCircle
              className="text-red-500"
              size={23}
            />

            <p className="mt-3 text-2xl font-black text-red-500">
              {result.wrongAnswers}
            </p>

            <p className="text-sm text-slate-500">
              Wrong Answers
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <Clock
              className="text-orange-500"
              size={23}
            />

            <p className="mt-3 text-sm font-bold text-slate-800">
              {formatDate(result.submittedAt)}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Submitted At
            </p>
          </div>
        </div>

        {/* Answer Review */}
        <div className="mt-8">

          <div className="mb-5">
            <h2 className="text-2xl font-black text-slate-900">
              Answer Review
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Review your submitted answers and correct options.
            </p>
          </div>

          {answers.length === 0 ? (
            <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
              No answer details available for this attempt.
            </div>
          ) : (
            <div className="space-y-5">
              {answers.map((answer, index) => {
                const question = answer.question;

                if (!question) {
                  return (
                    <div
                      key={answer._id || index}
                      className="rounded-2xl border bg-white p-5"
                    >
                      Question details are no longer available.
                    </div>
                  );
                }

                const options = question.options || [];

                const selectedIndex =
                  answer.selectedOptionIndex;

                const correctIndex =
                  question.correctAnswerIndex;

                const isAttempted =
                  Number.isInteger(selectedIndex);

                return (
                  <div
                    key={answer._id || index}
                    className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                  >

                    {/* Question Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b p-5">
                      <span className="font-black text-slate-800">
                        Question {index + 1}
                      </span>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-500">
                          {answer.marksObtained || 0}/
                          {question.marks} Marks
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            answer.isCorrect
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {answer.isCorrect
                            ? "Correct"
                            : "Incorrect"}
                        </span>
                      </div>
                    </div>

                    {/* Question Body */}
                    <div className="p-5">

                      <h3 className="text-lg font-bold leading-relaxed text-slate-900">
                        {question.questionText}
                      </h3>

                      {/* Options */}
                      <div className="mt-5 space-y-3">
                        {options.map((option, optionIndex) => {
                          const optionText =
                            typeof option === "string"
                              ? option
                              : option.label ||
                                option.text ||
                                "";

                          const isCorrectOption =
                            optionIndex === correctIndex;

                          const isSelectedOption =
                            optionIndex === selectedIndex;

                          let optionStyle =
                            "border-slate-200 bg-white text-slate-700";

                          if (isCorrectOption) {
                            optionStyle =
                              "border-green-400 bg-green-50 text-green-800";
                          } else if (isSelectedOption) {
                            optionStyle =
                              "border-red-400 bg-red-50 text-red-800";
                          }

                          return (
                            <div
                              key={optionIndex}
                              className={`flex items-center gap-3 rounded-xl border-2 p-4 ${optionStyle}`}
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black shadow-sm">
                                {String.fromCharCode(
                                  65 + optionIndex
                                )}
                              </span>

                              <span className="flex-1 font-semibold">
                                {optionText}
                              </span>

                              {isCorrectOption && (
                                <CheckCircle2
                                  className="shrink-0 text-green-600"
                                  size={21}
                                />
                              )}

                              {isSelectedOption &&
                                !isCorrectOption && (
                                  <XCircle
                                    className="shrink-0 text-red-600"
                                    size={21}
                                  />
                                )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Not Attempted */}
                      {!isAttempted && (
                        <p className="mt-4 rounded-xl bg-orange-50 p-3 text-sm font-semibold text-orange-700">
                          You did not attempt this question.
                        </p>
                      )}

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="mt-5 rounded-xl bg-indigo-50 p-4">
                          <p className="text-sm font-black text-indigo-700">
                            Explanation
                          </p>

                          <p className="mt-2 text-sm leading-relaxed text-slate-700">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Explore More */}
        <button
          onClick={() => navigate("/student/quizzes")}
          className="mt-8 w-full rounded-xl bg-indigo-600 px-6 py-4 font-black text-white transition hover:bg-indigo-700"
        >
          Explore More Quizzes
        </button>

      </div>
    </div>
  );
}
