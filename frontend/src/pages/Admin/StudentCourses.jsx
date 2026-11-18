
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  BookOpen,
  GraduationCap,
  Trophy,
  Sparkles,
  ArrowRight,
  LoaderCircle,
  RefreshCw,
  Languages,
  Clock,
  BookMarked,
  ShieldCheck,
  X,
  Filter,
} from "lucide-react";

import { api } from "../services/api";

const categories = [
  { value: "all", label: "All Courses" },
  { value: "scholarship", label: "Scholarship Exam" },
  { value: "school-entrance", label: "School Entrance" },
  { value: "olympiad", label: "Olympiad" },
  { value: "foundation", label: "Foundation" },
  { value: "other", label: "Other" },
];

const categoryLabels = {
  scholarship: "Scholarship Exam",
  "school-entrance": "School Entrance",
  olympiad: "Olympiad",
  foundation: "Foundation",
  other: "Other",
};

function formatPrice(price) {
  return Number(price || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

function getCourseIcon(category) {
  switch (category) {
    case "scholarship":
      return Trophy;
    case "school-entrance":
      return GraduationCap;
    case "olympiad":
      return Sparkles;
    case "foundation":
      return BookOpen;
    default:
      return BookMarked;
  }
}

function getCourseArray(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.courses)) return response.courses;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.courses)) {
    return response.data.courses;
  }
  return [];
}

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [classFilter, setClassFilter] = useState("all");

  async function loadCourses() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getCourses();

      setCourses(getCourseArray(response));
    } catch (err) {
      setError(
        err.message || "Courses load nahi ho paye. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
  }, []);

  const filteredCourses = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesCategory =
        category === "all" || course.category === category;

      const targetClasses = (course.targetClasses || []).map(Number);

      const matchesClass =
        classFilter === "all" ||
        targetClasses.includes(Number(classFilter));

      const matchesSearch =
        !searchText ||
        (course.title || "").toLowerCase().includes(searchText) ||
        (course.examCode || "").toLowerCase().includes(searchText) ||
        (course.shortDescription || "").toLowerCase().includes(searchText);

      return matchesCategory && matchesClass && matchesSearch;
    });
  }, [courses, search, category, classFilter]);

  const stats = useMemo(() => {
    return {
      total: courses.length,
      scholarship: courses.filter(
        (course) => course.category === "scholarship"
      ).length,
      free: courses.filter(
        (course) => Number(course.price || 0) === 0
      ).length,
    };
  }, [courses]);

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">

      {/* HERO */}
      <section className="bg-[#172554] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-7 lg:px-10">

          <Link
            to="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-200 hover:text-white"
          >
            <ArrowRight className="rotate-180" size={17} />
            Back to Dashboard
          </Link>

          <div className="flex flex-col justify-between gap-7 md:flex-row md:items-center">

            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-indigo-100">
                <Sparkles size={14} />
                COMPETITIVE EXAM PREPARATION
              </div>

              <h1 className="mt-5 text-3xl font-black sm:text-4xl">
                Competitive Courses
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-7 text-indigo-100">
                Scholarship exams, entrance exams aur Olympiad ki
                preparation ab ek hi jagah. Learn in Hindi and English.
              </p>
            </div>

            <div className="hidden h-32 w-32 items-center justify-center rounded-3xl border border-white/15 bg-white/10 md:flex">
              <GraduationCap size={76} strokeWidth={1.3} />
            </div>

          </div>

        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 lg:px-10">

        {/* STATS */}
        <section className="grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-50 p-3 text-indigo-700">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Available Courses
                </p>
                <h3 className="text-2xl font-black">{stats.total}</h3>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                <Trophy size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Scholarship Courses
                </p>
                <h3 className="text-2xl font-black">
                  {stats.scholarship}
                </h3>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500">
                  Free Courses
                </p>
                <h3 className="text-2xl font-black">{stats.free}</h3>
              </div>
            </div>
          </div>

        </section>

        {/* SEARCH AND FILTERS */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">

          <div className="flex flex-col gap-4 lg:flex-row">

            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search course, exam name..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-10 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />

              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                  aria-label="Clear search"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter size={18} className="shrink-0 text-slate-400" />

              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-indigo-500 sm:w-40"
              >
                <option value="all">All Classes</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Class {num}
                  </option>
                ))}
              </select>
            </div>

          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item.value}
                onClick={() => setCategory(item.value)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  category === item.value
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

        </section>

        {/* COURSE LIST */}
        <section className="mt-9">

          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black tracking-widest text-indigo-600">
                EXPLORE AND LEARN
              </p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                Available Courses
              </h2>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              {filteredCourses.length} course(s) found
            </p>
          </div>

          {/* LOADING */}
          {loading && (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
              <div className="text-center">
                <LoaderCircle
                  className="mx-auto animate-spin text-indigo-600"
                  size={38}
                />
                <p className="mt-3 text-sm font-semibold text-slate-500">
                  Loading courses...
                </p>
              </div>
            </div>
          )}

          {/* ERROR */}
          {!loading && error && (
            <div className="rounded-2xl border border-red-200 bg-white p-8 text-center">
              <p className="font-bold text-red-600">{error}</p>

              <button
                onClick={loadCourses}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
            </div>
          )}

          {/* EMPTY */}
          {!loading && !error && filteredCourses.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <BookOpen size={32} />
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-900">
                No Courses Found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Abhi is filter mein koi course available nahi hai.
                Search ya category filter change karke dekhein.
              </p>

              <button
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setClassFilter("all");
                }}
                className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
              >
                Clear Filters
              </button>

            </div>
          )}

          {/* COURSE CARDS */}
          {!loading && !error && filteredCourses.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {filteredCourses.map((course) => {
                const Icon = getCourseIcon(course.category);
                const price = Number(course.price || 0);
                const comparePrice = Number(course.compareAtPrice || 0);

                return (
                  <article
                    key={course._id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50"
                  >

                    {/* THUMBNAIL */}
                    <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-700 via-blue-700 to-slate-900">

                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.title}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <Icon
                          size={76}
                          strokeWidth={1.2}
                          className="text-white/80 transition duration-300 group-hover:scale-110"
                        />
                      )}

                      <div className="absolute left-4 top-4">
                        <span className="rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[10px] font-extrabold text-white backdrop-blur">
                          {categoryLabels[course.category] || "Competitive Exam"}
                        </span>
                      </div>

                      {course.featured && (
                        <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-amber-400 px-3 py-1.5 text-[10px] font-black text-amber-950">
                          <Sparkles size={12} />
                          FEATURED
                        </div>
                      )}

                    </div>

                    {/* COURSE INFO */}
                    <div className="p-5">

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                            {course.examCode || "EXAM PREPARATION"}
                          </p>

                          <h3 className="mt-2 text-lg font-black leading-snug text-slate-900">
                            {course.title}
                          </h3>
                        </div>

                        <div className="shrink-0 rounded-xl bg-indigo-50 p-2.5 text-indigo-700">
                          <Icon size={21} />
                        </div>

                      </div>

                      <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
                        {course.shortDescription ||
                          "Complete exam preparation course with structured lessons."}
                      </p>

                      {/* CLASSES */}
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(course.targetClasses || []).map((num) => (
                          <span
                            key={num}
                            className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"
                          >
                            Class {num}
                          </span>
                        ))}
                      </div>

                      {/* LANGUAGES AND DURATION */}
                      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500">

                        <span className="flex items-center gap-1.5">
                          <Languages size={15} className="text-indigo-600" />
                          {(course.supportedLanguages || []).join(" / ") || "Hindi"}
                        </span>

                        {course.durationDays > 0 && (
                          <span className="flex items-center gap-1.5">
                            <Clock size={15} className="text-indigo-600" />
                            {course.durationDays} Days
                          </span>
                        )}

                      </div>

                      {/* PRICE */}
                      <div className="mt-5 flex items-center justify-between gap-3">

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-slate-900">
                              {price === 0 ? "FREE" : `₹${formatPrice(price)}`}
                            </span>

                            {comparePrice > price && (
                              <span className="text-xs font-semibold text-slate-400 line-through">
                                ₹{formatPrice(comparePrice)}
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-[10px] font-semibold text-slate-400">
                            {price === 0 ? "Free access" : "One-time course fee"}
                          </p>
                        </div>

                        <Link
                          to={`/student/courses/${encodeURIComponent(course.slug)}`}
                          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-indigo-700"
                        >
                          View Course
                          <ArrowRight size={15} />
                        </Link>

                      </div>

                    </div>

                  </article>
                );
              })}

            </div>
          )}

        </section>

        {/* FOOTER INFO */}
        <section className="mt-10 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={23}
              className="mt-0.5 shrink-0 text-indigo-700"
            />

            <div>
              <h3 className="font-black text-slate-900">
                Learn at Your Own Pace
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Demo lessons free mein explore karein. Full course access
                ke liye enrollment karein. Available course languages aur
                access details course page par check kar sakte hain.
              </p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
