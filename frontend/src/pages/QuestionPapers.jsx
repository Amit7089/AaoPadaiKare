
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Eye,
  Lock,
  Crown,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle2,
  BookOpen,
  SlidersHorizontal,
  ArrowUpRight,
  CalendarDays,
} from "lucide-react";
import { api } from "../services/api";

const CLASSES = [6, 7, 8, 9, 10, 11, 12];

const YEARS = Array.from(
  { length: 7 },
  (_, i) => new Date().getFullYear() - i
);

const TYPES = [
  { value: "", label: "All Papers" },
  { value: "question-paper", label: "Unsolved" },
  { value: "solved-paper", label: "Solved" },
];

const selectStyle =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function QuestionPapers() {
  const navigate = useNavigate();

  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [classNo, setClassNo] = useState("");
  const [subject, setSubject] = useState("");
  const [year, setYear] = useState("");
  const [paperType, setPaperType] = useState("");
  const [accessType, setAccessType] = useState("");
  const [previewLoading, setPreviewLoading] = useState("");
  const [notification, setNotification] = useState("");

  const loadPapers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.getQuestionPapers();

      if (!response?.success) {
        throw new Error(
          response?.message || "Question papers load nahi ho paye."
        );
      }

      setPapers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || "Papers load nahi ho paye.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  const subjects = useMemo(
    () =>
      [...new Set(papers.map((p) => p.subject).filter(Boolean))].sort(),
    [papers]
  );

  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      const query = search.trim().toLowerCase();

      const matchesSearch =
        !query ||
        paper.title?.toLowerCase().includes(query) ||
        paper.subject?.toLowerCase().includes(query) ||
        String(paper.year).includes(query);

      return (
        matchesSearch &&
        (!classNo || String(paper.classNo) === classNo) &&
        (!subject || paper.subject === subject) &&
        (!year || String(paper.year) === year) &&
        (!paperType || paper.paperType === paperType) &&
        (!accessType || paper.accessType === accessType)
      );
    });
  }, [papers, search, classNo, subject, year, paperType, accessType]);

  const stats = useMemo(
    () => ({
      total: papers.length,
      free: papers.filter((p) => p.accessType === "free").length,
      premium: papers.filter((p) => p.accessType === "premium").length,
    }),
    [papers]
  );

  const hasFilters =
    search || classNo || subject || year || paperType || accessType;

  const clearFilters = () => {
    setSearch("");
    setClassNo("");
    setSubject("");
    setYear("");
    setPaperType("");
    setAccessType("");
  };

  const showNotification = (message) => {
    setNotification(message);
    window.setTimeout(() => setNotification(""), 3500);
  };

  const handleLockedPaper = (response) => {
    if (response?.requiresLogin) {
      navigate("/login");
      return;
    }

    if (response?.requiresPremium || response?.locked) {
      navigate("/membership");
      return;
    }

    showNotification(response?.message || "Paper locked hai.");
  };

  const openPaper = async (paper) => {
    const previewWindow = window.open("about:blank", "_blank");

    if (!previewWindow) {
      showNotification("PDF open karne ke liye popup allow karein.");
      return;
    }

    try {
      setPreviewLoading(paper._id);

      previewWindow.document.write(
        "<p style='font-family:Arial;padding:24px'>PDF loading...</p>"
      );

      const response = await api.getQuestionPaper(paper._id);

      if (!response?.success || !response?.data?.pdfUrl) {
        previewWindow.close();

        if (response?.locked) {
          handleLockedPaper(response);
          return;
        }

        throw new Error(response?.message || "PDF available nahi hai.");
      }

      previewWindow.location.href = response.data.pdfUrl;
    } catch (err) {
      if (!previewWindow.closed) previewWindow.close();

      if (err?.status === 403 || err?.response?.status === 403) {
        showNotification("Premium membership required hai.");
      } else {
        showNotification(err.message || "PDF open nahi ho payi.");
      }
    } finally {
      setPreviewLoading("");
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fc] pb-12">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* PAGE HEADER */}
        <section className="mb-6 overflow-hidden rounded-2xl bg-[#172554] px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-wide text-indigo-100">
                <BookOpen size={14} />
                MP BOARD STUDY LIBRARY
              </div>

              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
                Question Papers
              </h1>

              <p className="mt-2 max-w-lg text-sm text-indigo-100">
                Previous year papers, solved papers aur exam practice —
                sab ek jagah.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:min-w-[290px]">
              {[
                { label: "Total", value: stats.total, icon: FileText },
                { label: "Free", value: stats.free, icon: CheckCircle2 },
                { label: "Premium", value: stats.premium, icon: Crown },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-xl border border-white/10 bg-white/10 px-3 py-3 text-center"
                  >
                    <Icon size={17} className="mx-auto text-indigo-200" />
                    <p className="mt-1 text-xl font-black">{item.value}</p>
                    <p className="text-[10px] font-semibold text-indigo-100">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SEARCH AND FILTER TOOLBAR */}
        <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subject, paper or year..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <button
              onClick={loadPapers}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            <select
              value={classNo}
              onChange={(e) => setClassNo(e.target.value)}
              className={selectStyle}
            >
              <option value="">All Classes</option>
              {CLASSES.map((c) => (
                <option key={c} value={c}>Class {c}</option>
              ))}
            </select>

            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={selectStyle}
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={selectStyle}
            >
              <option value="">All Years</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              value={paperType}
              onChange={(e) => setPaperType(e.target.value)}
              className={selectStyle}
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              value={accessType}
              onChange={(e) => setAccessType(e.target.value)}
              className={selectStyle}
            >
              <option value="">Free + Premium</option>
              <option value="free">Free Only</option>
              <option value="premium">Premium Only</option>
            </select>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <p className="text-xs text-slate-500">
              <span className="font-extrabold text-slate-800">
                {filteredPapers.length}
              </span>{" "}
              papers found
            </p>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-700"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* LIST HEADER */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 sm:px-5">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Available Papers
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Browse and open your study material
              </p>
            </div>

            <span className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
              Class 6–12
            </span>
          </div>

          {error && (
            <div className="m-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={18} className="shrink-0" />
              <div className="flex-1">{error}</div>
              <button onClick={loadPapers} className="font-bold underline">
                Retry
              </button>
            </div>
          )}

          {/* DESKTOP TABLE HEADER */}
          <div className="hidden grid-cols-[minmax(180px,1.6fr)_0.8fr_0.6fr_0.8fr_0.7fr_auto] gap-3 bg-slate-50 px-5 py-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 md:grid">
            <span>Paper / Subject</span>
            <span>Class</span>
            <span>Year</span>
            <span>Paper Type</span>
            <span>Access</span>
            <span className="text-right">Action</span>
          </div>

          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : filteredPapers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {filteredPapers.map((paper) => {
                const locked = Boolean(paper.isLocked);
                const premium = paper.accessType === "premium";
                const solved = paper.paperType === "solved-paper";

                return (
                  <div
                    key={paper._id}
                    className="grid grid-cols-1 gap-3 px-4 py-3 transition hover:bg-slate-50/80 md:grid-cols-[minmax(180px,1.6fr)_0.8fr_0.6fr_0.8fr_0.7fr_auto] md:items-center md:gap-3 md:px-5"
                  >
                    {/* PAPER */}
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        locked
                          ? "bg-amber-50 text-amber-600"
                          : "bg-indigo-50 text-indigo-600"
                      }`}>
                        {locked ? <Lock size={19} /> : <FileText size={20} />}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-800">
                          {paper.title}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          {paper.subject}
                        </p>
                        {paper.description && (
                          <p className="mt-1 line-clamp-1 text-[11px] text-slate-400 md:hidden">
                            {paper.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* MOBILE DETAILS */}
                    <div className="flex flex-wrap items-center gap-2 md:hidden">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                        Class {paper.classNo}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                        <CalendarDays size={11} className="mr-1 inline" />
                        {paper.year}
                      </span>
                      <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                        solved
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-orange-50 text-orange-700"
                      }`}>
                        {solved ? "Solved" : "Unsolved"}
                      </span>
                      <span className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                        premium
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {premium ? "Premium" : "Free"}
                      </span>
                    </div>

                    {/* DESKTOP DETAILS */}
                    <span className="hidden text-xs font-semibold text-slate-600 md:block">
                      Class {paper.classNo}
                    </span>

                    <span className="hidden text-xs font-semibold text-slate-600 md:block">
                      {paper.year}
                    </span>

                    <span className="hidden md:block">
                      <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold ${
                        solved
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-orange-50 text-orange-700"
                      }`}>
                        {solved ? "Solved" : "Unsolved"}
                      </span>
                    </span>

                    <span className="hidden md:block">
                      <span className={`inline-block rounded-md px-2 py-1 text-[10px] font-bold ${
                        premium
                          ? "bg-amber-50 text-amber-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}>
                        {premium ? "Premium" : "Free"}
                      </span>
                    </span>

                    {/* ACTION */}
                    <div className="flex justify-end">
                      {locked ? (
                        <button
                          onClick={() => navigate("/membership")}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-amber-600 md:w-auto"
                        >
                          <Lock size={13} />
                          Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => openPaper(paper)}
                          disabled={previewLoading === paper._id}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#172554] px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 md:w-auto"
                        >
                          {previewLoading === paper._id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <Eye size={13} />
                          )}
                          {previewLoading === paper._id ? "Opening" : "Preview"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-14 text-center">
              <FileText size={32} className="mx-auto text-slate-300" />
              <h3 className="mt-3 text-base font-extrabold text-slate-800">
                No Papers Found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Try changing your search or filters.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
              >
                Clear Filters
              </button>
            </div>
          )}

          <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
            <p className="text-center text-[11px] text-slate-400">
              Aao Padai Kare · MP Board Learning Resources
            </p>
          </div>
        </section>

        {/* PREMIUM STRIP */}
        <section className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Crown size={20} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                Need access to Premium Papers?
              </h3>
              <p className="mt-0.5 text-xs text-slate-600">
                Unlock resources with your class membership.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate("/membership")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#172554] px-4 py-2.5 text-xs font-bold text-white hover:bg-indigo-700"
          >
            View Plans
            <ArrowUpRight size={14} />
          </button>
        </section>
      </main>

      {/* NOTIFICATION */}
      {notification && (
        <div className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-32px)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl">
          <AlertCircle size={18} className="shrink-0 text-amber-400" />
          <span>{notification}</span>
          <button
            onClick={() => setNotification("")}
            aria-label="Close notification"
            className="ml-auto"
          >
            <X size={17} />
          </button>
        </div>
      )}
    </div>
  );
}
