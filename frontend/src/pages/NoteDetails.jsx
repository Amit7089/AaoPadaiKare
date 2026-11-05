
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  ExternalLink,
  FileText,
  GraduationCap,
  LoaderCircle,
  Play,
  Printer,
  Video,
  Maximize2,
} from "lucide-react";

const BACKEND_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const getPdfUrl = (url) => {
  if (!url) return "";

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${BACKEND_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const getYouTubeEmbedUrl = (url) => {
  if (!url) return "";

  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace(/^www\./, "");
    let videoId = "";

    if (host === "youtu.be") {
      videoId = parsedUrl.pathname.split("/")[1];
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com"
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

export default function NoteDetails() {
  const { id } = useParams();

  const [notes, setNotes] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNote() {
      setLoading(true);
      setError("");
      setNote(null);

      try {
        const [noteResult, chapterResult] = await Promise.all([
          api.getNotes(),
          api.getSyllabus(),
        ]);

        const noteData = noteResult.data;
        const chapterData = chapterResult.data;

        const allNotes = Array.isArray(noteData)
          ? noteData
          : Array.isArray(noteData?.notes)
            ? noteData.notes
            : Array.isArray(noteData?.data)
              ? noteData.data
              : [];

        const allChapters = Array.isArray(chapterData)
          ? chapterData
          : Array.isArray(chapterData?.syllabus)
            ? chapterData.syllabus
            : Array.isArray(chapterData?.data)
              ? chapterData.data
              : [];

        setNotes(allNotes);
        setChapters(allChapters);

        const foundNote = allNotes.find(
          (item) => String(item._id) === String(id)
        );

        if (!foundNote) {
          setNote(null);
          setError("यह Study Note नहीं मिला।");
        } else {
          setNote(foundNote);
        }
      } catch (err) {
        console.error("Load note error:", err);
        setError(err.message || "Note load नहीं हो पाया।");
      } finally {
        setLoading(false);
      }
    }

    loadNote();
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

    return notes
      .filter(
        (item) =>
          String(item.classNo) === String(note.classNo) &&
          item.subject === note.subject
      )
      .sort((a, b) => {
        const aIndex = chapterOrder.indexOf(a.chapter);
        const bIndex = chapterOrder.indexOf(b.chapter);

        const safeA =
          aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;

        const safeB =
          bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;

        if (safeA !== safeB) return safeA - safeB;

        return (
          new Date(a.createdAt || 0) -
          new Date(b.createdAt || 0)
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-indigo-600"
            size={38}
          />
          <p className="mt-3 text-sm text-slate-500">
            Loading study note...
          </p>
        </div>
      </main>
    );
  }

  if (error || !note) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <FileText
            className="mx-auto mb-4 text-slate-400"
            size={42}
          />

          <h1 className="text-xl font-bold text-slate-900">
            Note Not Found
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            {error || "यह Study Note उपलब्ध नहीं है।"}
          </p>

          <Link
            to="/notes"
            className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
          >
            Back to Study Notes
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">

        {/* Top Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link
            to="/notes"
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 transition hover:text-indigo-800"
          >
            <ArrowLeft size={18} />
            Back to Study Notes
          </Link>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
          >
            <Printer size={17} />
            Print Notes
          </button>
        </div>

        {/* Chapter Header */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-800 via-indigo-700 to-blue-600 p-6 text-white sm:p-9">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <BookOpen size={26} />
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                Class {note.classNo}
              </span>

              <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                {note.subject}
              </span>

              <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold">
                {note.isPremium ? "Premium" : "Free"}
              </span>
            </div>

            <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">
              {note.title}
            </h1>

            <p className="mt-3 text-sm text-indigo-100 sm:text-base">
              Chapter: {note.chapter}
            </p>
          </div>

          {/* YouTube Video */}
          {note.youtubeUrl && (
            <div className="border-b border-slate-100 bg-white p-4 sm:p-7 print:hidden">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                    <Video size={23} />
                  </div>

                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Video Lecture
                    </h2>
                    <p className="text-xs text-slate-500">
                      Watch this chapter video lesson
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                  <span className="inline-flex items-center gap-1">
                    <Play size={12} fill="currentColor" />
                    YouTube
                  </span>
                </span>
              </div>

              {videoEmbedUrl ? (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-lg">
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
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="text-sm font-semibold text-amber-800">
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
                    <ExternalLink size={15} />
                  </a>
                </div>
              )}

              {videoEmbedUrl && (
                <a
                  href={note.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-indigo-600"
                >
                  Open on YouTube
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
          )}

          {/* Study Material - Original Text Content Kept */}
          <div className="p-5 sm:p-9">
            <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
              <GraduationCap
                className="text-indigo-600"
                size={25}
              />

              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Study Material
                </h2>
                <p className="text-xs text-slate-500">
                  Read your chapter notes below
                </p>
              </div>
            </div>

            {/* Existing written notes remain unchanged */}
            {note.content ? (
              <div className="whitespace-pre-wrap break-words text-[15px] leading-8 text-slate-700 sm:text-base">
                {note.content}
              </div>
            ) : (
              <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                इस Note का Text Content उपलब्ध नहीं है।
              </p>
            )}

            {/* Only PDF preview changed to a button */}
            {pdfUrl && (
              <div className="mt-8 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-sm print:hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50 p-4 sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600">
                      <FileText size={25} />
                    </div>

                    <div>
                      <h3 className="font-extrabold text-slate-900">
                        Handwritten Notes
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {note.pdfName || "Chapter PDF"}
                      </p>
                    </div>
                  </div>

                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
                  >
                    <FileText size={17} />
                    View Handwritten Note
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Previous and Next Notes */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 print:hidden">
          {previousNote ? (
            <Link
              to={`/notes/${previousNote._id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-indigo-300 hover:shadow-md"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                <ArrowLeft size={15} />
                PREVIOUS NOTE
              </span>

              <p className="mt-2 font-bold text-slate-800">
                {previousNote.title}
              </p>
            </Link>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-400">
              यह पहला Note है।
            </div>
          )}

          {nextNote ? (
            <Link
              to={`/notes/${nextNote._id}`}
              className="rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-indigo-300 hover:shadow-md"
            >
              <span className="flex items-center gap-2 text-xs font-bold text-slate-400">
                NEXT NOTE
                <ArrowRight size={15} />
              </span>

              <p className="mt-2 font-bold text-slate-800">
                {nextNote.title}
              </p>
            </Link>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-sm text-slate-400 sm:text-right">
              यह आखिरी Note है।
            </div>
          )}
        </div>
      </div>

      {/* Print Styling */}
      <style>{`
        @media print {
          body {
            background: white !important;
          }

          main {
            background: white !important;
            padding: 0 !important;
          }

          section {
            box-shadow: none !important;
          }

          iframe {
            display: none !important;
          }
        }
      `}</style>
    </main>
  );
}
