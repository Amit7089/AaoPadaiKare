
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BookMarked,
  CheckCircle2,
  ChevronRight,
  CirclePlay,
  Clock3,
  FileText,
  GraduationCap,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trophy,
} from "lucide-react";
import { api } from "../services/api";

const subjectStyles = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-amber-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-cyan-500 to-sky-600",
];

const getStudentFromResponse = (response) => {
  return (
    response?.student ||
    response?.data?.student ||
    response?.data ||
    response
  );
};

const getSyllabusFromResponse = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.syllabus)) return response.syllabus;
  if (Array.isArray(response?.data?.syllabus)) {
    return response.data.syllabus;
  }
  return [];
};

const formatDate = (date) => {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const isActiveMembership = (membership, classNumber) => {
  return (
    Number(membership?.classNo) === classNumber &&
    membership?.status === "active" &&
    membership?.expiresAt &&
    new Date(membership.expiresAt).getTime() > Date.now()
  );
};

export default function ClassDetail() {
  const { classNo } = useParams();
  const navigate = useNavigate();

  const classNumber = Number(classNo);
  const validClass = Number.isInteger(classNumber) &&
    classNumber >= 6 &&
    classNumber <= 12;

  const [subjects, setSubjects] = useState([]);
  const [student, setStudent] = useState(null);
  const [membership, setMembership] = useState(null);
  const [accessState, setAccessState] = useState("loading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchClassData = useCallback(async () => {
    if (!validClass) {
      setLoading(false);
      setAccessState("invalid");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAccessState("loading");

      // Step 1: Check logged-in student
      const studentResponse = await api.getStudent();
      const studentData = getStudentFromResponse(studentResponse);

      if (!studentData?._id && !studentData?.id) {
        throw new Error("Student login required");
      }

      setStudent(studentData);

      // Step 2: Verify exact class membership
      const memberships = Array.isArray(studentData.memberships)
        ? studentData.memberships
        : [];

      const activeMembership = memberships.find((item) =>
        isActiveMembership(item, classNumber)
      );

      if (!activeMembership) {
        setMembership(null);
        setAccessState("locked");
        setLoading(false);
        return;
      }

      setMembership(activeMembership);

      // Step 3: Load syllabus only after membership check
      const syllabusResponse = await api.getSyllabus(classNumber);
      const syllabus = getSyllabusFromResponse(syllabusResponse);

      const grouped = {};

      syllabus.forEach((item) => {
        const subjectName = item?.subject?.trim();
        const chapterName = item?.chapter?.trim();

        if (!subjectName) return;

        if (!grouped[subjectName]) {
          grouped[subjectName] = [];
        }

        if (
          chapterName &&
          !grouped[subjectName].some(
            (chapter) => chapter.name === chapterName
          )
        ) {
          grouped[subjectName].push({
            name: chapterName,
            id: item._id,
          });
        }
      });

      const formattedSubjects = Object.entries(grouped).map(
        ([name, chapters]) => ({
          name,
          chapters,
        })
      );

      setSubjects(formattedSubjects);
      setAccessState("allowed");
    } catch (err) {
      const message = err?.message || "Class load nahi ho payi.";

      if (
        err?.status === 401 ||
        message.toLowerCase().includes("login") ||
        message.toLowerCase().includes("token")
      ) {
        navigate("/login", {
          replace: true,
          state: { from: `/classes/${classNumber}` },
        });
        return;
      }

      setError(message);
      setAccessState("error");
    } finally {
      setLoading(false);
    }
  }, [classNumber, validClass, navigate]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return subjects;

    return subjects
      .map((subject) => ({
        ...subject,
        chapters: subject.chapters.filter((chapter) =>
          chapter.name.toLowerCase().includes(term)
        ),
      }))
      .filter(
        (subject) =>
          subject.name.toLowerCase().includes(term) ||
          subject.chapters.length > 0
      );
  }, [subjects, search]);

  const totalChapters = subjects.reduce(
    (total, subject) => total + subject.chapters.length,
    0
  );

  if (!validClass) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-lg rounded-3xl bg-white p-10 text-center shadow-sm">
          <BookOpen className="mx-auto text-slate-400" size={48} />
          <h1 className="mt-5 text-2xl font-black text-slate-900">
            Class not found
          </h1>
          <p className="mt-2 text-slate-500">
            Please select a valid MP Board class.
          </p>
          <Link
            to="/classes"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white"
          >
            Browse Classes
          </Link>
        </div>
      </main>
    );
  }

  if (loading || accessState === "loading") {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <RefreshCw size={30} className="animate-spin" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold text-slate-900">
            Preparing your classroom
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Checking access and loading your syllabus...
          </p>
        </div>
      </main>
    );
  }

  if (accessState === "locked") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Link
            to="/classes"
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700"
          >
            <ArrowLeft size={17} />
            Back to My Classes
          </Link>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-8 py-12 text-center text-white">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15">
                <LockKeyhole size={38} />
              </div>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-indigo-100">
                Membership Required
              </p>
              <h1 className="mt-3 text-3xl font-black">
                Class {classNumber} is locked
              </h1>
              <p className="mx-auto mt-3 max-w-md leading-7 text-indigo-100">
                Activate your Class {classNumber} membership to access its
                subjects, chapter-wise notes, PDFs and learning resources.
              </p>
            </div>

            <div className="p-8">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { icon: BookOpen, label: "Chapter-wise syllabus" },
                  { icon: FileText, label: "Study notes and PDFs" },
                  { icon: CirclePlay, label: "Video lectures" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl bg-slate-50 p-4 text-center"
                  >
                    <item.icon className="mx-auto text-indigo-600" size={25} />
                    <p className="mt-3 text-sm font-bold text-slate-700">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <Link
                to="/membership"
                state={{ classNo: classNumber }}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-4 font-extrabold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-700"
              >
                View Class {classNumber} Plans
                <ArrowRight size={18} />
              </Link>

              <p className="mt-4 text-center text-xs text-slate-500">
                Your other active class memberships will remain unaffected.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (accessState === "error") {
    return (
      <main className="min-h-[70vh] bg-slate-50 px-4 py-20">
        <div className="mx-auto max-w-lg rounded-3xl border border-red-100 bg-white p-9 text-center shadow-sm">
          <RefreshCw className="mx-auto text-red-500" size={38} />
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Unable to load classroom
          </h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
          <button
            onClick={fetchClassData}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      {/* Classroom hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 text-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Link
            to="/classes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            My Classes
          </Link>

          <div className="mt-9 grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
                <ShieldCheck size={14} />
                Active Membership
              </div>

              <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-indigo-300">
                MP Board Learning Centre
              </p>

              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Class {classNumber}
                <span className="text-indigo-300"> Classroom</span>
              </h1>

              <p className="mt-4 max-w-xl leading-7 text-indigo-100/80">
                Learn chapter by chapter, revise important topics and improve
                your preparation with structured study material.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to={`/notes?class=${classNumber}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 font-extrabold text-indigo-800 transition hover:bg-indigo-50"
                >
                  <BookOpen size={18} />
                  Explore Study Notes
                </Link>

                <Link
                  to={`/quiz?class=${classNumber}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/15"
                >
                  <Trophy size={18} />
                  Practice Quiz
                </Link>
              </div>
            </div>

            <div className="hidden h-48 w-48 items-center justify-center rounded-[2.5rem] border border-white/15 bg-white/10 shadow-2xl backdrop-blur-sm lg:flex">
              <GraduationCap size={100} className="text-indigo-100" />
            </div>
          </div>

          {/* Classroom stats */}
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <BookMarked className="text-indigo-200" size={22} />
                <div>
                  <p className="text-2xl font-black">{subjects.length}</p>
                  <p className="text-xs text-indigo-200">Subjects</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <FileText className="text-indigo-200" size={22} />
                <div>
                  <p className="text-2xl font-black">{totalChapters}</p>
                  <p className="text-xs text-indigo-200">Chapters</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Clock3 className="text-indigo-200" size={22} />
                <div>
                  <p className="text-sm font-extrabold">
                    {formatDate(membership?.expiresAt)}
                  </p>
                  <p className="text-xs text-indigo-200">Membership valid until</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
              <Sparkles size={16} />
              YOUR LEARNING SPACE
            </div>
            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Explore Your Subjects
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Select a chapter to open its study material.
            </p>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <BookOpen
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search a chapter..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />
          </div>
        </div>

        {subjects.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <BookOpen className="mx-auto text-slate-400" size={42} />
            <h3 className="mt-4 text-xl font-bold text-slate-900">
              Syllabus is being prepared
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Class {classNumber} ka syllabus abhi Admin Panel se add nahi hua
              hai.
            </p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-white p-8 text-center text-sm text-slate-500">
            No subjects or chapters match your search.
          </div>
        ) : (
          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            {filteredSubjects.map((subject) => {
              const originalIndex = subjects.findIndex(
                (item) => item.name === subject.name
              );
              const gradient =
                subjectStyles[originalIndex % subjectStyles.length];

              return (
                <article
                  key={subject.name}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/70"
                >
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}
                      >
                        <BookOpen size={27} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-extrabold text-slate-900">
                          {subject.name}
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {subject.chapters.length} Chapters
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      Enrolled
                    </span>
                  </div>

                  <div className="space-y-2 p-5">
                    {subject.chapters.map((chapter, index) => (
                      <Link
                        key={`${subject.name}-${chapter.name}`}
                        to={`/notes?class=${classNumber}&subject=${encodeURIComponent(
                          subject.name
                        )}&chapter=${encodeURIComponent(chapter.name)}`}
                        className="group flex items-center gap-3 rounded-xl border border-transparent bg-slate-50 p-3 transition hover:border-indigo-100 hover:bg-indigo-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-extrabold text-indigo-700 shadow-sm">
                          {index + 1}
                        </span>

                        <span className="min-w-0 flex-1 text-sm font-semibold text-slate-700 transition group-hover:text-indigo-800">
                          {chapter.name}
                        </span>

                        <ChevronRight
                          size={18}
                          className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600"
                        />
                      </Link>
                    ))}

                    {subject.chapters.length === 0 && (
                      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                        No chapters found for this subject.
                      </p>
                    )}
                  </div>

                  <div className="border-t border-slate-100 px-6 py-4">
                    <Link
                      to={`/notes?class=${classNumber}&subject=${encodeURIComponent(
                        subject.name
                      )}`}
                      className="inline-flex items-center gap-2 text-sm font-extrabold text-indigo-700 transition hover:text-indigo-900"
                    >
                      View all subject notes
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Learning shortcuts */}
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Link
            to={`/notes?class=${classNumber}`}
            className="group flex items-center justify-between gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-white p-6 transition hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                <FileText size={23} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900">
                  Study Material
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Notes, PDFs and learning resources
                </p>
              </div>
            </div>
            <ArrowRight
              className="shrink-0 text-indigo-600 transition group-hover:translate-x-1"
              size={21}
            />
          </Link>

          <Link
            to={`/quiz?class=${classNumber}`}
            className="group flex items-center justify-between gap-4 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 to-white p-6 transition hover:shadow-lg"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white">
                <Trophy size={23} />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900">
                  Practice & Test
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Test your preparation with quizzes
                </p>
              </div>
            </div>
            <ArrowRight
              className="shrink-0 text-emerald-600 transition group-hover:translate-x-1"
              size={21}
            />
          </Link>
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <CheckCircle2
            size={20}
            className="mt-0.5 shrink-0 text-emerald-600"
          />
          <div>
            <p className="text-sm font-bold text-emerald-900">
              Your classroom is ready
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-800">
              Study regularly, complete chapters and use practice tests to
              track your preparation.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
