
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Sparkles,
  LoaderCircle,
  RefreshCw,
  BookMarked,
  Crown,
  ShieldCheck,
  LockKeyhole,
  CalendarDays,
  Clock3,
  Library,
  Search,
} from "lucide-react";

import { api, clearStudentToken } from "../services/api";

const allClasses = [
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

function formatDate(date) {
  if (!date) return "N/A";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "N/A";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getActiveMemberships(memberships = []) {
  const now = Date.now();

  return memberships.filter((membership) => {
    const expiry = membership.expiresAt
      ? new Date(membership.expiresAt).getTime()
      : 0;

    return (
      membership.status === "active" &&
      Number(membership.classNo) >= 6 &&
      Number(membership.classNo) <= 12 &&
      Number.isFinite(expiry) &&
      expiry > now
    );
  });
}

function getResponseList(response) {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.syllabus)) return data.syllabus;

  return [];
}

export default function Classes() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [studentResponse, syllabusResponse] = await Promise.all([
        api.getStudent(),
        api.getSyllabus(),
      ]);

      const studentData =
        studentResponse?.student ||
        studentResponse?.data?.student ||
        studentResponse?.data;

      if (!studentData) {
        throw new Error("Student profile nahi mil payi.");
      }

      setStudent(studentData);
      setSyllabus(getResponseList(syllabusResponse));
    } catch (err) {
      console.error("Load classes error:", err);

      if (err.status === 401 || !localStorage.getItem("studentToken")) {
        clearStudentToken();
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.message || "Classes load nahi ho payi. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  // Only currently active memberships
  const activeMemberships = useMemo(
    () => getActiveMemberships(student?.memberships || []),
    [student]
  );

  // One card per class, even if duplicate membership entries exist
  const visibleClasses = useMemo(() => {
    const activeNumbers = [
      ...new Set(
        activeMemberships.map((membership) =>
          Number(membership.classNo)
        )
      ),
    ];

    return allClasses.filter((item) =>
      activeNumbers.includes(item.number)
    );
  }, [activeMemberships]);

  const getMembership = (classNo) => {
    return activeMemberships
      .filter(
        (membership) => Number(membership.classNo) === classNo
      )
      .sort(
        (a, b) =>
          new Date(b.expiresAt).getTime() -
          new Date(a.expiresAt).getTime()
      )[0];
  };

  const getClassSubjects = (classNo) => {
    return [
      ...new Set(
        syllabus
          .filter(
            (item) => Number(item.classNo) === classNo
          )
          .map((item) => item.subject?.trim())
          .filter(Boolean)
      ),
    ];
  };

  const getChapterCount = (classNo) => {
    return syllabus.filter(
      (item) => Number(item.classNo) === classNo
    ).length;
  };

  // Loading state
  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50">
            <LoaderCircle
              size={34}
              className="animate-spin text-indigo-600"
            />
          </div>

          <h2 className="mt-4 text-lg font-extrabold text-slate-800">
            Loading your classes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Preparing your personal learning space...
          </p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <RefreshCw
            size={38}
            className="mx-auto text-red-500"
          />

          <h2 className="mt-4 text-xl font-black text-slate-900">
            Classes load nahi hui
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {error}
          </p>

          <button
            onClick={loadClasses}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            <RefreshCw size={17} />
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fc]">

      {/* Hero section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#101d43] via-[#172554] to-[#263d83] text-white">
        <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold tracking-wider text-indigo-100">
            <Sparkles size={15} />
            MY LEARNING SPACE
          </div>

          <div className="mt-6 flex flex-col justify-between gap-7 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold text-blue-200">
                Welcome back{student?.name ? `, ${student.name}` : ""}!
              </p>

              <h1 className="mt-2 text-3xl font-black sm:text-5xl">
                My Classes
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-indigo-100 sm:text-base">
                Apni active membership wali class select karein,
                syllabus explore karein aur chapter-wise padhai
                shuru karein.
              </p>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 sm:w-auto">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 sm:min-w-36">
                <GraduationCap size={23} className="text-blue-200" />
                <p className="mt-3 text-xs font-semibold text-indigo-100">
                  ACTIVE CLASSES
                </p>
                <p className="mt-1 text-3xl font-black">
                  {visibleClasses.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 sm:min-w-36">
                <BookOpen size={23} className="text-emerald-200" />
                <p className="mt-3 text-xs font-semibold text-indigo-100">
                  TOTAL CHAPTERS
                </p>
                <p className="mt-1 text-3xl font-black">
                  {visibleClasses.reduce(
                    (total, item) =>
                      total + getChapterCount(item.number),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main classes section */}
      <section className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12 lg:px-8">

        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-black tracking-[0.16em] text-indigo-600">
              YOUR MEMBERSHIPS
            </p>

            <h2 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Your Learning Classes
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Select a class to explore its subjects and chapters.
            </p>
          </div>

          <Link
            to="/membership"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-indigo-100 bg-white px-4 py-3 text-sm font-bold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
          >
            <Crown size={17} />
            Manage Membership
            <ArrowRight size={16} />
          </Link>
        </div>

        {visibleClasses.length === 0 ? (
          /* No active memberships */
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="px-6 py-12 text-center sm:px-12 sm:py-16">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 text-amber-600">
                <LockKeyhole size={36} />
              </div>

              <h2 className="mt-6 text-2xl font-black text-slate-900">
                Start Your Learning Journey
              </h2>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-500">
                Abhi aapke account mein kisi class ki active
                Premium Membership nahi hai. Apni class choose
                karke membership activate karein aur complete
                learning material access karein.
              </p>

              <div className="mx-auto mt-7 grid max-w-lg gap-3 text-left sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <ShieldCheck
                    size={23}
                    className="text-emerald-600"
                  />
                  <p className="mt-3 text-sm font-bold text-slate-800">
                    Class-wise Access
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Har class ki membership alag rahegi.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <CalendarDays
                    size={23}
                    className="text-indigo-600"
                  />
                  <p className="mt-3 text-sm font-bold text-slate-800">
                    Flexible Plans
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Monthly aur yearly plans available hain.
                  </p>
                </div>
              </div>

              <Link
                to="/membership"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-800"
              >
                <Crown size={18} />
                Explore Membership Plans
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleClasses.map((item) => {
              const subjects = getClassSubjects(item.number);
              const chapterCount = getChapterCount(item.number);
              const membership = getMembership(item.number);

              return (
                <Link
                  key={item.number}
                  to={`/classes/${item.number}`}
                  className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/60"
                >
                  {/* Card banner */}
                  <div
                    className={`relative overflow-hidden bg-gradient-to-br ${item.color} p-6 text-white`}
                  >
                    <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />

                    <div className="relative flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold tracking-widest text-white/75">
                          MP BOARD
                        </p>

                        <h3 className="mt-3 text-3xl font-black">
                          Class {item.number}
                        </h3>
                      </div>

                      <div className="rounded-2xl bg-white/20 p-3">
                        <GraduationCap size={30} />
                      </div>
                    </div>

                    <div className="relative mt-6 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-extrabold">
                      <ShieldCheck size={14} />
                      PREMIUM ACTIVE
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="p-6">
                    <p className="min-h-12 text-sm leading-6 text-slate-500">
                      {item.description}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-indigo-50 p-3">
                        <div className="flex items-center gap-2 text-indigo-600">
                          <BookOpen size={17} />
                          <span className="text-xs font-bold">
                            Subjects
                          </span>
                        </div>

                        <p className="mt-2 text-2xl font-black text-indigo-700">
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

                        <p className="mt-2 text-2xl font-black text-emerald-700">
                          {chapterCount}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                        Available Subjects
                      </p>

                      {subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {subjects.slice(0, 4).map((subject) => (
                            <span
                              key={subject}
                              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600"
                            >
                              {subject}
                            </span>
                          ))}

                          {subjects.length > 4 && (
                            <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                              +{subjects.length - 4} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">
                          Subjects will be available soon.
                        </p>
                      )}
                    </div>

                    <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-800">
                        <Crown size={15} />
                        {membership?.plan || "Premium"} Membership
                      </div>

                      <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
                        <Clock3 size={13} />
                        Valid till {formatDate(membership?.expiresAt)}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="flex items-center gap-2 text-sm font-extrabold text-indigo-700">
                        Explore Class
                      </span>

                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
                        <ArrowRight size={18} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Learning information */}
        <div className="mt-9 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <BookOpen className="text-indigo-600" size={23} />
            <h3 className="mt-3 font-extrabold text-slate-900">
              Chapter-wise Learning
            </h3>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Har subject ke chapters ko step-by-step explore karein.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Library className="text-emerald-600" size={23} />
            <h3 className="mt-3 font-extrabold text-slate-900">
              Study Resources
            </h3>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Written notes, video lectures aur handwritten material.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <Crown className="text-amber-500" size={23} />
            <h3 className="mt-3 font-extrabold text-slate-900">
              Membership Benefits
            </h3>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Apni active class ke Premium learning resources access karein.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
