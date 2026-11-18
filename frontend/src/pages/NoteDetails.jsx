
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  FileText,
  GraduationCap,
  LockKeyhole,
  LoaderCircle,
  Play,
  Printer,
  ShieldCheck,
  Sparkles,
  Video,
  BookMarked,
} from "lucide-react";

import { api } from "../services/api";

const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsedUrl.pathname.split("/")[1];
    } else if (
      ["youtube.com", "m.youtube.com"].includes(host)
    ) {
      if (parsedUrl.pathname === "/watch") {
        videoId = parsedUrl.searchParams.get("v");
      } else {
        const parts = parsedUrl.pathname.split("/").filter(Boolean);

        if (["embed", "shorts", "live"].includes(parts[0])) {
          videoId = parts[1];
        }
      }
    }

    if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return "";
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}`;
  } catch {
    return "";
  }
};


const getPdfUrl = (url) => {
  if (!url || typeof url !== "string") return "";

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "https:") {
      return "";
    }

    return parsedUrl.href;
  } catch {
    return "";
  }
};


const getList = (result) => {
  const data = result?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.notes)) return data.notes;
  if (Array.isArray(data?.syllabus)) return data.syllabus;
  if (Array.isArray(data?.data)) return data.data;

  return [];
};

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <Icon size={22} />
      </div>

      <div>
        <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default function NoteDetails() {
  const { id } = useParams();

  const [note, setNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const [chapters, setChapters] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [requiresLogin, setRequiresLogin] = useState(false);
  const [requiresPremium, setRequiresPremium] = useState(false);
  const [lockedClassNo, setLockedClassNo] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadNote() {
      setLoading(true);
      setError("");
      setNote(null);
      setNotes([]);
      setChapters([]);
      setRequiresLogin(false);
      setRequiresPremium(false);
      setLockedClassNo(null);

      try {
        // Fetch the requested note directly from the backend.
        const noteResult = await api.getNote(id);

        if (!isMounted) return;

        const foundNote = noteResult?.data;

        if (!foundNote) {
          setError("यह Study Note उपलब्ध नहीं है।");
          return;
        }

        setNote(foundNote);

        // Related notes and syllabus are only for navigation.
        // Their failure should not hide an already loaded note.
        const [noteListResult, chapterResult] = await Promise.allSettled([
          api.getNotes({
            classNo: foundNote.classNo,
            subject: foundNote.subject,
          }),
          api.getSyllabus(foundNote.classNo),
        ]);

        if (!isMounted) return;

        if (noteListResult.status === "fulfilled") {
          setNotes(getList(noteListResult.value));
        }

        if (chapterResult.status === "fulfilled") {
          setChapters(getList(chapterResult.value));
        }
      } catch (err) {
        if (!isMounted) return;

        console.error("Load note error:", err);

        if (err.status === 403 && err.data?.locked) {
          setLockedClassNo(err.data.classNo);

          if (err.data.requiresLogin) {
            setRequiresLogin(true);
            setError("इस Lecture को देखने के लिए पहले Login करें।");
          } else {
            setRequiresPremium(true);
            setError(
              `Class ${err.data.classNo} की Premium Membership आवश्यक है।`
            );
          }
        } else if (err.status === 404) {
          setError("यह Study Note नहीं मिला।");
        } else {
          setError(err.message || "Note load नहीं हो पाया।");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadNote();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const relatedNotes = useMemo(() => {
    if (!note) return [];

    const chapterOrder = chapters
      .filter(
        (item) =>
          String(item.classNo) === String(note.classNo) &&
          item.subject === note.subject
      )
      .map((item) => item.chapter);

    return [...notes]
      .filter(
        (item) =>
          String(item.classNo) === String(note.classNo) &&
          item.subject === note.subject
      )
      .sort((a, b) => {
        const aIndex = chapterOrder.indexOf(a.chapter);
        const bIndex = chapterOrder.indexOf(b.chapter);

        const safeA = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
        const safeB = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;

        if (safeA !== safeB) return safeA - safeB;

        return (
          new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
        );
      });
  }, [note, notes, chapters]);

  const currentIndex = relatedNotes.findIndex(
    (item) => String(item._id) === String(id)
  );

  const previousNote =
    currentIndex > 0 ? relatedNotes[currentIndex - 1] : null;

  const nextNote =
    currentIndex >= 0 && currentIndex < relatedNotes.length - 1
      ? relatedNotes[currentIndex + 1]
      : null;

  const videoEmbedUrl = getYouTubeEmbedUrl(note?.youtubeUrl);
  const pdfUrl = getPdfUrl(note?.pdfUrl);

  // Loading screen
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100">
            <LoaderCircle
              className="animate-spin text-indigo-600"
              size={30}
            />
          </div>
          <h2 className="mt-5 text-lg font-bold text-slate-800">
            Preparing your lesson
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Please wait while we load your study material...
          </p>
        </div>
      </main>
    );
  }

  // Locked note / error screen
  if (error || !note) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-indigo-800 px-7 py-10 text-center text-white">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-white/20 bg-white/10">
              {requiresPremium ? (
                <LockKeyhole size={36} />
              ) : requiresLogin ? (
                <ShieldCheck size={36} />
              ) : (
                <BookOpen size={36} />
              )}
            </div>

            <h1 className="mt-5 text-2xl font-extrabold">
              {requiresPremium
                ? "Premium Lecture Locked"
                : requiresLogin
                  ? "Login Required"
                  : "Lesson Unavailable"}
            </h1>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-indigo-100">
              {error || "यह Study Note उपलब्ध नहीं है।"}
            </p>
          </div>

          <div className="p-6 text-center sm:p-8">
            {requiresPremium && (
              <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <Sparkles size={18} />
                  Class {lockedClassNo} Premium
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  इस lecture को देखने के लिए इसी class की active
                  membership आवश्यक है। दूसरी class की membership
                  से यह lecture unlock नहीं होगा।
                </p>
              </div>
            )}

            {requiresLogin && (
              <div className="mb-6 rounded-2xl bg-indigo-50 p-4 text-left">
                <p className="font-bold text-indigo-900">
                  Continue your learning journey
                </p>
                <p className="mt-1 text-sm text-indigo-700">
                  Login करके अपने free lectures और membership
                  access का लाभ उठाएं।
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {requiresLogin && (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  Login to Continue
                  <ArrowRight size={17} />
                </Link>
              )}

              {requiresPremium && (
                <Link
                  to="/membership"
                  state={{ classNo: lockedClassNo }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-indigo-700"
                >
                  <Sparkles size={17} />
                  Get Class {lockedClassNo} Membership
                </Link>
              )}

              <Link
                to="/notes"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={17} />
                Back to Study Notes
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const isPremium = Boolean(note.isPremium);
  const isFree = !isPremium;

  return (
    <main className="min-h-screen bg-[#f5f7fc] pb-12">
      {/* Top navigation */}
      <div className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/notes"
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-indigo-600"
          >
            <ArrowLeft size={18} />
            <span>Study Notes</span>
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            <Printer size={16} />
            <span className="hidden sm:inline">Print Notes</span>
            <span className="sm:hidden">Print</span>
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-9">
        {/* Lesson header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-blue-800 text-white shadow-xl">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />

          <div className="relative p-6 sm:p-10">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                <GraduationCap size={14} />
                Class {note.classNo}
              </span>

              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold text-white">
                {note.subject}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                  isFree
                    ? "bg-emerald-400/15 text-emerald-200"
                    : "bg-amber-400/15 text-amber-200"
                }`}
              >
                {isFree ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Sparkles size={13} />
                )}
                {isFree ? "Free Lecture" : "Premium Lecture"}
              </span>
            </div>

            <div className="max-w-3xl">
              <p className="mb-3 text-sm font-semibold text-blue-200">
                MP BOARD STUDY MATERIAL
              </p>

              <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-4xl">
                {note.title}
              </h1>

              <p className="mt-4 flex items-center gap-2 text-sm text-indigo-100 sm:text-base">
                <BookMarked size={17} />
                Chapter: {note.chapter}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-5 border-t border-white/15 pt-5 text-xs font-medium text-indigo-100 sm:text-sm">
              <span className="inline-flex items-center gap-2">
                <BookOpen size={16} />
                Study Material
              </span>
              {note.youtubeUrl && (
                <span className="inline-flex items-center gap-2">
                  <Video size={16} />
                  Video Lecture
                </span>
              )}
              {note.pdfUrl && (
                <span className="inline-flex items-center gap-2">
                  <FileText size={16} />
                  Handwritten PDF
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Main learning content */}
        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_290px]">
          <div className="min-w-0 space-y-7">
            {/* Video lecture */}
            {note.youtubeUrl && (
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="p-5 sm:p-7">
                  <SectionTitle
                    icon={Video}
                    title="Video Lecture"
                    subtitle="Watch and understand this chapter"
                  />

                  {videoEmbedUrl ? (
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-md">
                      <div className="aspect-video w-full">
                        <iframe
                          src={videoEmbedUrl}
                          title={`${note.title} - Video Lecture`}
                          className="h-full w-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          referrerPolicy="strict-origin-when-cross-origin"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-red-100 bg-red-50 p-5">
                      <p className="text-sm font-semibold text-red-800">
                        Video embed नहीं हो पाया। आप इसे YouTube पर देख सकते हैं।
                      </p>
                      <a
                        href={note.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
                      >
                        <Play size={16} />
                        Watch on YouTube
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  )}

                  {videoEmbedUrl && (
                    <a
                      href={note.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-slate-500 transition hover:text-indigo-600"
                    >
                      Open video on YouTube
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* Study material */}
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-7">
                <SectionTitle
                  icon={GraduationCap}
                  title="Study Material"
                  subtitle="Read your chapter notes carefully"
                />

                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="rounded-lg bg-slate-100 px-3 py-2">
                    Class {note.classNo}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-3 py-2">
                    {note.subject}
                  </span>
                  <span className="rounded-lg bg-slate-100 px-3 py-2">
                    {note.chapter}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-8">
                {note.content ? (
                  <article className="whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-700 sm:text-base sm:leading-9">
                    {note.content}
                  </article>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                    <BookOpen
                      size={32}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      इस Lecture का Text Content उपलब्ध नहीं है।
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      उपलब्ध Video या Handwritten Notes का उपयोग करें।
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* Handwritten PDF */}
            {pdfUrl && (
              <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm print:hidden">
                <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <FileText size={29} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900">
                        Handwritten Notes
                      </h3>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {note.pdfName || "Chapter Study PDF"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-emerald-600">
                        PDF Study Material
                      </p>
                    </div>
                  </div>

                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700"
                  >
                    <Download size={17} />
                    View Handwritten Notes
                    <ExternalLink size={14} />
                  </a>
                </div>
              </section>
            )}

            {/* Previous and next navigation */}
            <section className="grid gap-4 sm:grid-cols-2 print:hidden">
              {previousNote ? (
                <Link
                  to={`/notes/${previousNote._id}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <ArrowLeft size={15} />
                    PREVIOUS LECTURE
                  </span>
                  <p className="mt-3 font-bold text-slate-800 transition group-hover:text-indigo-600">
                    {previousNote.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {previousNote.chapter}
                  </p>
                </Link>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-400">
                  यह पहला Lecture है।
                </div>
              )}

              {nextNote ? (
                <Link
                  to={`/notes/${nextNote._id}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md"
                >
                  <span className="flex items-center justify-end gap-2 text-xs font-bold text-slate-400">
                    NEXT LECTURE
                    <ArrowRight size={15} />
                  </span>
                  <p className="mt-3 text-right font-bold text-slate-800 transition group-hover:text-indigo-600">
                    {nextNote.title}
                  </p>
                  <p className="mt-1 text-right text-xs text-slate-400">
                    {nextNote.chapter}
                  </p>
                </Link>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-right text-sm text-slate-400">
                  यह आखिरी Lecture है।
                </div>
              )}
            </section>
          </div>

          {/* Learning sidebar */}
          <aside className="space-y-5 print:hidden">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <GraduationCap size={23} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900">
                    Your Learning
                  </h3>
                  <p className="text-xs text-slate-500">
                    Current lecture
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    CLASS
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    Class {note.classNo}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    SUBJECT
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {note.subject}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    CHAPTER
                  </p>
                  <p className="mt-1 font-bold text-slate-800">
                    {note.chapter}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    ACCESS TYPE
                  </p>
                  <p
                    className={`mt-1 inline-flex items-center gap-1.5 text-sm font-bold ${
                      isFree ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {isFree ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Sparkles size={16} />
                    )}
                    {isFree ? "Free Access" : "Premium Access"}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Clock3 size={16} className="text-indigo-600" />
                  Study Tip
                </div>
                <p className="mt-2 text-xs leading-6 text-slate-500">
                  पहले पूरा chapter पढ़ें, फिर video lecture देखें
                  और अंत में handwritten notes से revision करें।
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 to-blue-800 p-5 text-white shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                <Sparkles size={22} />
              </div>

              <h3 className="mt-4 text-lg font-extrabold">
                Keep Learning!
              </h3>

              <p className="mt-2 text-xs leading-6 text-indigo-100">
                रोज थोड़ा पढ़ें, नियमित revision करें और अपनी
                तैयारी को मजबूत बनाएं।
              </p>

              <Link
                to="/notes"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
              >
                Explore More Notes
                <ArrowRight size={16} />
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }

          main {
            background: white !important;
            padding: 0 !important;
          }

          aside,
          iframe,
          .print\\:hidden {
            display: none !important;
          }

          section {
            box-shadow: none !important;
            break-inside: avoid;
          }

          article {
            color: black !important;
          }
        }
      `}</style>
    </main>
  );
}
