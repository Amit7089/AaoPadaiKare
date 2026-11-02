
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  UserRound,
  Mail,
  Phone,
  GraduationCap,
  CalendarDays,
  ArrowLeft,
  LoaderCircle,
  LogOut,
  RefreshCw,
} from "lucide-react";

import { api, clearStudentToken } from "../services/api";

export default function MyProfile() {
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadProfile() {
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

      if (
        err.message?.toLowerCase().includes("token") ||
        err.message?.toLowerCase().includes("unauthorized")
      ) {
        clearStudentToken();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!localStorage.getItem("studentToken")) {
      navigate("/login", { replace: true });
      return;
    }

    loadProfile();
  }, []);

  function handleLogout() {
    clearStudentToken();
    navigate("/login", { replace: true });
  }

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50">
        <div className="text-center">
          <LoaderCircle
            size={40}
            className="mx-auto animate-spin text-indigo-600"
          />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            Loading your profile...
          </p>
        </div>
      </main>
    );
  }

  if (error || !student) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center">
          <UserRound
            size={40}
            className="mx-auto text-indigo-600"
          />

          <h2 className="mt-4 text-xl font-black text-slate-900">
            Profile not available
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error || "Please try again."}
          </p>

          <button
            onClick={loadProfile}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white hover:bg-indigo-700"
          >
            <RefreshCw size={17} />
            Try Again
          </button>

          <button
            onClick={handleLogout}
            className="mt-3 block w-full rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700"
          >
            Back to Login
          </button>
        </div>
      </main>
    );
  }

  const profileItems = [
    {
      label: "Full Name",
      value: student.name || "Not available",
      icon: UserRound,
    },
    {
      label: "Email Address",
      value: student.email || "Not available",
      icon: Mail,
    },
    {
      label: "Mobile Number",
      value: student.mobile || "Not available",
      icon: Phone,
    },
    {
      label: "Registered Class",
      value: student.classNo
        ? `Class ${student.classNo}`
        : "Not available",
      icon: GraduationCap,
    },
    {
      label: "Account Created",
      value: formatDate(student.createdAt),
      icon: CalendarDays,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
      <div className="mx-auto max-w-4xl">

        {/* BACK BUTTON */}
        <Link
          to="/student/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        {/* PROFILE HEADER */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="bg-gradient-to-r from-indigo-700 to-blue-600 px-6 py-10 text-center text-white sm:py-12">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white/30 bg-white/15">
              <UserRound size={48} />
            </div>

            <h1 className="mt-5 text-2xl font-black sm:text-3xl">
              {student.name}
            </h1>

            <p className="mt-2 text-sm text-indigo-100">
              Student Profile
            </p>

            <span className="mt-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
              Class {student.classNo}
            </span>
          </div>

          {/* PROFILE DETAILS */}
          <div className="p-5 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your registered account details.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {profileItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500">
                        {item.label}
                      </p>

                      <p className="mt-1 break-words text-sm font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ACCOUNT STATUS */}
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />

                <div>
                  <p className="font-bold text-emerald-800">
                    Account Active
                  </p>

                  <p className="mt-1 text-xs text-emerald-700">
                    Your student account is registered successfully.
                  </p>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/student/dashboard"
                className="flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700"
              >
                Go to Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 font-bold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
