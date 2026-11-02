
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  LoaderCircle,
  RefreshCw,
  BookMarked,
} from "lucide-react";

import { api } from "../services/api";

const classes = [
  {
    number: 6,
    color: "from-sky-500 to-blue-600",
    description: "Build your basics and explore new subjects.",
  },
  {
    number: 7,
    color: "from-violet-500 to-purple-600",
    description: "Strengthen your concepts with regular practice.",
  },
  {
    number: 8,
    color: "from-pink-500 to-rose-600",
    description: "Prepare for the next stage of learning.",
  },
  {
    number: 9,
    color: "from-amber-500 to-orange-600",
    description: "Understand concepts and improve your skills.",
  },
  {
    number: 10,
    color: "from-emerald-500 to-green-600",
    description: "Build a strong foundation for board exams.",
  },
  {
    number: 11,
    color: "from-cyan-500 to-teal-600",
    description: "Explore your chosen stream and subjects.",
  },
  {
    number: 12,
    color: "from-indigo-500 to-blue-700",
    description: "Focus on board exam preparation and revision.",
  },
];

export default function Classes() {
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadSyllabus() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getSyllabus();

      const syllabusData = Array.isArray(response.data)
        ? response.data
        : [];

      setSyllabus(syllabusData);
    } catch (err) {
      setError(err.message || "Syllabus load nahi ho paya.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSyllabus();
  }, []);

  const getClassSubjects = (classNo) => {
    return [
      ...new Set(
        syllabus
          .filter((item) => Number(item.classNo) === classNo)
          .map((item) => item.subject)
          .filter(Boolean)
      ),
    ];
  };

  const getChapterCount = (classNo) => {
    return syllabus.filter(
      (item) => Number(item.classNo) === classNo
    ).length;
  };

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HERO SECTION */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-sky-50">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">

          <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-bold text-indigo-700">
            <Sparkles size={16} />
            MP Board Learning
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Choose Your{" "}
            <span className="text-indigo-600">Class</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Class 6 se 12 tak apni class chuno. Apne subjects,
            chapters aur study material explore karo.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
              <GraduationCap size={20} className="text-indigo-600" />
              <span className="text-sm font-bold text-slate-700">
                7 Classes Available
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm">
              <BookOpen size={20} className="text-emerald-600" />
              <span className="text-sm font-bold text-slate-700">
                Chapter-wise Learning
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CLASSES SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        <div className="mb-8">
          <h2 className="text-2xl font-black text-slate-900">
            Explore Your Classes
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Apni current class select karke syllabus aur study material dekhein.
          </p>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <LoaderCircle
              size={40}
              className="animate-spin text-indigo-600"
            />

            <p className="mt-4 text-sm font-semibold text-slate-500">
              Loading classes and syllabus...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-semibold text-red-700">{error}</p>

            <button
              onClick={loadSyllabus}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
            >
              <RefreshCw size={17} />
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {classes.map((item) => {
              const subjects = getClassSubjects(item.number);
              const chapterCount = getChapterCount(item.number);

              return (
                <Link
                  key={item.number}
                  to={`/classes/${item.number}`}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100"
                >
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between">

                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg`}
                    >
                      <GraduationCap size={31} />
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                      MP Board
                    </span>
                  </div>

                  {/* CLASS TITLE */}
                  <h3 className="mt-6 text-2xl font-black text-slate-900">
                    Class {item.number}
                  </h3>

                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-600">
                    {item.description}
                  </p>

                  {/* SUBJECT INFORMATION */}
                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="rounded-xl bg-indigo-50 p-3">
                      <div className="flex items-center gap-2 text-indigo-600">
                        <BookOpen size={17} />

                        <span className="text-xs font-bold">
                          Subjects
                        </span>
                      </div>

                      <p className="mt-2 text-xl font-black text-indigo-700">
                        {subjects.length}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-3">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <BookMarked size={17} />

                        <span className="text-xs font-bold">
                          Chapters
                        </span>
                      </div>

                      <p className="mt-2 text-xl font-black text-emerald-700">
                        {chapterCount}
                      </p>
                    </div>
                  </div>

                  {/* SUBJECT PREVIEW */}
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                      Available Subjects
                    </p>

                    {subjects.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {subjects.slice(0, 3).map((subject) => (
                          <span
                            key={subject}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                          >
                            {subject}
                          </span>
                        ))}

                        {subjects.length > 3 && (
                          <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                            +{subjects.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Subjects will be available soon.
                      </p>
                    )}
                  </div>

                  {/* CARD FOOTER */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <span className="flex items-center gap-2 text-sm font-bold text-indigo-700">
                      <BookOpen size={17} />
                      Explore Class
                    </span>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
                      <ArrowRight size={18} />
                    </span>
                  </div>
                </Link>
              );
            })}

          </div>
        )}
      </section>
    </main>
  );
}
