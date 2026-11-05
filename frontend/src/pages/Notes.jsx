
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import {
  FileText,
  Download,
  Search,
  LoaderCircle,
  BookOpen,
  BookMarked,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  ChevronRight,
  FolderOpen,
  Layers3,
  X,
  Home,
  ExternalLink,
} from "lucide-react";

import { api } from "../services/api";

const BACKEND_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const CLASSES = [6, 7, 8, 9, 10, 11, 12];

// PDF URL helper
const getPdfUrl = (pdfUrl) => {
  if (!pdfUrl) return "";

  // Cloudinary ya kisi bhi external URL ko directly return karega
  if (/^https?:\/\//i.test(pdfUrl)) {
    return pdfUrl;
  }

  // Local backend URL ke liye
  return `${BACKEND_URL.replace(/\/$/, "")}/${pdfUrl.replace(/^\//, "")}`;
};

// Note count helper
const getNoteCount = (notes, classNo, subject, chapter) => {
  return notes.filter(
    (note) =>
      Number(note.classNo) === Number(classNo) &&
      note.subject === subject &&
      note.chapter === chapter
  ).length;
};

export default function Notes() {
  const [searchParams] = useSearchParams();

  const [chapters, setChapters] = useState([]);
  const [notes, setNotes] = useState([]);

  const [classNo, setClassNo] = useState(
    searchParams.get("class") || ""
  );

  const [subject, setSubject] = useState(
    searchParams.get("subject") || ""
  );

  const [chapter, setChapter] = useState(
    searchParams.get("chapter") || ""
  );

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sync filters from URL
  useEffect(() => {
    setClassNo(searchParams.get("class") || "");
    setSubject(searchParams.get("subject") || "");
    setChapter(searchParams.get("chapter") || "");
  }, [searchParams]);

  // Load syllabus and notes
  useEffect(() => {
    async function loadNotes() {
      try {
        setLoading(true);
        setError("");

        const [chapterResult, noteResult] = await Promise.all([
          api.getSyllabus(),
          api.getNotes(),
        ]);

        const syllabusData = Array.isArray(chapterResult.data)
          ? chapterResult.data
          : chapterResult.data?.syllabus || [];

        const notesData = Array.isArray(noteResult.data)
          ? noteResult.data
          : noteResult.data?.notes || [];

        setChapters(syllabusData);
        setNotes(notesData);
      } catch (err) {
        console.error("Notes loading error:", err);
        setError(err.message || "Notes load nahi ho paye.");
      } finally {
        setLoading(false);
      }
    }

    loadNotes();
  }, []);

  // Subjects for selected class
  const subjects = useMemo(() => {
    if (!classNo) return [];

    const syllabusSubjects = chapters
      .filter((item) => Number(item.classNo) === Number(classNo))
      .map((item) => item.subject);

    const noteSubjects = notes
      .filter((item) => Number(item.classNo) === Number(classNo))
      .map((item) => item.subject);

    return [...new Set([...syllabusSubjects, ...noteSubjects])]
      .filter(Boolean)
      .sort();
  }, [chapters, notes, classNo]);

  // Chapters for selected class and subject
  const availableChapters = useMemo(() => {
    if (!classNo || !subject) return [];

    const syllabusChapters = chapters
      .filter(
        (item) =>
          Number(item.classNo) === Number(classNo) &&
          item.subject === subject
      )
      .map((item) => item.chapter);

    const noteChapters = notes
      .filter(
        (item) =>
          Number(item.classNo) === Number(classNo) &&
          item.subject === subject
      )
      .map((item) => item.chapter);

    return [...new Set([...syllabusChapters, ...noteChapters])]
      .filter(Boolean)
      .sort((a, b) =>
        a.localeCompare(b, undefined, {
          numeric: true,
          sensitivity: "base",
        })
      );
  }, [chapters, notes, classNo, subject]);

  // Notes for selected chapter
  const selectedNotes = useMemo(() => {
    if (!classNo || !subject || !chapter) return [];

    return notes.filter(
      (note) =>
        Number(note.classNo) === Number(classNo) &&
        note.subject === subject &&
        note.chapter === chapter
    );
  }, [notes, classNo, subject, chapter]);

  // Global search
  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return [];

    return notes.filter((note) => {
      const searchableText = [
        note.title,
        note.subject,
        note.chapter,
        note.content,
        note.pdfName,
        `class ${note.classNo}`,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(term);
    });
  }, [notes, search]);

  // Class-wise note count
  const getClassCount = (number) => {
    return notes.filter(
      (note) => Number(note.classNo) === number
    ).length;
  };

  // Subject-wise note count
  const getSubjectCount = (item) => {
    return notes.filter(
      (note) =>
        Number(note.classNo) === Number(classNo) &&
        note.subject === item
    ).length;
  };

  // Reset all selections
  const resetFilters = () => {
    setClassNo("");
    setSubject("");
    setChapter("");
    setSearch("");
  };

  // Select class
  const selectClass = (number) => {
    setClassNo(String(number));
    setSubject("");
    setChapter("");
    setSearch("");
  };

  // Select subject
  const selectSubject = (item) => {
    setSubject(item);
    setChapter("");
    setSearch("");
  };

  // Select chapter
  const selectChapter = (item) => {
    setChapter(item);
    setSearch("");
  };

  // Go back one level
  const goBack = () => {
    if (chapter) {
      setChapter("");
    } else if (subject) {
      setSubject("");
    } else if (classNo) {
      setClassNo("");
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  // Current navigation level
  const currentLevel = chapter
    ? "notes"
    : subject
      ? "chapters"
      : classNo
        ? "subjects"
        : "classes";

  // Search result view
  const isSearching = search.trim().length > 0;

  // Note card
  const NoteCard = ({ note }) => {
    const pdfUrl = getPdfUrl(note.pdfUrl);

    return (
      <article
        key={note._id}
        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
      >
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
              <BookOpen size={25} />
            </div>

            {note.isPremium ? (
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                Premium
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                Free
              </span>
            )}
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              Class {note.classNo}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {note.subject}
            </span>
          </div>

          <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-extrabold leading-7 text-slate-900">
            {note.title}
          </h3>

          <p className="mt-2 text-sm font-medium text-indigo-600">
            {note.chapter}
          </p>

          <div className="mt-4 min-h-[6rem]">
            {note.content ? (
              <p className="line-clamp-4 whitespace-pre-line text-sm leading-6 text-slate-600">
                {note.content}
              </p>
            ) : (
              <p className="text-sm italic text-slate-400">
                PDF study material available.
              </p>
            )}
          </div>

          {note.pdfName && (
            <p className="mt-3 flex items-center gap-2 break-all text-xs text-slate-500">
              <FileText size={15} className="shrink-0" />
              {note.pdfName}
            </p>
          )}
        </div>

        <div className="mt-auto border-t border-slate-100 bg-slate-50/70 p-5">
          <div className="flex flex-col gap-3">
            <Link
              to={`/notes/${note._id}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
            >
              <BookMarked size={17} />
              Read Full Notes
              <ArrowRight size={16} />
            </Link>

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-600"
              >
                <Download size={17} />
                View / Download PDF
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
            <GraduationCap size={16} />
            AAO PADAI KARE
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Study Notes
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
            Class-wise, subject-wise aur chapter-wise study material
            ek hi jagah par.
          </p>
        </div>

        {/* Search */}
        <section className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Search size={21} />
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Search Study Notes
              </h2>
              <p className="text-xs text-slate-500">
                Search across all classes, subjects and chapters
              </p>
            </div>
          </div>

          <div className="relative">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              className={`${inputClass} pl-12 pr-12`}
              placeholder="Search notes, subject, chapter..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>
        </section>

        {/* Breadcrumb */}
        {!isSearching && (
          <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
            <button
              type="button"
              onClick={resetFilters}
              className={`flex items-center gap-1 font-semibold ${
                !classNo
                  ? "text-indigo-700"
                  : "text-slate-500 hover:text-indigo-600"
              }`}
            >
              <Home size={15} />
              Classes
            </button>

            {classNo && (
              <>
                <ChevronRight size={15} className="text-slate-400" />

                <button
                  type="button"
                  onClick={() => {
                    setSubject("");
                    setChapter("");
                  }}
                  className={`font-semibold ${
                    !subject
                      ? "text-indigo-700"
                      : "text-slate-500 hover:text-indigo-600"
                  }`}
                >
                  Class {classNo}
                </button>
              </>
            )}

            {subject && (
              <>
                <ChevronRight size={15} className="text-slate-400" />

                <button
                  type="button"
                  onClick={() => setChapter("")}
                  className={`font-semibold ${
                    !chapter
                      ? "text-indigo-700"
                      : "text-slate-500 hover:text-indigo-600"
                  }`}
                >
                  {subject}
                </button>
              </>
            )}

            {chapter && (
              <>
                <ChevronRight size={15} className="text-slate-400" />
                <span className="font-semibold text-indigo-700">
                  {chapter}
                </span>
              </>
            )}
          </div>
        )}

        {/* Search Results */}
        {isSearching ? (
          <section>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Search Results
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Results for "{search}"
                </p>
              </div>

              <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
                {searchResults.length} Notes Found
              </span>
            </div>

            {searchResults.length === 0 ? (
              <EmptyState message="Try another title, subject or chapter." />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {searchResults.map((note) => (
                  <NoteCard key={note._id} note={note} />
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Back Button */}
            {classNo && (
              <button
                type="button"
                onClick={goBack}
                className="mb-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
              >
                <ArrowLeft size={17} />
                Back
              </button>
            )}

            {/* Loading / Error / Content */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <LoaderCircle
                  className="animate-spin text-indigo-600"
                  size={38}
                />
                <p className="mt-3 text-sm text-slate-500">
                  Loading study material...
                </p>
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="ml-3 font-bold underline"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                {/* LEVEL 1: CLASSES */}
                {currentLevel === "classes" && (
                  <section>
                    <div className="mb-6">
                      <h2 className="text-2xl font-extrabold text-slate-900">
                        Select Your Class
                      </h2>
                      <p className="mt-2 text-sm text-slate-500">
                        Choose your class to explore study material.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {CLASSES.map((number) => (
                        <button
                          key={number}
                          type="button"
                          onClick={() => selectClass(number)}
                          className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg sm:p-6"
                        >
                          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                            <GraduationCap size={26} />
                          </div>

                          <h3 className="text-xl font-extrabold text-slate-900">
                            Class {number}
                          </h3>

                          <p className="mt-2 text-sm text-slate-500">
                            {getClassCount(number)} Study Notes
                          </p>

                          <div className="mt-5 flex items-center justify-between text-sm font-bold text-indigo-600">
                            Explore Class
                            <ArrowRight size={17} />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {/* LEVEL 2: SUBJECTS */}
                {currentLevel === "subjects" && (
                  <section>
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-indigo-600">
                        Class {classNo}
                      </p>

                      <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                        Select Subject
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        Choose a subject to view its chapters.
                      </p>
                    </div>

                    {subjects.length === 0 ? (
                      <EmptyState message="Is class ke liye abhi subjects available nahi hain." />
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {subjects.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => selectSubject(item)}
                            className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg"
                          >
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                              <BookOpen size={24} />
                            </div>

                            <div className="min-w-0 flex-1">
                              <h3 className="font-extrabold text-slate-900">
                                {item}
                              </h3>
                              <p className="mt-1 text-xs text-slate-500">
                                {getSubjectCount(item)} Notes Available
                              </p>
                            </div>

                            <ArrowRight
                              size={19}
                              className="text-slate-400 transition group-hover:text-indigo-600"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                )}

                {/* LEVEL 3: CHAPTERS */}
                {currentLevel === "chapters" && (
                  <section>
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-indigo-600">
                        Class {classNo} / {subject}
                      </p>

                      <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                        Select Chapter
                      </h2>

                      <p className="mt-2 text-sm text-slate-500">
                        Choose a chapter to view its study notes.
                      </p>
                    </div>

                    {availableChapters.length === 0 ? (
                      <EmptyState message="Is subject ke liye chapters available nahi hain." />
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {availableChapters.map((item, index) => {
                          const count = getNoteCount(
                            notes,
                            classNo,
                            subject,
                            item
                          );

                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => selectChapter(item)}
                              className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-lg"
                            >
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Layers3 size={23} />
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                                  Chapter {index + 1}
                                </p>

                                <h3 className="mt-1 font-extrabold text-slate-900">
                                  {item}
                                </h3>

                                <p className="mt-1 text-xs text-slate-500">
                                  {count} Notes Available
                                </p>
                              </div>

                              <ChevronRight
                                size={20}
                                className="text-slate-400 transition group-hover:text-indigo-600"
                              />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                )}

                {/* LEVEL 4: NOTES */}
                {currentLevel === "notes" && (
                  <section>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-indigo-600">
                          Class {classNo} / {subject}
                        </p>

                        <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                          {chapter}
                        </h2>

                        <p className="mt-2 text-sm text-slate-500">
                          Study material for this chapter.
                        </p>
                      </div>

                      <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700">
                        {selectedNotes.length} Notes
                      </span>
                    </div>

                    {selectedNotes.length === 0 ? (
                      <EmptyState message="Is chapter ke notes abhi upload nahi hue hain." />
                    ) : (
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedNotes.map((note) => (
                          <NoteCard key={note._id} note={note} />
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Aao Padai Kare. All rights reserved.
        </footer>
      </div>
    </main>
  );
}

// Empty state component
function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-16 text-center">
      <FolderOpen
        className="mx-auto mb-4 text-slate-400"
        size={45}
      />

      <h3 className="text-lg font-bold text-slate-800">
        No Content Available
      </h3>

      <p className="mt-2 text-sm text-slate-500">
        {message}
      </p>
    </div>
  );
}
