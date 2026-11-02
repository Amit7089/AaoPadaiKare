
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  Save,
  FileText,
  Upload,
  RefreshCw,
  LoaderCircle,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  X,
  Play,
  ExternalLink,
} from "lucide-react";

import { api, clearAdminToken } from "../../services/api";

const availableSubjects = [
  "Hindi",
  "English",
  "Mathematics",
  "Science",
  "Social Science",
  "Sanskrit",
];

const classes = [6, 7, 8, 9, 10, 11, 12];

const initialChapter = {
  classNo: "10",
  subject: "Mathematics",
  chapter: "",
};

const initialNote = {
  classNo: "10",
  subject: "",
  chapter: "",
  title: "",
  content: "",
  youtubeUrl: "",
  isPremium: false,
};

const getYouTubeVideoId = (url) => {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v") || "";
      }

      const parts = parsed.pathname.split("/").filter(Boolean);

      if (["embed", "shorts", "live"].includes(parts[0])) {
        return parts[1] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
};

const isValidYouTubeUrl = (url) => {
  if (!url.trim()) return true;
  return Boolean(getYouTubeVideoId(url.trim()));
};

export default function AdminNotes() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("notes");
  const [chapters, setChapters] = useState([]);
  const [notes, setNotes] = useState([]);

  const [chapterForm, setChapterForm] = useState(initialChapter);
  const [noteForm, setNoteForm] = useState(initialNote);

  const [pdf, setPdf] = useState(null);
  const [editingNote, setEditingNote] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterChapter, setFilterChapter] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const showMessage = (text) => {
    setMessage(text);
    setError("");
  };

  const showError = (text) => {
    setError(text);
    setMessage("");
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      clearAdminToken();
      navigate("/admin/login", { replace: true });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [chapterResult, noteResult] = await Promise.all([
        api.getSyllabus(),
        api.getNotes(),
      ]);

      setChapters(
        Array.isArray(chapterResult.data)
          ? chapterResult.data
          : chapterResult.data?.syllabus || []
      );

      setNotes(
        Array.isArray(noteResult.data)
          ? noteResult.data
          : noteResult.data?.notes || []
      );
    } catch (err) {
      showError(err.message || "Data load nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const noteSubjects = useMemo(() => {
    return [
      ...new Set(
        chapters
          .filter(
            (item) =>
              Number(item.classNo) === Number(noteForm.classNo)
          )
          .map((item) => item.subject)
          .filter(Boolean)
      ),
    ];
  }, [chapters, noteForm.classNo]);

  const classChapters = useMemo(() => {
    return chapters.filter(
      (item) =>
        Number(item.classNo) === Number(noteForm.classNo) &&
        item.subject === noteForm.subject
    );
  }, [chapters, noteForm.classNo, noteForm.subject]);

  useEffect(() => {
    if (!noteSubjects.includes(noteForm.subject)) {
      setNoteForm((previous) => ({
        ...previous,
        subject: noteSubjects[0] || "",
        chapter: "",
      }));
    }
  }, [noteSubjects, noteForm.subject]);

  const noteFilterSubjects = useMemo(
    () =>
      [...new Set(notes.map((note) => note.subject).filter(Boolean))].sort(),
    [notes]
  );

  const noteFilterChapters = useMemo(
    () =>
      [...new Set(notes.map((note) => note.chapter).filter(Boolean))].sort(),
    [notes]
  );

  const filteredNotes = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return notes.filter((note) => {
      const matchesClass =
        filterClass === "all" ||
        String(note.classNo) === filterClass;

      const matchesSubject =
        filterSubject === "all" ||
        note.subject === filterSubject;

      const matchesChapter =
        filterChapter === "all" ||
        note.chapter === filterChapter;

      const matchesType =
        filterType === "all" ||
        (filterType === "premium"
          ? Boolean(note.isPremium)
          : !note.isPremium);

      const searchableText = [
        note.title,
        note.subject,
        note.chapter,
        note.content,
        note.pdfName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search);

      return (
        matchesClass &&
        matchesSubject &&
        matchesChapter &&
        matchesType &&
        matchesSearch
      );
    });
  }, [
    notes,
    searchTerm,
    filterClass,
    filterSubject,
    filterChapter,
    filterType,
  ]);

  const clearFilters = () => {
    setSearchTerm("");
    setFilterClass("all");
    setFilterSubject("all");
    setFilterChapter("all");
    setFilterType("all");
  };

  const hasActiveFilters =
    searchTerm !== "" ||
    filterClass !== "all" ||
    filterSubject !== "all" ||
    filterChapter !== "all" ||
    filterType !== "all";

  const addChapter = async (event) => {
    event.preventDefault();

    if (!chapterForm.chapter.trim()) {
      showError("Chapter name enter karein.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      await api.addChapter({
        classNo: Number(chapterForm.classNo),
        subject: chapterForm.subject,
        chapter: chapterForm.chapter.trim(),
      });

      setChapterForm((previous) => ({
        ...previous,
        chapter: "",
      }));

      showMessage("Chapter successfully saved.");
      await loadData();
    } catch (err) {
      showError(err.message || "Chapter save nahi ho paya.");
    } finally {
      setSaving(false);
    }
  };

  const deleteChapter = async (id) => {
    if (!window.confirm("Are you sure you want to delete this chapter?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      await api.deleteChapter(id);

      showMessage("Chapter deleted successfully.");
      await loadData();
    } catch (err) {
      showError(err.message || "Chapter delete nahi ho paya.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleNoteChange = (event) => {
    const { name, value, checked, type } = event.target;

    setNoteForm((previous) => {
      const updated = {
        ...previous,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "classNo") {
        updated.subject = "";
        updated.chapter = "";
      }

      if (name === "subject") {
        updated.chapter = "";
      }

      return updated;
    });
  };

  const resetNoteForm = () => {
    setEditingNote(null);
    setNoteForm(initialNote);
    setPdf(null);

    const fileInput = document.getElementById("note-pdf");
    if (fileInput) fileInput.value = "";
  };

  const editNote = (note) => {
    setEditingNote(note);

    setNoteForm({
      classNo: String(note.classNo),
      subject: note.subject || "",
      chapter: note.chapter || "",
      title: note.title || "",
      content: note.content || "",
      youtubeUrl: note.youtubeUrl || "",
      isPremium: Boolean(note.isPremium),
    });

    setPdf(null);
    setError("");
    setMessage("");
    setTab("notes");

    const fileInput = document.getElementById("note-pdf");
    if (fileInput) fileInput.value = "";

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const addNote = async (event) => {
    event.preventDefault();

    if (!noteForm.subject) {
      showError("Is class ke liye pehle syllabus mein subject add karein.");
      return;
    }

    if (!noteForm.chapter) {
      showError("Please select a chapter.");
      return;
    }

    if (!noteForm.title.trim()) {
      showError("Please enter note title.");
      return;
    }

    if (
      !noteForm.content.trim() &&
      !pdf &&
      !editingNote?.pdfUrl
    ) {
      showError("Please enter note content or select a PDF.");
      return;
    }

    if (pdf && pdf.type !== "application/pdf") {
      showError("Only PDF files are allowed.");
      return;
    }

    if (pdf && pdf.size > 10 * 1024 * 1024) {
      showError("PDF size must be less than 10 MB.");
      return;
    }

    if (!isValidYouTubeUrl(noteForm.youtubeUrl)) {
      showError("Valid YouTube video URL enter karein.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const formData = new FormData();

      formData.append("classNo", noteForm.classNo);
      formData.append("subject", noteForm.subject);
      formData.append("chapter", noteForm.chapter);
      formData.append("title", noteForm.title.trim());
      formData.append("content", noteForm.content);
      formData.append("youtubeUrl", noteForm.youtubeUrl.trim());
      formData.append("isPremium", String(noteForm.isPremium));

      if (pdf) {
        formData.append("pdf", pdf);
      }

      if (editingNote) {
        await api.updateNote(editingNote._id, formData);
        showMessage("Note updated successfully.");
      } else {
        await api.addNote(formData);
        showMessage("Note successfully saved.");
      }

      resetNoteForm();
      await loadData();
    } catch (err) {
      showError(
        err.message ||
          (editingNote
            ? "Note update nahi ho paya."
            : "Note save nahi ho paya.")
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");

      await api.deleteNote(id);

      if (editingNote?._id === id) {
        resetNoteForm();
      }

      showMessage("Note deleted successfully.");
      await loadData();
    } catch (err) {
      showError(err.message || "Note delete nahi ho paya.");
    } finally {
      setDeletingId(null);
    }
  };

  const getPdfUrl = (pdfPath) => {
    if (!pdfPath) return "";

    if (pdfPath.startsWith("http://") || pdfPath.startsWith("https://")) {
      return pdfPath;
    }

    const apiBase = (
      import.meta.env.VITE_API_URL || "http://localhost:5000/api"
    ).replace(/\/api\/?$/, "");

    return `${apiBase}${pdfPath.startsWith("/") ? "" : "/"}${pdfPath}`;
  };

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-7 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/admin/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <p className="text-xs font-bold tracking-widest text-blue-600">
              AAO PADAI KARE / ADMIN
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Notes Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage syllabus chapters and student study materials.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </header>

        <section className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <BookOpen className="mb-3 text-blue-600" size={24} />
            <p className="text-3xl font-black text-slate-900">
              {chapters.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">Total Chapters</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <FileText className="mb-3 text-emerald-600" size={24} />
            <p className="text-3xl font-black text-slate-900">
              {notes.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">Total Notes</p>
          </div>

          <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-1">
            <BookOpen className="mb-3 text-violet-600" size={24} />
            <p className="text-3xl font-black text-slate-900">
              {
                new Set(
                  chapters.map((item) => `${item.classNo}-${item.subject}`)
                ).size
              }
            </p>
            <p className="mt-1 text-sm text-slate-500">Total Subjects</p>
          </div>
        </section>

        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={19} />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertCircle size={19} />
            {error}
          </div>
        )}

        <div className="mb-6 flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              setTab("notes");
              setError("");
              setMessage("");
            }}
            className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition ${
              tab === "notes"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <FileText size={17} />
              Add Notes
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab("chapters");
              setError("");
              setMessage("");
            }}
            className={`shrink-0 rounded-xl px-5 py-3 text-sm font-bold transition ${
              tab === "chapters"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span className="flex items-center gap-2">
              <BookOpen size={17} />
              Manage Chapters
            </span>
          </button>
        </div>

        {tab === "chapters" && (
          <section className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={addChapter}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
            >
              <h2 className="mb-2 text-xl font-black text-slate-900">
                Add New Chapter
              </h2>

              <p className="mb-6 text-sm text-slate-500">
                Add a chapter to your class syllabus.
              </p>

              <label className="mb-2 block text-sm font-bold text-slate-700">
                Select Class
              </label>

              <select
                className={inputClass}
                value={chapterForm.classNo}
                onChange={(e) =>
                  setChapterForm({
                    ...chapterForm,
                    classNo: e.target.value,
                  })
                }
              >
                {classes.map((n) => (
                  <option key={n} value={n}>
                    Class {n}
                  </option>
                ))}
              </select>

              <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
                Select Subject
              </label>

              <select
                className={inputClass}
                value={chapterForm.subject}
                onChange={(e) =>
                  setChapterForm({
                    ...chapterForm,
                    subject: e.target.value,
                  })
                }
              >
                {availableSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
                Chapter Name
              </label>

              <input
                className={inputClass}
                placeholder="Enter chapter name"
                value={chapterForm.chapter}
                onChange={(e) =>
                  setChapterForm({
                    ...chapterForm,
                    chapter: e.target.value,
                  })
                }
                required
              />

              <button
                type="submit"
                disabled={saving}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                <Plus size={18} />
                {saving ? "Saving..." : "Save Chapter"}
              </button>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <h2 className="mb-2 text-xl font-black text-slate-900">
                Saved Chapters
              </h2>

              <p className="mb-6 text-sm text-slate-500">
                All chapters saved in your database.
              </p>

              {loading ? (
                <div className="flex justify-center p-8">
                  <LoaderCircle
                    className="animate-spin text-blue-600"
                    size={30}
                  />
                </div>
              ) : chapters.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-5 text-sm text-slate-500">
                  No chapters added yet.
                </p>
              ) : (
                <div className="max-h-[550px] space-y-3 overflow-y-auto">
                  {chapters.map((item) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
                    >
                      <div>
                        <p className="font-bold text-slate-800">
                          {item.chapter}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Class {item.classNo} · {item.subject}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteChapter(item._id)}
                        disabled={deletingId === item._id}
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                        title="Delete chapter"
                      >
                        {deletingId === item._id ? (
                          <LoaderCircle
                            size={18}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {tab === "notes" && (
          <section className="grid gap-6 lg:grid-cols-2">
            <form
              onSubmit={addNote}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
            >
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {editingNote ? "Edit Study Notes" : "Upload Study Notes"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Add notes, PDF and an optional YouTube lesson.
                  </p>
                </div>

                {editingNote && (
                  <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                    Editing
                  </span>
                )}
              </div>

              <label className="mb-2 block text-sm font-bold text-slate-700">
                Select Class
              </label>

              <select
                name="classNo"
                className={inputClass}
                value={noteForm.classNo}
                onChange={handleNoteChange}
              >
                {classes.map((n) => (
                  <option key={n} value={n}>
                    Class {n}
                  </option>
                ))}
              </select>

              <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
                Select Subject
              </label>

              <select
                name="subject"
                className={inputClass}
                value={noteForm.subject}
                onChange={handleNoteChange}
                disabled={noteSubjects.length === 0}
              >
                <option value="">Select subject</option>
                {noteSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              {noteSubjects.length === 0 && (
                <p className="mt-2 text-xs font-medium text-amber-600">
                  Is class ke liye pehle syllabus mein chapter add karein.
                </p>
              )}

              <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
                Select Chapter
              </label>

              <select
                name="chapter"
                className={inputClass}
                value={noteForm.chapter}
                onChange={handleNoteChange}
                disabled={classChapters.length === 0}
              >
                <option value="">Select chapter</option>
                {classChapters.map((item) => (
                  <option key={item._id} value={item.chapter}>
                    {item.chapter}
                  </option>
                ))}
              </select>

              <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
                Note Title
              </label>

              <input
                name="title"
                className={inputClass}
                placeholder="Enter note title"
                value={noteForm.title}
                onChange={handleNoteChange}
                required
              />

              <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
                Note Content
              </label>

              <textarea
                name="content"
                className={`${inputClass} resize-y`}
                rows={6}
                placeholder="Write your notes here..."
                value={noteForm.content}
                onChange={handleNoteChange}
              />

              <div className="mt-5 rounded-xl border border-red-100 bg-red-50 p-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Play size={18} className="text-red-600" />
                  YouTube Video URL (Optional)
                </label>

                <input
                  type="url"
                  name="youtubeUrl"
                  className={inputClass}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={noteForm.youtubeUrl}
                  onChange={handleNoteChange}
                />

                <p className="mt-2 text-xs text-slate-500">
                  Is chapter ka YouTube lecture link yahan paste karein.
                  Student ko notes ke saath video bhi dikhega.
                </p>

                {noteForm.youtubeUrl && isValidYouTubeUrl(noteForm.youtubeUrl) && (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    YouTube URL looks valid.
                  </p>
                )}
              </div>

              {editingNote?.pdfUrl && !pdf && (
                <div className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-blue-700">
                    <FileText size={17} />
                    <span className="truncate">
                      {editingNote.pdfName || "Current PDF attached"}
                    </span>
                  </span>

                  <a
                    href={getPdfUrl(editingNote.pdfUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0 font-bold text-blue-700 underline"
                  >
                    View PDF
                  </a>
                </div>
              )}

              <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
                {editingNote ? "Replace PDF (Optional)" : "Upload PDF (Optional)"}
              </label>

              <input
                id="note-pdf"
                type="file"
                accept="application/pdf,.pdf"
                className={inputClass}
                onChange={(e) => setPdf(e.target.files?.[0] || null)}
              />

              <p className="mt-2 text-xs text-slate-400">
                PDF format only. Maximum file size: 10 MB.
              </p>

              {pdf && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
                  <FileText size={18} />
                  <span className="truncate">{pdf.name}</span>
                </div>
              )}

              <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <input
                  name="isPremium"
                  type="checkbox"
                  checked={noteForm.isPremium}
                  onChange={handleNoteChange}
                  className="h-5 w-5 accent-amber-600"
                />
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    Premium Note
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Mark this content as Premium.
                  </p>
                </div>
              </label>

              <button
                type="submit"
                disabled={
                  saving ||
                  loading ||
                  !noteForm.subject ||
                  !noteForm.chapter ||
                  classChapters.length === 0
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : editingNote ? (
                  <Save size={18} />
                ) : (
                  <Upload size={18} />
                )}

                {saving
                  ? editingNote
                    ? "Updating..."
                    : "Uploading..."
                  : editingNote
                    ? "Update Study Note"
                    : "Save Study Note"}
              </button>

              {editingNote && (
                <button
                  type="button"
                  onClick={resetNoteForm}
                  disabled={saving}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <X size={18} />
                  Cancel Editing
                </button>
              )}
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    Uploaded Notes
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Manage your saved study materials.
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  {filteredNotes.length} / {notes.length} Notes
                </span>
              </div>

              <div className="mb-5 space-y-3">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search notes by title, subject, chapter..."
                    className={`${inputClass} pl-11 pr-10`}
                  />

                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                      title="Clear search"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm font-bold text-slate-600">
                  <Filter size={17} />
                  Filter Notes
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <select
                    className={inputClass}
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                  >
                    <option value="all">All Classes</option>
                    {classes.map((n) => (
                      <option key={n} value={String(n)}>
                        Class {n}
                      </option>
                    ))}
                  </select>

                  <select
                    className={inputClass}
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <option value="all">All Subjects</option>
                    {noteFilterSubjects.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>

                  <select
                    className={inputClass}
                    value={filterChapter}
                    onChange={(e) => setFilterChapter(e.target.value)}
                  >
                    <option value="all">All Chapters</option>
                    {noteFilterChapters.map((chapter) => (
                      <option key={chapter} value={chapter}>
                        {chapter}
                      </option>
                    ))}
                  </select>

                  <select
                    className={inputClass}
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <option value="all">All Notes</option>
                    <option value="free">Free Notes</option>
                    <option value="premium">Premium Notes</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-slate-500">
                      {filteredNotes.length} matching notes found
                    </p>
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-sm font-bold text-blue-600 hover:text-blue-800"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center p-8">
                  <LoaderCircle
                    className="animate-spin text-blue-600"
                    size={30}
                  />
                </div>
              ) : notes.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center">
                  <FileText
                    className="mx-auto mb-3 text-slate-300"
                    size={36}
                  />
                  <p className="font-bold text-slate-600">
                    No notes uploaded yet.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Your uploaded notes will appear here.
                  </p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-8 text-center">
                  <Search
                    className="mx-auto mb-3 text-slate-300"
                    size={36}
                  />
                  <p className="font-bold text-slate-600">
                    No matching notes found.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Try changing your search or filters.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="max-h-[750px] space-y-3 overflow-y-auto">
                  {filteredNotes.map((note) => (
                    <div
                      key={note._id}
                      className="rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words font-bold text-slate-800">
                            {note.title}
                          </p>

                          <p className="mt-2 text-xs text-slate-500">
                            Class {note.classNo} · {note.subject}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {note.chapter}
                          </p>

                          {note.pdfName && (
                            <p className="mt-2 flex items-center gap-1 break-all text-xs text-blue-600">
                              <FileText size={14} />
                              {note.pdfName}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                note.isPremium
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-emerald-50 text-emerald-700"
                              }`}
                            >
                              {note.isPremium ? "Premium" : "Free"}
                            </span>

                            {note.youtubeUrl && (
                              <span className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
                                <Play size={12} />
                                Video Added
                              </span>
                            )}
                          </div>

                          {note.youtubeUrl && (
                            <a
                              href={note.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                            >
                              Open YouTube Video
                              <ExternalLink size={12} />
                            </a>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => editNote(note)}
                            className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                            title="Edit note"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteNote(note._id)}
                            disabled={deletingId === note._id}
                            className="shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-50"
                            title="Delete note"
                          >
                            {deletingId === note._id ? (
                              <LoaderCircle
                                size={18}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} Aao Padai Kare. All rights reserved.
          </p>

          <Link
            to="/admin/dashboard"
            className="font-semibold text-blue-600 hover:text-blue-800"
          >
            Admin Dashboard
          </Link>
        </footer>
      </div>
    </main>
  );
}
