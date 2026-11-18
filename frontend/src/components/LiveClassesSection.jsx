
import { useEffect, useState } from "react";
import {
  Video,
  CalendarDays,
  Clock,
  ExternalLink,
  LockKeyhole,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function formatDate(date) {
  if (!date) return "Date not available";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function LiveClassesSection({ classNo }) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [requiresPremium, setRequiresPremium] = useState(false);

  const loadClasses = async () => {
    try {
      setLoading(true);
      setError("");
      setRequiresPremium(false);

      const token = localStorage.getItem("studentToken");

      const response = await fetch(
        `${API_URL}/live-classes?classNo=${classNo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 403) {
        setRequiresPremium(true);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Live classes load nahi ho payi."
        );
      }

      const records = Array.isArray(data)
        ? data
        : data.liveClasses || data.classes || data.data || [];

      setClasses(records);
    } catch (err) {
      setError(err.message || "Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classNo) loadClasses();
  }, [classNo]);

  return (
    <section className="mt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black tracking-[0.17em] text-indigo-600">
            LIVE LEARNING
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">
            Live Classes
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Attend online classes for Class {classNo}.
          </p>
        </div>

        <button
          onClick={loadClasses}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Loading live classes...
        </div>
      ) : requiresPremium ? (
        <div className="rounded-2xl border border-amber-200 bg-white p-7 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <LockKeyhole size={28} />
          </div>

          <h3 className="mt-4 text-lg font-black text-slate-900">
            Premium Membership Required
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Class {classNo} ki live classes attend karne ke liye
            apni class ki active Premium Membership activate karein.
          </p>

          <Link
            to="/membership"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#172554] px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700"
          >
            Explore Membership
          </Link>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle size={18} />
            Unable to load classes
          </div>
          <p className="mt-2">{error}</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Video className="mx-auto text-slate-300" size={42} />
          <h3 className="mt-3 font-bold text-slate-700">
            No Live Classes Available
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            New classes schedule hone par yahan dikhengi.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((item) => {
            const isLive = item.status === "live";
            const isCompleted = item.status === "completed";
            const meetingLink = item.meetingUrl;
            const recordingLink = item.recordingUrl;

            return (
              <article
                key={item._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Video size={24} />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                      isLive
                        ? "bg-green-50 text-green-700"
                        : isCompleted
                          ? "bg-slate-100 text-slate-600"
                          : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {isLive ? "LIVE NOW" : item.status}
                  </span>
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-900">
                  {item.title}
                </h3>

                <p className="mt-1 text-sm font-semibold text-indigo-600">
                  {item.subject} · Class {item.classNo}
                </p>

                {item.description && (
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>
                )}

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarDays size={16} />
                    {formatDate(item.scheduledAt)}
                  </p>

                  <p className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={16} />
                    {item.durationMinutes} Minutes
                  </p>
                </div>

                {isCompleted ? (
                  recordingLink ? (
                    <a
                      href={recordingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"
                    >
                      Watch Recording
                      <ExternalLink size={16} />
                    </a>
                  ) : (
                    <div className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-500">
                      <CheckCircle2 size={17} />
                      Class Completed
                    </div>
                  )
                ) : meetingLink ? (
                  <a
                    href={meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`mt-5 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white ${
                      isLive
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {isLive ? "Join Live Class" : "Open Meeting Link"}
                    <ExternalLink size={16} />
                  </a>
                ) : (
                  <div className="mt-5 rounded-xl bg-slate-100 px-4 py-3 text-center text-sm font-semibold text-slate-500">
                    Meeting link not available
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
