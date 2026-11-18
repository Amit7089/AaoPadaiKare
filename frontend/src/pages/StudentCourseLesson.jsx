
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  GraduationCap,
  Languages,
  LoaderCircle,
  PlayCircle,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { api } from "../services/api";

function getYouTubeEmbed(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    let videoId = "";

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.slice(1);
    } else if (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("youtube-nocookie.com")
    ) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v") || "";
      } else if (
        parsed.pathname.startsWith("/embed/") ||
        parsed.pathname.startsWith("/shorts/")
      ) {
        videoId = parsed.pathname.split("/")[2] || "";
      }
    }

    return /^[a-zA-Z0-9_-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : "";
  } catch {
    return "";
  }
}

export default function StudentCourseLesson() {
  const { slug, lessonId } = useParams();
  const [searchParams] = useSearchParams();

  const language = searchParams.get("language") || "Hindi";

  const [course, setCourse] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadLesson() {
      try {
        setLoading(true);
        setError("");

        const courseResponse = await api.getCourse(slug, language);

        if (!courseResponse?.success || !courseResponse?.course?._id) {
          throw new Error("Course details nahi mil payi.");
        }

        const courseData = courseResponse.course;

        const lessonResponse = await api.getCourseLesson(
          courseData._id,
          lessonId
        );

        if (!lessonResponse?.success || !lessonResponse?.lesson) {
          throw new Error(
            lessonResponse?.message || "Lesson load nahi ho paya."
          );
        }

        if (!cancelled) {
          setCourse(courseData);
          setLesson(lessonResponse.lesson);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err?.data?.message ||
              err.message ||
              "Lesson load nahi ho paya."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadLesson();

    return () => {
      cancelled = true;
    };
  }, [slug, lessonId, language]);

  const videoUrl = getYouTubeEmbed(lesson?.videoUrl);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoaderCircle
            size={42}
            className="mx-auto animate-spin text-indigo-600"
          />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Lesson prepare ho raha hai...
          </p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
          <AlertCircle size={42} className="mx-auto text-red-500" />

          <h2 className="mt-4 text-xl font-black text-slate-900">
            Lesson Open Nahi Hua
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error || "Lesson available nahi hai."}
          </p>

          <Link
            to={`/student/courses/${slug}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white"
          >
            <ArrowLeft size={17} />
            Back to Course
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fc] text-slate-800">
      {/* TOP NAVIGATION */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link
            to={`/student/courses/${slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            <ArrowLeft size={17} />
            <span className="hidden sm:inline">Back to Course</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <BookOpen size={19} className="shrink-0 text-indigo-600" />
            <span className="truncate text-sm font-black text-slate-800">
              Aao Padai Kare
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-9">
        {/* BREADCRUMB */}
        <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
          <Link to="/student/courses" className="hover:text-indigo-600">
            Courses
          </Link>
          <span>/</span>
          <Link
            to={`/student/courses/${slug}`}
            className="max-w-[180px] truncate hover:text-indigo-600"
          >
            {course?.title}
          </Link>
          <span>/</span>
          <span className="text-indigo-600">Lesson</span>
        </div>

        {/* LESSON HEADER */}
        <section className="overflow-hidden rounded-3xl bg-[#172554] text-white shadow-lg">
          <div className="relative p-6 sm:p-9">
            <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-indigo-400/20 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-black tracking-wider text-indigo-100">
                  COURSE LESSON
                </span>

                <span className="flex items-center gap-1 rounded-full bg-emerald-400/15 px-3 py-1.5 text-[11px] font-bold text-emerald-200">
                  <ShieldCheck size={13} />
                  ACCESS VERIFIED
                </span>
              </div>

              <h1 className="mt-5 max-w-3xl text-2xl font-black leading-tight sm:text-4xl">
                {lesson.title}
              </h1>

              {lesson.chapter && (
                <p className="mt-3 text-sm text-indigo-200">
                  {lesson.chapter}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-indigo-100">
                <span className="flex items-center gap-2">
                  <GraduationCap size={16} />
                  {course?.title}
                </span>

                <span className="flex items-center gap-2">
                  <Languages size={16} />
                  {language}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* VIDEO */}
        {videoUrl && (
          <section className="mt-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
              <PlayCircle size={20} className="text-indigo-600" />
              <h2 className="font-black text-slate-900">
                Video Lecture
              </h2>
            </div>

            <div className="bg-black">
              <iframe
                src={videoUrl}
                title={lesson.title}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </section>
        )}

        {/* LESSON NOTES */}
        {lesson.content && (
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
              <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                <BookOpen size={21} />
              </div>

              <div>
                <h2 className="font-black text-slate-900">
                  Lesson Notes
                </h2>
                <p className="text-xs text-slate-400">
                  Read and understand this lesson
                </p>
              </div>
            </div>

            <div className="whitespace-pre-wrap px-5 py-6 text-sm leading-8 text-slate-700 sm:px-7 sm:py-8 sm:text-base">
              {lesson.content}
            </div>
          </section>
        )}

        {/* PDF */}
        {lesson.pdfUrl && (
          <section className="mt-7 flex flex-col justify-between gap-4 rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-red-50 p-3 text-red-600">
                <FileText size={25} />
              </div>

              <div>
                <h2 className="font-black text-slate-900">
                  Lesson PDF
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Download or open your study material
                </p>
              </div>
            </div>

            <a
              href={lesson.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              <FileText size={17} />
              Open PDF
            </a>
          </section>
        )}

        {/* EMPTY CONTENT */}
        {!videoUrl && !lesson.content && !lesson.pdfUrl && (
          <div className="mt-7 rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <BookOpen size={40} className="mx-auto text-slate-300" />
            <h2 className="mt-3 font-black text-slate-800">
              Content Coming Soon
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Is lesson ka study material abhi upload nahi hua hai.
            </p>
          </div>
        )}

        {/* BOTTOM NAVIGATION */}
        <div className="mt-8 flex justify-start border-t border-slate-200 pt-6">
          <Link
            to={`/student/courses/${slug}`}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
          >
            <ArrowLeft size={17} />
            Back to Course Curriculum
          </Link>
        </div>
      </main>
    </div>
  );
}
