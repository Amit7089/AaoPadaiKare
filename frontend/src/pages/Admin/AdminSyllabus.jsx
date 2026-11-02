
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  Layers,
  Plus,
  Trash2,
  RefreshCw,
  ArrowLeft,
  Search,
  ChevronDown,
  BookMarked,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { getAdminToken } from "../../services/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminSyllabus() {
  const [syllabus, setSyllabus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    classNo: "6",
    subject: "",
    chapter: "",
  });

  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");

  const classes = [6, 7, 8, 9, 10, 11, 12];

  const loadSyllabus = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/syllabus`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Syllabus load nahi ho paya.");
      }

      const records = Array.isArray(data)
        ? data
        : data.syllabus || data.data || [];

      setSyllabus(records);
    } catch (err) {
      setError(err.message || "Server se connection nahi ho paya.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSyllabus();
  }, []);

  const subjects = useMemo(() => {
    return [
      ...new Set(
        syllabus
          .filter((item) => String(item.classNo) === String(filterClass === "all" ? form.classNo : filterClass))
          .map((item) => item.subject)
          .filter(Boolean)
      ),
    ];
  }, [syllabus, filterClass, form.classNo]);

  const filteredSyllabus = useMemo(() => {
    return syllabus.filter((item) => {
      const matchesClass =
        filterClass === "all" ||
        String(item.classNo) === String(filterClass);

      const matchesSubject =
        filterSubject === "all" || item.subject === filterSubject;

      const searchText = search.toLowerCase();
      const matchesSearch =
        !searchText ||
        String(item.classNo).includes(searchText) ||
        (item.subject || "").toLowerCase().includes(searchText) ||
        (item.chapter || "").toLowerCase().includes(searchText);

      return matchesClass && matchesSubject && matchesSearch;
    });
  }, [syllabus, filterClass, filterSubject, search]);

  const totalSubjects = new Set(
    syllabus.map((item) => `${item.classNo}-${item.subject}`)
  ).size;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!form.subject.trim() || !form.chapter.trim()) {
      setError("Subject aur Chapter dono bharna zaroori hai.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/syllabus`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify({
          classNo: Number(form.classNo),
          subject: form.subject.trim(),
          chapter: form.chapter.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Syllabus add nahi ho paya.");
      }

      setForm((previous) => ({
        ...previous,
        chapter: "",
      }));

      setSuccess("Chapter successfully add ho gaya!");
      await loadSyllabus();
    } catch (err) {
      setError(err.message || "Chapter add karte waqt error aaya.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya aap is chapter ko delete karna chahte hain?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/syllabus/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getAdminToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Chapter delete nahi ho paya.");
      }

      setSuccess("Chapter successfully delete ho gaya!");
      await loadSyllabus();
    } catch (err) {
      setError(err.message || "Delete karte waqt error aaya.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <Link
              to="/admin/dashboard"
              className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Syllabus Management
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage classes, subjects and chapters.
            </p>
          </div>

          <button
            onClick={loadSyllabus}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 size={19} />
            {success}
          </div>
        )}

        {/* Statistics */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Classes</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">7</h2>
              </div>
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <GraduationCap size={25} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Class 6 to Class 12</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Subjects</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  {loading ? "—" : totalSubjects}
                </h2>
              </div>
              <div className="rounded-xl bg-violet-50 p-3 text-violet-600">
                <BookOpen size={25} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Unique class-wise subjects</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Chapters</p>
                <h2 className="mt-2 text-3xl font-black text-slate-900">
                  {loading ? "—" : syllabus.length}
                </h2>
              </div>
              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <Layers size={25} />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">Total syllabus chapters</p>
          </div>
        </section>

        {/* Add Chapter Form */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Plus size={21} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Add New Chapter
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Select a class and enter its subject and chapter.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleAdd} className="grid grid-cols-1 gap-5 p-6 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Select Class
              </label>
              <div className="relative">
                <select
                  name="classNo"
                  value={form.classNo}
                  onChange={handleChange}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {classes.map((classNo) => (
                    <option key={classNo} value={classNo}>
                      Class {classNo}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-3.5 text-slate-400" size={18} />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Subject Name
              </label>
              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                list="subject-suggestions"
                placeholder="e.g. Mathematics"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <datalist id="subject-suggestions">
                {subjects.map((subject) => (
                  <option key={subject} value={subject} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Chapter Name
              </label>
              <input
                name="chapter"
                value={form.chapter}
                onChange={handleChange}
                placeholder="e.g. Real Numbers"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <Plus size={19} />
                {saving ? "Adding Chapter..." : "Add Chapter"}
              </button>
            </div>
          </form>
        </section>

        {/* Syllabus List */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                All Syllabus Chapters
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View and manage your saved chapters.
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              {filteredSyllabus.length} Chapters
            </span>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/70 p-5 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={17} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search chapter or subject..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filterClass}
              onChange={(e) => {
                setFilterClass(e.target.value);
                setFilterSubject("all");
              }}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Classes</option>
              {classes.map((classNo) => (
                <option key={classNo} value={classNo}>
                  Class {classNo}
                </option>
              ))}
            </select>

            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading syllabus...
            </div>
          ) : filteredSyllabus.length === 0 ? (
            <div className="p-12 text-center">
              <BookMarked className="mx-auto mb-3 text-slate-300" size={42} />
              <h3 className="font-bold text-slate-700">No chapters found</h3>
              <p className="mt-1 text-sm text-slate-400">
                Add a new chapter or change your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Subject</th>
                    <th className="px-6 py-4">Chapter</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSyllabus.map((item) => (
                    <tr key={item._id} className="transition hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                          Class {item.classNo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {item.subject}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.chapter}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(item._id)}
                          disabled={deletingId === item._id}
                          title="Delete chapter"
                          className="inline-flex items-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={15} />
                          {deletingId === item._id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
