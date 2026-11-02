
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  GraduationCap,
  Layers,
  RefreshCw,
  LogOut,
  ExternalLink,
  Plus,
  ArrowUpRight,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { clearAdminToken } from "../../services/api";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [syllabus, setSyllabus] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load dashboard data
  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [syllabusResponse, notesResponse] = await Promise.all([
        fetch(`${API_URL}/syllabus`),
        fetch(`${API_URL}/notes`),
      ]);

      if (!syllabusResponse.ok || !notesResponse.ok) {
        throw new Error("Dashboard data load nahi ho paya.");
      }

      const syllabusData = await syllabusResponse.json();
      const notesData = await notesResponse.json();

      setSyllabus(
        Array.isArray(syllabusData)
          ? syllabusData
          : syllabusData.syllabus || syllabusData.data || []
      );

      setNotes(
        Array.isArray(notesData)
          ? notesData
          : notesData.notes || notesData.data || []
      );
    } catch (err) {
      setError(err.message || "Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Dashboard statistics
  const totalClasses = new Set(
    syllabus.map((item) => item.classNo).filter(Boolean)
  ).size;

  const totalSubjects = new Set(
    syllabus
      .map((item) => `${item.classNo}-${item.subject}`)
      .filter(Boolean)
  ).size;

  const totalChapters = syllabus.length;
  const totalNotes = notes.length;

  const recentNotes = [...notes]
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )
    .slice(0, 5);

  // Logout
  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      clearAdminToken();
      navigate("/admin/login");
    }
  };

  // Statistics cards
  const stats = [
    {
      title: "Total Classes",
      value: totalClasses,
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Total Subjects",
      value: totalSubjects,
      icon: BookOpen,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      title: "Total Chapters",
      value: totalChapters,
      icon: Layers,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Total Notes",
      value: totalNotes,
      icon: FileText,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
  ];

  // Sidebar menu
  const menu = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Syllabus Management",
      path: "/admin/syllabus",
      icon: BookOpen,
    },
    {
      name: "Notes Management",
      path: "/admin/notes",
      icon: FileText,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-800 md:flex">

      {/* Mobile Header */}
      <div className="flex items-center justify-between bg-[#101d3a] p-4 text-white md:hidden">
        <h1 className="text-lg font-black">Aao Padai Kare</h1>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-[#101d3a] text-white transition-transform duration-300 md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-xl font-black">
            A
          </div>

          <div>
            <h1 className="text-lg font-black">Aao Padai Kare</h1>
            <p className="text-[10px] font-bold tracking-[2px] text-blue-300">
              ADMIN PANEL
            </p>
          </div>

          <button
            className="ml-auto md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-5 pt-8">
          <p className="mb-4 px-3 text-[10px] font-bold tracking-[2px] text-slate-500">
            MAIN MENU
          </p>

          <nav className="space-y-2">
            {menu.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/30"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon size={19} />
                  {item.name}

                  {active && (
                    <ChevronRight className="ml-auto" size={16} />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom */}
        <div className="shrink-0 p-5">
          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <ShieldCheck className="mb-2 text-blue-400" size={23} />

            <p className="text-sm font-bold">Admin Security</p>

            <p className="mt-1 text-xs text-slate-400">
              Your admin session is protected.
            </p>
          </div>

          <Link
            to="/"
            className="mb-2 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 hover:bg-white/10"
          >
            <ExternalLink size={18} />
            View Website
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="min-w-0 flex-1">

        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-lg sm:px-8">
          <div>
            <p className="text-xs font-semibold text-slate-400">
              ADMINISTRATION / OVERVIEW
            </p>

            <h2 className="mt-1 text-lg font-extrabold text-slate-800">
              Dashboard
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadDashboard}
              disabled={loading}
              title="Refresh dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>

            <div className="hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                A
              </div>

              <div>
                <p className="text-sm font-bold">Administrator</p>
                <p className="text-xs text-slate-400">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl space-y-8 p-5 sm:p-8">

          {/* Welcome Banner */}
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#142b59] via-[#174b9c] to-[#2563eb] p-7 text-white shadow-xl shadow-blue-900/10 sm:p-10">
            <div className="relative z-10 max-w-xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <Sparkles size={14} />
                Education Management System
              </div>

              <h1 className="text-2xl font-black leading-tight text-white sm:text-4xl">
                Welcome Back, Admin!
              </h1>

              <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
                Manage your classes, syllabus and study materials from one
                place. Keep learning simple with Aao Padai Kare.
              </p>

              <Link
                to="/admin/notes"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 transition hover:bg-blue-50"
              >
                Manage Study Notes
                <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="pointer-events-none absolute -right-12 -top-20 h-72 w-72 rounded-full border-[35px] border-white/10" />

            <div className="pointer-events-none absolute -bottom-36 right-32 h-72 w-72 rounded-full border-[35px] border-white/10" />

            <BookOpen className="pointer-events-none absolute bottom-7 right-10 hidden h-28 w-28 rotate-12 text-white/10 sm:block" />
          </section>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Statistics */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold">Overview</h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your website statistics at a glance.
                </p>
              </div>

              <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                Live Data
              </span>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.title}
                    className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.bg} ${stat.color}`}
                      >
                        <Icon size={23} />
                      </div>

                      <span className="text-xs font-bold text-slate-300">
                        0{index + 1}
                      </span>
                    </div>

                    <p className="mt-5 text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <h3 className="mt-1 text-3xl font-black text-slate-900">
                      {loading ? "—" : stat.value}
                    </h3>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <h3 className="text-xl font-extrabold">Quick Actions</h3>

            <p className="mt-1 text-sm text-slate-500">
              Quickly access your management tools.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

              {/* Add Notes */}
              <Link
                to="/admin/notes"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Plus size={26} />
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800">
                      Add Study Notes
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Create and manage learning content.
                    </p>
                  </div>
                </div>

                <ArrowUpRight className="text-slate-300 transition group-hover:text-blue-600" />
              </Link>

              {/* Syllabus Management */}
              <Link
                to="/admin/syllabus"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <Layers size={26} />
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800">
                      Manage Syllabus
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Manage classes, subjects and chapters.
                    </p>
                  </div>
                </div>

                <ArrowUpRight className="text-slate-300 transition group-hover:text-orange-600" />
              </Link>

              {/* View Classes */}
              <Link
                to="/classes"
                className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <GraduationCap size={26} />
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-800">
                      View Classes
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Explore the student website.
                    </p>
                  </div>
                </div>

                <ArrowUpRight className="text-slate-300 transition group-hover:text-violet-600" />
              </Link>
            </div>
          </section>

          {/* Recent Notes */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h3 className="text-lg font-extrabold">
                  Recent Study Notes
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Recently added learning materials.
                </p>
              </div>

              <Link
                to="/admin/notes"
                className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100"
              >
                View All Notes
              </Link>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Loading recent notes...
              </div>
            ) : recentNotes.length === 0 ? (
              <div className="p-12 text-center">
                <FileText
                  className="mx-auto mb-3 text-slate-300"
                  size={38}
                />

                <p className="font-semibold text-slate-600">
                  No notes added yet
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Start by adding your first study note.
                </p>

                <Link
                  to="/admin/notes"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Add First Note
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-bold">Note Title</th>
                      <th className="px-6 py-4 font-bold">Class</th>
                      <th className="px-6 py-4 font-bold">Subject</th>
                      <th className="px-6 py-4 font-bold">Chapter</th>
                      <th className="px-6 py-4 font-bold">Access</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {recentNotes.map((note) => (
                      <tr
                        key={note._id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {note.title || "Untitled Note"}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          Class {note.classNo}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {note.subject}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {note.chapter}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              note.isPremium
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {note.isPremium ? "Premium" : "Free"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} Aao Padai Kare. All rights reserved.
            </p>

            <p className="flex items-center gap-2">
              <ShieldCheck size={14} />
              Secure Admin Panel
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
