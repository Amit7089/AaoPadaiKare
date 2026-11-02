
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Trophy } from "lucide-react";

const questions = [
  {
    question: "What is 12 × 8?",
    options: ["84", "96", "108", "88"],
    answer: 1,
    explanation: "12 multiplied by 8 equals 96.",
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Earth", "Venus", "Mars", "Jupiter"],
    answer: 2,
    explanation: "Mars appears reddish because of iron oxide on its surface.",
  },
  {
    question: "What is the chemical formula of water?",
    options: ["CO₂", "O₂", "NaCl", "H₂O"],
    answer: 3,
    explanation: "A water molecule contains two hydrogen atoms and one oxygen atom.",
  },
  {
    question: "Which word is a noun?",
    options: ["Quickly", "Beautiful", "School", "Run"],
    answer: 2,
    explanation: "School is a noun because it names a place.",
  },
  {
    question: "How many sides does a triangle have?",
    options: ["Two", "Three", "Four", "Five"],
    answer: 1,
    explanation: "A triangle has three sides.",
  },
];

export default function Quiz() {
  const [params] = useSearchParams();
  const classNo = params.get("class") || "10";
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  const question = questions[current];
  const selected = answers[current];
  const score = questions.reduce(
    (total, q, index) => total + (answers[index] === q.answer ? 1 : 0),
    0
  );

  function restart() {
    setCurrent(0);
    setAnswers({});
    setFinished(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <Link to={`/classes/${classNo}`} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700">
          <ArrowLeft size={17} /> Back to Class {classNo}
        </Link>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-indigo-100 sm:p-9">
          {finished ? (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Trophy size={40} />
              </div>
              <p className="mt-6 text-sm font-extrabold uppercase tracking-widest text-indigo-600">Quiz completed</p>
              <h1 className="mt-2 text-3xl font-black text-slate-900">Your result</h1>
              <p className="mt-5 text-5xl font-black text-indigo-600">
                {score}/{questions.length}
              </p>
              <p className="mt-3 text-slate-600">
                {score === questions.length
                  ? "Excellent! Sabhi answers sahi hain."
                  : "Achha effort! Answers review karo aur phir try karo."}
              </p>

              <div className="mt-7 space-y-3 text-left">
                {questions.map((q, index) => (
                  <div key={q.question} className="rounded-2xl bg-slate-50 p-4">
                    <p className="font-bold text-slate-900">{index + 1}. {q.question}</p>
                    <p className={`mt-2 text-sm ${answers[index] === q.answer ? "text-emerald-700" : "text-rose-700"}`}>
                      Your answer: {q.options[answers[index]] ?? "Not answered"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">Correct answer: {q.options[q.answer]}</p>
                    <p className="mt-1 text-sm text-slate-500">{q.explanation}</p>
                  </div>
                ))}
              </div>

              <button onClick={restart} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700">
                <RotateCcw size={17} /> Try again
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full bg-indigo-50 px-3 py-2 text-xs font-extrabold text-indigo-700">
                  CLASS {classNo} • DEMO QUIZ
                </span>
                <span className="text-sm font-bold text-slate-500">
                  Question {current + 1} of {questions.length}
                </span>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
              </div>

              <h1 className="mt-8 text-2xl font-black leading-snug text-slate-900 sm:text-3xl">
                {question.question}
              </h1>
              <p className="mt-2 text-sm text-slate-500">Select one correct answer.</p>

              <div className="mt-7 space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = selected === index;
                  return (
                    <button
                      key={option}
                      onClick={() => setAnswers({ ...answers, [current]: index })}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-100"
                          : "border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="flex-1 font-semibold">{option}</span>
                      {isSelected && <CheckCircle2 size={20} />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-6">
                <button
                  disabled={current === 0}
                  onClick={() => setCurrent(current - 1)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={selected === undefined}
                  onClick={() => current === questions.length - 1 ? setFinished(true) : setCurrent(current + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {current === questions.length - 1 ? "See result" : "Next question"}
                  <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
