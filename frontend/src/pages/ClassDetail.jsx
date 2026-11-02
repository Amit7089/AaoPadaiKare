
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  GraduationCap,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api";

const subjectColors = [
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-orange-100 text-orange-700",
  "bg-violet-100 text-violet-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
];

export default function ClassDetail() {
  const { classNo } = useParams();

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const validClass = Number(classNo) >= 6 && Number(classNo) <= 12;

  const fetchSyllabus = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.getSyllabus(Number(classNo));
      const syllabus = Array.isArray(response.data) ? response.data : [];

      // Group chapters by subject
      const groupedSubjects = syllabus.reduce((groups, item) => {
        const subjectName = item.subject?.trim();

        if (!subjectName) return groups;

        if (!groups[subjectName]) {
          groups[subjectName] = [];
        }

        if (item.chapter && !groups[subjectName].includes(item.chapter)) {
          groups[subjectName].push(item.chapter);
        }

        return groups;
      }, {});

      const formattedSubjects = Object.entries(groupedSubjects).map(
        ([name, chapters]) => ({
          name,
          chapters,
        })
      );

      setSubjects(formattedSubjects);
    } catch (err) {
      setError(err.message || "Syllabus load nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (validClass) {
      fetchSyllabus();
    } else {
      setLoading(false);
    }
  }, [classNo]);

  if (!validClass) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-black text-slate-900">
          Class not found
        </h1>
        <Link
          to="/classes"
          className="mt-5 inline-block font-bold text-indigo-600"
        >
          Browse classes
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-gradient-to-br from-indigo-50 via-white to-sky-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            to="/classes"
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700"
          >
            <ArrowLeft size={17} />
            All Classes
          </Link>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-600 text-white shadow-xl shadow-indigo-200">
              <GraduationCap size={42} />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                MP Board • Study Centre
              </p>
              <h1 className="mt-2 text-4xl font-black text-slate-900">
                Class {classNo}
              </h1>
              <p className="mt-2 text-slate-600">
                Apne subjects chuno aur chapter-wise learning explore karo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-7">
          <h2 className="text-2xl font-black text-slate-900">
            Your Subjects
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Chapter list dekhne ke liye kisi subject ko open karein.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm">
            <RefreshCw className="mx-auto animate-spin text-indigo-600" size={32} />
            <p className="mt-4 font-semibold text-slate-600">
              Subjects load ho rahe hain...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-semibold text-red-700">{error}</p>
            <button
              onClick={fetchSyllabus}
              className="mt-4 rounded-xl bg-red-600 px-5 py-2.5 font-bold text-white"
            >
              Try Again
            </button>
          </div>
        ) : subjects.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <BookOpen className="mx-auto text-slate-400" size={40} />
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              No subjects added yet
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Admin Panel se Class {classNo} ka syllabus add karein.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {subjects.map((subject, index) => (
              <article
                key={subject.name}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                      subjectColors[index % subjectColors.length]
                    }`}
                  >
                    <BookOpen size={24} />
                  </div>

                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {subject.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {subject.chapters.length} chapters
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {subject.chapters.map((chapter, chapterIndex) => (
                    <Link
                      key={chapter}
                      to={`/notes?class=${classNo}&subject=${encodeURIComponent(
                        subject.name
                      )}&chapter=${encodeURIComponent(chapter)}`}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition hover:bg-indigo-50"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-extrabold text-indigo-700 shadow-sm">
                        {chapterIndex + 1}
                      </span>

                      <span className="flex-1 text-sm font-medium text-slate-700">
                        {chapter}
                      </span>

                      <ArrowRight size={16} className="text-slate-400" />
                    </Link>
                  ))}
                </div>

                <Link
                  to={`/notes?class=${classNo}&subject=${encodeURIComponent(
                    subject.name
                  )}`}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900"
                >
                  Open subject notes
                  <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={`/quiz?class=${classNo}`}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
          >
            Practice Quiz
            <ArrowRight size={17} />
          </Link>

          <Link
            to={`/notes?class=${classNo}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 hover:border-indigo-200"
          >
            <FileText size={17} />
            Study Notes
          </Link>
        </div>
      </section>
    </main>
  );
}
