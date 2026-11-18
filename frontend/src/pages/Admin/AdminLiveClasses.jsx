
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Video,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Edit,
  CalendarDays,
  Clock,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";
import { getAdminToken } from "../../services/api";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialForm = {
  title: "",
  classNo: "6",
  subject: "",
  description: "",
  platform: "google_meet",
  meetingUrl: "",
  scheduledAt: "",
  durationMinutes: "60",
  status: "scheduled",
  recordingUrl: "",
};

const classes = [6, 7, 8, 9, 10, 11, 12];

const statusOptions = [
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const statusStyle = {
  scheduled: "bg-blue-50 text-blue-700",
  live: "bg-green-50 text-green-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-50 text-red-600",
};

const formatDate = (date) => {
  if (!date) return "Not scheduled";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const toDateTimeLocal = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  const offset = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offset * 60000);

  return localDate.toISOString().slice(0, 16);
};

export default function AdminLiveClasses() {
  const [liveClasses, setLiveClasses] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/live-classes/admin/all`,
        {
          headers: {
            Authorization: `Bearer ${getAdminToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Live classes load nahi ho payi."
        );
      }

      const records = Array.isArray(data)
        ? data
        : data.liveClasses || data.classes || data.data || [];

      setLiveClasses(records);
    } catch (err) {
      setError(err.message || "Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  const filteredClasses = useMemo(() => {
    return liveClasses.filter((item) => {
      const matchesClass =
        filterClass === "all" ||
        String(item.classNo) === filterClass;

      const matchesStatus =
        filterStatus === "all" ||
        item.status === filterStatus;

      const searchText = search.toLowerCase();

      const matchesSearch =
        !searchText ||
        (item.title || "").toLowerCase().includes(searchText) ||
        (item.subject || "").toLowerCase().includes(searchText) ||
        String(item.classNo).includes(searchText);

      return matchesClass && matchesStatus && matchesSearch;
    });
  }, [liveClasses, filterClass, filterStatus, search]);

  const stats = useMemo(() => ({
    total: liveClasses.length,
    scheduled: liveClasses.filter(
      (item) => item.status === "scheduled"
    ).length,
    live: liveClasses.filter(
      (item) => item.status === "live"
    ).length,
    completed: liveClasses.filter(
      (item) => item.status === "completed"
    ).length,
  }), [liveClasses]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.title.trim() ||
      !form.subject.trim() ||
      !form.meetingUrl.trim() ||
      !form.scheduledAt
    ) {
      setError("Please sabhi required fields fill karein.");
      return;
    }

    if (
      !Number.isInteger(Number(form.durationMinutes)) ||
      Number(form.durationMinutes) < 1 ||
      Number(form.durationMinutes) > 600
    ) {
      setError("Duration 1 se 600 minutes ke beech honi chahiye.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        classNo: Number(form.classNo),
        durationMinutes: Number(form.durationMinutes),
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      };

      const isEditing = Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `${API_URL}/live-classes/${editingId}`
          : `${API_URL}/live-classes`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAdminToken()}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Live class save nahi ho payi."
        );
      }

      setSuccess(
        isEditing
          ? "Live class successfully update ho gayi!"
          : "Live class successfully create ho gayi!"
      );

      resetForm();
      await loadClasses();
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingId(item._id);

    setForm({
      title: item.title || "",
      classNo: String(item.classNo || 6),
      subject: item.subject || "",
      description: item.description || "",
      platform: item.platform || "google_meet",
      meetingUrl: item.meetingUrl || "",
      scheduledAt: toDateTimeLocal(item.scheduledAt),
      durationMinutes: String(item.durationMinutes || 60),
      status: item.status || "scheduled",
      recordingUrl: item.recordingUrl || "",
    });

    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya aap is live class ko delete karna chahte hain?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/live-classes/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAdminToken()}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Live class delete nahi ho payi."
        );
      }

      setSuccess("Live class successfully delete ho gayi!");

      if (editingId === id) {
        resetForm();
      }

      await loadClasses();
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
              Live Classes Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage Zoom and Google Meet classes.
            </p>
          </div>

          <button
            onClick={loadClasses}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
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
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Total Classes",
              value: stats.total,
              icon: Video,
              color: "blue",
            },
            {
              label: "Scheduled",
              value: stats.scheduled,
              icon: CalendarDays,
              color: "indigo",
            },
            {
              label: "Live Now",
              value: stats.live,
              icon: Video,
              color: "green",
            },
            {
              label: "Completed",
              value: stats.completed,
              icon: CheckCircle2,
              color: "orange",
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-900">
                      {loading ? "—" : stat.value}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Add / Edit Form */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                <Plus size={21} />
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingId ? "Edit Live Class" : "Create New Live Class"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add class details and meeting information.
                </p>
              </div>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                <X size={16} />
                Cancel
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Live Class Title *
              </label>

              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="e.g. Mathematics - Algebra Live Class"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Select Class *
              </label>

              <select
                name="classNo"
                value={form.classNo}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {classes.map((classNo) => (
                  <option key={classNo} value={classNo}>
                    Class {classNo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Subject *
              </label>

              <input
                name="subject"
                value={form.subject}
                onChange={handleChange}
                placeholder="e.g. Mathematics"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Meeting Platform *
              </label>

              <select
                name="platform"
                value={form.platform}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="google_meet">Google Meet</option>
                <option value="zoom">Zoom</option>
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Meeting URL *
              </label>

              <input
                type="url"
                name="meetingUrl"
                value={form.meetingUrl}
                onChange={handleChange}
                placeholder="https://meet.google.com/..."
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-slate-400">
                Google Meet ya Zoom ka HTTPS meeting link paste karein.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Date & Time *
              </label>

              <input
                type="datetime-local"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Duration (Minutes) *
              </label>

              <input
                type="number"
                name="durationMinutes"
                min="1"
                max="600"
                value={form.durationMinutes}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Class Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                placeholder="Class ke baare mein details..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Recording URL (Optional)
              </label>

              <input
                type="url"
                name="recordingUrl"
                value={form.recordingUrl}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                <Plus size={19} />
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Live Class"
                    : "Create Live Class"}
              </button>
            </div>
          </form>
        </section>

        {/* All Classes */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                All Live Classes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                View and manage all scheduled classes.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              {filteredClasses.length} Classes
            </span>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/70 p-5 md:grid-cols-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-3.5 text-slate-400"
                size={17}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search class or subject..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
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
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Loading live classes...
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="p-12 text-center">
              <Video
                className="mx-auto mb-3 text-slate-300"
                size={42}
              />

              <h3 className="font-bold text-slate-700">
                No live classes found
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Create a new class or change your filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Class Details</th>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">Platform</th>
                    <th className="px-5 py-4">Schedule</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredClasses.map((item) => (
                    <tr
                      key={item._id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.subject}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                          Class {item.classNo}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold capitalize text-slate-700">
                        {item.platform === "google_meet"
                          ? "Google Meet"
                          : "Zoom"}
                      </td>

                      <td className="px-5 py-4">
                        <p className="flex items-center gap-2 text-sm text-slate-700">
                          <CalendarDays size={15} />
                          {formatDate(item.scheduledAt)}
                        </p>

                        <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <Clock size={14} />
                          {item.durationMinutes} minutes
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize ${
                            statusStyle[item.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {item.meetingUrl && (
                            <a
                              href={item.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Open meeting link"
                              className="rounded-lg border border-blue-100 p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}

                          <button
                            onClick={() => handleEdit(item)}
                            title="Edit class"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(item._id)}
                            disabled={deletingId === item._id}
                            title="Delete class"
                            className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
