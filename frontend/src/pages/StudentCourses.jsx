
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Trophy,
  GraduationCap,
  ArrowUpRight,
  LoaderCircle,
  Languages,
  Sparkles,
  Clock3,
  BookOpen,
  BookMarked,
  RefreshCw,
  ChevronRight,
  Target,
  ShieldCheck,
  X,
  Star,
  CheckCircle2,
} from "lucide-react";
import { api } from "../services/api";

const categories = [
  { value: "all", label: "All Courses" },
  { value: "scholarship", label: "Scholarship" },
  { value: "school-entrance", label: "School Entrance" },
  { value: "olympiad", label: "Olympiad" },
  { value: "foundation", label: "Foundation" },
  { value: "other", label: "Other" },
];

const accents = [
  "from-blue-600 to-indigo-700",
  "from-violet-600 to-purple-700",
  "from-orange-500 to-rose-600",
  "from-emerald-600 to-teal-700",
];

function getPrice(course) {
  const price = Number(course.price || 0);
  return price === 0 ? "Free" : `₹${price.toLocaleString("en-IN")}`;
}

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getCourses();

      const list = Array.isArray(response)
        ? response
        : response?.courses ||
          response?.data?.courses ||
          response?.data ||
          [];

      setCourses(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || "Courses load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  }

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !query ||
        course.title?.toLowerCase().includes(query) ||
        course.examCode?.toLowerCase().includes(query) ||
        course.shortDescription?.toLowerCase().includes(query);

      const matchesCategory =
        category === "all" || course.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [courses, search, category]);

  const featuredCourses = filteredCourses.filter(
    (course) => course.featured
  );

  return (
    <main className="min-h-screen bg-[#f7f8fc] text-slate-900">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#172554] text-white shadow-md shadow-indigo-100">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="text-sm font-black tracking-tight text-[#172554]">
                AAO PADAI KARE
              </p>
              <p className="text-[9px] font-semibold tracking-[0.16em] text-slate-400">
                LEARN. PRACTICE. SUCCEED.
              </p>
            </div>
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-100 hover:text-indigo-700"
          >
            <ChevronRight className="rotate-180" size={15} />
            <span className="hidden sm:inline">Back to Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-[#142344]">
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

        <div className="pointer-events-none absolute right-[22%] top-0 hidden h-full w-px bg-white/[0.06] md:block" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_300px]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-blue-100">
                <Sparkles size={13} className="text-amber-300" />
                YOUR NEXT BIG STEP STARTS HERE
              </div>

              <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-[43px]">
                Prepare for your
                <span className="text-amber-300"> dream school </span>
                & competitive exams.
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">
                NMMS, Navodaya, Model School aur scholarship exams ke liye
                structured learning, quality notes aur exam-focused preparation.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href="#course-list"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-xs font-extrabold text-[#172554] shadow-lg shadow-amber-950/20 transition hover:-translate-y-0.5 hover:bg-amber-300"
                >
                  Explore Courses
                  <ArrowUpRight size={16} />
                </a>

                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-xs font-semibold text-slate-300">
                  <ShieldCheck size={16} className="text-emerald-300" />
                  Learn at your own pace
                </div>
              </div>
            </div>

            <div className="relative hidden md:block">
              <div className="absolute -right-2 -top-4 h-48 w-48 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="relative rounded-3xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/10 backdrop-blur-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-[#172554] shadow-lg shadow-amber-950/20">
                  <Trophy size={30} />
                </div>

                <p className="mt-5 text-xs font-bold tracking-widest text-blue-200">
                  YOUR GOAL
                </p>

                <h2 className="mt-2 text-2xl font-black text-white">
                  Learn More.
                  <br />
                  Achieve More.
                </h2>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-3/4 rounded-full bg-amber-400" />
                </div>

                <p className="mt-2 text-[10px] font-medium text-slate-400">
                  Every lesson takes you one step forward.
                </p>

                <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-4 text-[10px] font-semibold text-emerald-200">
                  <CheckCircle2 size={14} />
                  Your journey starts today
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Course Content */}
      <section
        id="course-list"
        className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8"
      >
        {/* Heading and Search */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.18em] text-orange-600">
              FIND YOUR PREPARATION PATH
            </p>

            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-[#172554] sm:text-3xl">
              Explore Courses
            </h2>

            <p className="mt-1.5 text-sm text-slate-500">
              Choose your exam and start preparing today.
            </p>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exams or courses..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-10 text-sm outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <div className="mt-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((item) => (
            <button
              key={item.value}
              onClick={() => setCategory(item.value)}
              className={`shrink-0 rounded-lg px-4 py-2.5 text-xs font-bold transition ${
                category === item.value
                  ? "bg-[#172554] text-white shadow-md shadow-slate-300/40"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Featured Courses */}
        {!loading &&
          !error &&
          category === "all" &&
          !search &&
          featuredCourses.length > 0 && (
            <div className="mt-7">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-orange-500" />
                <h3 className="text-sm font-extrabold text-[#172554]">
                  Recommended for you
                </h3>
                <span className="rounded bg-orange-50 px-2 py-1 text-[9px] font-extrabold text-orange-600">
                  FEATURED
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {featuredCourses.slice(0, 2).map((course) => (
                  <Link
                    key={course._id}
                    to={`/student/courses/${encodeURIComponent(course.slug)}`}
                    className="group relative flex min-h-36 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1d3260] to-[#263d70] p-4 text-white transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-100"
                  >
                    <div className="relative z-10 flex min-w-0 flex-1 flex-col justify-between">
                      <div>
                        <span className="inline-flex rounded-md bg-white/15 px-2 py-1 text-[9px] font-extrabold tracking-wider text-blue-100">
                          {course.examCode || "FEATURED EXAM"}
                        </span>

                        <h4 className="mt-2 line-clamp-2 max-w-sm text-lg font-black leading-snug">
                          {course.title}
                        </h4>
                      </div>

                      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        Explore course
                        <ArrowUpRight size={14} className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </span>
                    </div>

                    <div className="ml-2 flex w-20 shrink-0 items-center justify-center">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="h-20 w-20 rounded-xl object-cover shadow-lg"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                          <Trophy size={33} className="text-amber-300" />
                        </div>
                      )}
                    </div>

                    <div className="absolute -bottom-16 -right-8 h-40 w-40 rounded-full border-[20px] border-white/[0.04]" />
                  </Link>
                ))}
              </div>
            </div>
          )}

        {/* Course Results */}
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-[#172554]">
                {category === "all"
                  ? "All Available Courses"
                  : categories.find((c) => c.value === category)?.label}
              </h3>

              {!loading && !error && (
                <p className="mt-1 text-xs text-slate-400">
                  {filteredCourses.length} courses available
                </p>
              )}
            </div>

            <div className="hidden items-center gap-1.5 text-[11px] font-semibold text-slate-400 sm:flex">
              <Target size={14} />
              Exam focused learning
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <LoaderCircle
                size={34}
                className="animate-spin text-indigo-600"
              />
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Preparing your courses...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-100 bg-white p-10 text-center">
              <p className="text-sm font-semibold text-red-600">{error}</p>
              <button
                onClick={loadCourses}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#172554] px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-800"
              >
                <RefreshCw size={14} />
                Try Again
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">
              <BookOpen size={34} className="mx-auto text-slate-300" />

              <h3 className="mt-3 font-extrabold text-slate-800">
                No courses found
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Try another search or category.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                }}
                className="mt-4 text-xs font-bold text-indigo-600"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {filteredCourses.map((course, index) => {
                const accent = accents[index % accents.length];

                return (
                  <article
                    key={course._id}
                    className="group border-b border-slate-100 last:border-0 transition hover:bg-slate-50/80"
                  >
                    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:px-5 sm:py-4">
                      {/* Thumbnail */}
                      <div
                        className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${accent} ring-1 ring-black/5`}
                      >
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <Trophy size={28} className="text-white" />
                        )}
                      </div>

                      {/* Course information */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-extrabold tracking-wider text-indigo-600">
                            {course.examCode || "COMPETITIVE EXAM"}
                          </span>

                          {course.featured && (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                              <Star size={10} />
                              Featured
                            </span>
                          )}
                        </div>

                        <h4 className="mt-1 text-sm font-extrabold text-slate-900 transition group-hover:text-indigo-700 sm:text-base">
                          {course.title}
                        </h4>

                        <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                          {course.shortDescription ||
                            "Explore this exam preparation course."}
                        </p>

                        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-semibold text-slate-500">
                          <span className="flex items-center gap-1">
                            <GraduationCap size={13} className="text-indigo-500" />
                            Class {(course.targetClasses || []).join(", ") || "All"}
                          </span>

                          <span className="flex items-center gap-1">
                            <Languages size={13} className="text-indigo-500" />
                            {(course.supportedLanguages || []).join(", ") || "Hindi"}
                          </span>

                          {course.durationDays > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock3 size={12} className="text-indigo-500" />
                              {course.durationDays} Days
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Price and action */}
                      <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:min-w-36 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                        <div className="sm:text-right">
                          <p className="text-[9px] font-bold tracking-wider text-slate-400">
                            COURSE FEE
                          </p>

                          <p className="text-lg font-black text-[#172554]">
                            {getPrice(course)}
                          </p>

                          {Number(course.compareAtPrice) > Number(course.price) && (
                            <p className="text-[10px] text-slate-400 line-through">
                              ₹{course.compareAtPrice}
                            </p>
                          )}
                        </div>

                        <Link
                          to={`/student/courses/${encodeURIComponent(course.slug)}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#172554] px-3.5 py-2.5 text-[11px] font-bold text-white transition hover:bg-indigo-700"
                        >
                          View Details
                          <ArrowUpRight size={14} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom information */}
        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-200 hover:shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <BookMarked size={19} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">
                Study Material
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Notes and learning resources
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-orange-200 hover:shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              <Target size={19} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">
                Exam Preparation
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Focused learning by exam
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200 hover:shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800">
                Learn in Two Languages
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Hindi and English courses
              </p>
            </div>
          </div>
        </div>

        <footer className="mt-9 border-t border-slate-200 py-5 text-center text-[10px] font-medium text-slate-400">
          © Aao Padai Kare · Learn today, lead tomorrow.
        </footer>
      </section>
    </main>
  );
}
