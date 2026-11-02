
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  NotebookPen,
  Target,
  Trophy,
  UserRound,
  Mail,
  Phone,
  LogOut,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { api, clearStudentToken } from "../services/api";

const actions = [
  {
    title: "Explore Classes",
    description: "Class 6–12 ke subjects aur chapters dekhein.",
    to: "/classes",
    icon: GraduationCap,
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    title: "Study Notes",
    description: "Apni registered class ke study notes dekhein.",
    to: "/notes",
    icon: NotebookPen,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Practice Quiz",
    description: "Sample MCQ quiz solve karke score check karein.",
    to: "/quiz",
    icon: ClipboardCheck,
    color: "bg-amber-100 text-amber-700",
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchStudent() {
    try {
      setLoading(true);
      setError("");

      const response = await api.getStudent();
      const studentData = response.student || response.data;

      if (!studentData) {
        throw new Error("Student profile nahi mil payi.");
      }

      setStudent(studentData);
    } catch (err) {
      setError(err.message || "Profile load nahi ho payi.");

      if (!localStorage.getItem("studentToken")) {
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStudent();
  }, []);

  function handleLogout() {
    clearStudentToken();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <LoaderCircle
            size={42}
            className="mx-auto animate-spin text-indigo-600"
          />
          <p className="mt-4 font-semibold text-slate-600">
            Loading your dashboard...
          </p>
        </div>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <UserRound
            size={42}
            className="mx-auto text-indigo-600"
          />

          <h2 className="mt-4 text-xl font-black text-slate-900">
            Profile load nahi hui
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error || "Please dobara login karein."}
          </p>

          <button
            onClick={fetchStudent}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
          >
            <RefreshCw size={17} />
            Try Again
          </button>

          <button
            onClick={handleLogout}
            className="mt-3 block w-full rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700 hover:bg-slate-50"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  const studentName = student.name || "Student";
  const studentClass = student.classNo || "";

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HEADER */}
      <section className="bg-gradient-to-r from-indigo-700 to-blue-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-indigo-100">
                STUDENT SPACE
              </p>

              <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                Welcome, {studentName}!
              </h1>

              <p className="mt-3 text-sm leading-7 text-indigo-100 sm:text-base">
                Aaj apni padhai ke liye ek naya step lo.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15">
                <GraduationCap size={42} />
              </div>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-sm font-bold transition hover:bg-white/20"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

        {/* STUDENT PROFILE CARD */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
              <UserRound size={32} />
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-black text-slate-900">
                {studentName}
              </h2>

              <div className="mt-3 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:flex-wrap sm:gap-5">
                <span className="flex items-center gap-2">
                  <Mail size={16} />
                  {student.email}
                </span>

                <span className="flex items-center gap-2">
                  <Phone size={16} />
                  {student.mobile}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:items-end">
              <div className="rounded-2xl bg-indigo-50 px-5 py-3">
                <p className="text-xs font-bold text-indigo-500">
                  YOUR CLASS
                </p>

                <p className="mt-1 text-xl font-black text-indigo-700">
                  Class {studentClass}
                </p>
              </div>

              <Link
                to="/student/profile"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                <UserRound size={18} />
                My Profile
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* STUDENT STATS */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Available Classes",
              value: "6–12",
              icon: BookOpen,
            },
            {
              label: "Your Class",
              value: studentClass || "Not available",
              icon: GraduationCap,
            },
            {
              label: "Practice Quiz",
              value: "Ready",
              icon: Target,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>

                  <Icon size={21} className="text-indigo-600" />
                </div>

                <p className="mt-3 text-2xl font-black text-slate-900">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>

        {/* CONTINUE LEARNING */}
        <div className="mt-10">
          <h2 className="text-2xl font-black text-slate-900">
            Continue Learning
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Apna agla learning activity select karein.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {actions.map((action) => {
              const Icon = action.icon;

              const destination =
                action.title === "Study Notes"
                  ? `/notes?class=${studentClass}`
                  : action.to;

              return (
                <Link
                  key={action.title}
                  to={destination}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${action.color}`}
                  >
                    <Icon size={25} />
                  </div>

                  <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                    {action.title}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {action.description}
                  </p>

                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-indigo-700">
                    Open
                    <ArrowRight
                      size={17}
                      className="transition group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* MOTIVATION CARD */}
        <div className="mt-8 rounded-2xl border border-indigo-100 bg-indigo-50 p-6">
          <div className="flex items-center gap-3">
            <Trophy size={25} className="text-indigo-600" />

            <h3 className="font-extrabold text-slate-900">
              Keep Learning, Keep Growing!
            </h3>
          </div>

          <p className="mt-2 text-sm leading-7 text-slate-600">
            Roz thoda padhein, regular practice karein aur apne goals
            ki taraf aage badhein.
          </p>
        </div>

      </section>
    </main>
  );
}
