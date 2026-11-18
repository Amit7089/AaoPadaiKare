
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Crown,
  FileText,
  GraduationCap,
  Languages,
  LoaderCircle,
  LockKeyhole,
  Play,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Trophy,
  Video,
  X,
} from "lucide-react";
import { api } from "../services/api";

const RAZORPAY_SCRIPT =
  "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT}"]`
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(true), {
        once: true,
      });
      existing.addEventListener("error", () => resolve(false), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function getErrorMessage(error) {
  return (
    error?.data?.message ||
    error?.message ||
    "Course load nahi ho paya. Please try again."
  );
}

function money(value) {
  return Number(value || 0).toLocaleString("en-IN");
}

export default function StudentCourseDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  const [language, setLanguage] = useState("Hindi");
  const [expandedSubjects, setExpandedSubjects] = useState({});

  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("success");

  const loadCourse = useCallback(async () => {
    if (!slug) {
      setError("Course URL mein slug nahi mila.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.getCourse(slug, language);

      if (!response?.success || !response?.course?._id) {
        throw new Error(
          response?.message || "Course details nahi mil payi."
        );
      }

      setCourse(response.course);
      setSubjects(
        Array.isArray(response.course.subjects)
          ? response.course.subjects
          : []
      );
      setHasAccess(response.hasAccess === true);
      setLoggedIn(response.loggedIn === true);
      setExpandedSubjects({});
    } catch (err) {
      console.error("Course details error:", err);
      setCourse(null);
      setSubjects([]);
      setHasAccess(false);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [slug, language]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  function showNotice(message, type = "success") {
    setNotice(message);
    setNoticeType(type);
  }

  function toggleSubject(id) {
    setExpandedSubjects((previous) => ({
      ...previous,
      [id]: !previous[id],
    }));
  }

  function openLesson(lesson) {
    if (!lesson?._id) return;

    navigate(
      `/student/courses/${encodeURIComponent(slug)}/lessons/${lesson._id}?language=${encodeURIComponent(language)}`
    );
  }

  async function purchaseCourse() {
    if (!course?._id || paymentLoading) return;

    if (!loggedIn) {
      showNotice(
        "Course purchase karne ke liye pehle login karein.",
        "error"
      );
      return;
    }

    try {
      setPaymentLoading(true);
      setNotice("");

      const loaded = await loadRazorpayScript();

      if (!loaded || !window.Razorpay) {
        throw new Error("Razorpay Checkout load nahi ho paya.");
      }

      const orderResponse = await api.createCourseOrder({
        courseId: course._id,
        language,
      });

      const order = orderResponse?.order;

      if (!orderResponse?.success || !order?.id) {
        throw new Error(
          orderResponse?.message || "Payment order create nahi hua."
        );
      }

      if (!orderResponse.keyId) {
        throw new Error("Razorpay Key ID backend se nahi mili.");
      }

      const checkout = new window.Razorpay({
        key: orderResponse.keyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "Aao Padai Kare",
        description: course.title,
        order_id: order.id,
        theme: { color: "#3155D9" },

        modal: {
          ondismiss: () => setPaymentLoading(false),
        },

        handler: async (paymentResponse) => {
          try {
            setPaymentLoading(true);

            const verification = await api.verifyCoursePayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (!verification?.success) {
              throw new Error(
                verification?.message || "Payment verification failed."
              );
            }

            showNotice(
              "Payment verified! Aapka course access activate ho gaya."
            );

            await loadCourse();
          } catch (err) {
            console.error("Payment verification error:", err);
            showNotice(getErrorMessage(err), "error");
          } finally {
            setPaymentLoading(false);
          }
        },
      });

      checkout.on("payment.failed", (response) => {
        showNotice(
          response.error?.description || "Payment failed. Please try again.",
          "error"
        );
        setPaymentLoading(false);
      });

      checkout.open();
    } catch (err) {
      console.error("Course purchase error:", err);
      showNotice(getErrorMessage(err), "error");
      setPaymentLoading(false);
    }
  }

  const totalLessons = useMemo(
    () =>
      subjects.reduce(
        (total, subject) =>
          total +
          (Array.isArray(subject.lessons) ? subject.lessons.length : 0),
        0
      ),
    [subjects]
  );

  const demoLessons = useMemo(
    () =>
      subjects.reduce(
        (total, subject) =>
          total +
          (subject.lessons || []).filter(
            (lesson) => lesson.accessType === "demo"
          ).length,
        0
      ),
    [subjects]
  );

  const price = Number(course?.price || 0);
  const comparePrice = Number(course?.compareAtPrice || 0);
  const languages = course?.supportedLanguages || ["Hindi"];

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f6f8fc]">
        <div className="text-center">
          <LoaderCircle
            size={38}
            className="mx-auto animate-spin text-blue-600"
          />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Course load ho raha hai...
          </p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#f6f8fc] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <BookOpen size={40} className="mx-auto text-red-500" />
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Course nahi mil paya
          </h2>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={loadCourse}
            className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white"
          >
            Try Again
          </button>
          <div>
            <Link
              to="/student/courses"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700"
            >
              <ArrowLeft size={16} />
              All Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-800">

      {/* TOP BAR */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-7">
          <Link
            to="/student/courses"
            className="flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"
          >
            <ArrowLeft size={17} />
            <span>All Courses</span>
          </Link>

          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <BookOpen size={17} />
            </span>
            Aao Padai Kare
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#111F43] text-white">
        <div className="absolute -right-28 -top-32 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-7 sm:py-14 lg:py-16">
          <div className="grid gap-9 lg:grid-cols-[1fr_280px] lg:items-center">

            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-blue-100">
                  <Trophy size={13} className="mr-1 inline" />
                  COMPETITIVE EXAM
                </span>
                {course.featured && (
                  <span className="rounded-full bg-amber-300/15 px-3 py-1.5 text-amber-200">
                    <Sparkles size={13} className="mr-1 inline" />
                    FEATURED COURSE
                  </span>
                )}
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {course.title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                {course.shortDescription || course.description}
              </p>

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-sm text-blue-100">
                <span className="flex items-center gap-2">
                  <GraduationCap size={17} />
                  Class {(course.targetClasses || []).join(", ") || "All"}
                </span>
                <span className="flex items-center gap-2">
                  <Clock3 size={17} />
                  {course.durationDays || 0} Days
                </span>
                <span className="flex items-center gap-2">
                  <Languages size={17} />
                  {languages.join(" / ")}
                </span>
              </div>
            </div>

            <div className="hidden lg:flex lg:justify-end">
              {course.thumbnailUrl ? (
                <img
                  src={course.thumbnailUrl}
                  alt={course.title}
                  className="h-56 w-56 rounded-3xl border border-white/15 object-cover shadow-2xl"
                />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center rounded-3xl border border-white/15 bg-white/10">
                  <GraduationCap
                    size={112}
                    strokeWidth={1.1}
                    className="text-blue-100"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 lg:py-10">

        {/* NOTIFICATION */}
        {notice && (
          <div
            className={`mb-6 flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
              noticeType === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {notice}
            <button onClick={() => setNotice("")} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}

        {/* QUICK STATS */}
        <section className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-7 sm:grid-cols-4">
          {[
            { label: "Subjects", value: subjects.length, icon: BookOpen },
            { label: "Total lessons", value: totalLessons, icon: FileText },
            { label: "Free demos", value: demoLessons, icon: Play },
            {
              label: "Course duration",
              value: `${course.durationDays || 0} days`,
              icon: Clock3,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3 py-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm ring-1 ring-slate-200">
                  <Icon size={19} />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900">
                    {item.value}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {item.label}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <div className="mt-8 grid items-start gap-9 lg:grid-cols-[minmax(0,1fr)_320px]">

          {/* CURRICULUM COLUMN */}
          <div className="min-w-0">

            {/* CURRICULUM HEADING */}
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-[11px] font-black tracking-[0.18em] text-blue-600">
                  START LEARNING
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Course Curriculum
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Subject choose karein aur apni preparation shuru karein.
                </p>
              </div>

              <div className="flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
                {languages.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      if (item !== language) {
                        setLanguage(item);
                        setNotice("");
                      }
                    }}
                    className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                      language === item
                        ? "bg-[#172554] text-white shadow-sm"
                        : "text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* LESSON LEGEND */}
            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Free demo
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Premium lesson
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Unlocked
              </span>
            </div>

            {/* SUBJECT LIST */}
            <div className="mt-6 space-y-3">
              {subjects.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                  <BookOpen
                    size={38}
                    className="mx-auto text-slate-300"
                  />
                  <h3 className="mt-4 font-black text-slate-800">
                    No subjects available
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Is language mein abhi subjects upload nahi hue hain.
                  </p>
                </div>
              ) : (
                subjects.map((subject, index) => {
                  const lessons = Array.isArray(subject.lessons)
                    ? subject.lessons
                    : [];
                  const expanded = !!expandedSubjects[subject._id];

                  const freeCount = lessons.filter(
                    (lesson) => lesson.accessType === "demo"
                  ).length;

                  return (
                    <section
                      key={subject._id}
                      className={`overflow-hidden rounded-2xl border bg-white transition ${
                        expanded
                          ? "border-blue-200 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <button
                        onClick={() => toggleSubject(subject._id)}
                        className="flex w-full items-center gap-4 px-4 py-4 text-left sm:px-5"
                      >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eef3ff] text-sm font-black text-blue-700">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block font-extrabold text-slate-900">
                            {subject.name}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {lessons.length} lessons
                            {freeCount > 0 && ` · ${freeCount} free`}
                          </span>
                        </span>

                        <span className="hidden rounded-lg bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500 sm:block">
                          {lessons.length} Lessons
                        </span>

                        {expanded ? (
                          <ChevronDown
                            size={20}
                            className="shrink-0 text-blue-600"
                          />
                        ) : (
                          <ChevronRight
                            size={20}
                            className="shrink-0 text-slate-400"
                          />
                        )}
                      </button>

                      {expanded && (
                        <div className="border-t border-slate-100">
                          {lessons.length === 0 ? (
                            <p className="px-5 py-5 text-sm text-slate-500">
                              Is subject mein abhi lessons available nahi hain.
                            </p>
                          ) : (
                            lessons.map((lesson, lessonIndex) => {
                              const isDemo =
                                lesson.accessType === "demo";
                              const unlocked = isDemo || hasAccess;

                              return (
                                <div
                                  key={lesson._id}
                                  className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                                >
                                  <div className="flex min-w-0 items-center gap-3">
                                    <div
                                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                        unlocked
                                          ? "bg-emerald-50 text-emerald-600"
                                          : "bg-amber-50 text-amber-600"
                                      }`}
                                    >
                                      {unlocked ? (
                                        <Play size={17} />
                                      ) : (
                                        <LockKeyhole size={16} />
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-bold text-slate-800">
                                        {lesson.title}
                                      </p>
                                      <p className="mt-1 text-xs text-slate-400">
                                        {lesson.chapter ||
                                          `Lesson ${lessonIndex + 1}`}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                                    {isDemo ? (
                                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black tracking-wide text-emerald-700">
                                        FREE DEMO
                                      </span>
                                    ) : unlocked ? (
                                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black tracking-wide text-blue-700">
                                        UNLOCKED
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black tracking-wide text-amber-700">
                                        PREMIUM
                                      </span>
                                    )}

                                    {unlocked ? (
                                      <button
                                        onClick={() => openLesson(lesson)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#172554] px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700"
                                      >
                                        Open Lesson
                                        <ArrowRight size={14} />
                                      </button>
                                    ) : (
                                      <button
                                        onClick={purchaseCourse}
                                        disabled={paymentLoading}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3.5 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50 disabled:opacity-50"
                                      >
                                        <LockKeyhole size={13} />
                                        Unlock
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </section>
                  );
                })
              )}
            </div>

            {/* ABOUT COURSE */}
            {course.description && (
              <section className="mt-9 border-t border-slate-200 pt-7">
                <h2 className="text-xl font-black text-slate-900">
                  About this course
                </h2>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {course.description}
                </p>
              </section>
            )}

            {course.eligibility && (
              <section className="mt-7 rounded-xl bg-white p-5 ring-1 ring-slate-200">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <GraduationCap size={20} className="text-blue-600" />
                  Eligibility
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {course.eligibility}
                </p>
              </section>
            )}
          </div>

          {/* PURCHASE SIDEBAR */}
          <aside className="space-y-5 lg:sticky lg:top-6">

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-[#172554] px-5 py-5 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider text-blue-200">
                    COURSE ENROLLMENT
                  </span>
                  <Crown size={21} className="text-amber-300" />
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-black">
                    {price === 0 ? "FREE" : `₹${money(price)}`}
                  </span>

                  {comparePrice > price && (
                    <span className="text-sm text-blue-200 line-through">
                      ₹{money(comparePrice)}
                    </span>
                  )}
                </div>

                {comparePrice > price && price > 0 && (
                  <p className="mt-2 text-xs font-semibold text-emerald-300">
                    Save ₹{money(comparePrice - price)}
                  </p>
                )}

                <p className="mt-3 text-xs text-blue-200">
                  {course.durationDays || 0} days course validity
                </p>
              </div>

              <div className="p-5">
                {hasAccess ? (
                  <div className="rounded-xl bg-emerald-50 p-4">
                    <div className="flex items-center gap-2 font-black text-emerald-700">
                      <CheckCircle2 size={19} />
                      You are enrolled
                    </div>
                    <p className="mt-2 text-xs leading-5 text-emerald-700">
                      Premium lessons ka access aapke account mein active hai.
                    </p>
                  </div>
                ) : price === 0 ? (
                  <div className="rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                    This course is free.
                  </div>
                ) : (
                  <button
                    onClick={purchaseCourse}
                    disabled={paymentLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {paymentLoading ? (
                      <>
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        Enroll Now
                      </>
                    )}
                  </button>
                )}

                <p className="mt-3 text-center text-[11px] text-slate-400">
                  Secure payment powered by Razorpay
                </p>

                <div className="mt-5 space-y-3 border-t border-slate-100 pt-5">
                  {[
                    [CheckCircle2, "Free demo lessons"],
                    [Languages, "Hindi & English"],
                    [Video, "Video lectures"],
                    [FileText, "PDF study material"],
                    [ShieldCheck, "Secure course access"],
                  ].map(([Icon, label]) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 text-xs font-semibold text-slate-600"
                    >
                      <Icon size={17} className="text-blue-600" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* STUDY TIP */}
            <section className="rounded-2xl border border-blue-100 bg-[#edf3ff] p-5">
              <div className="flex items-center gap-2 text-blue-800">
                <Sparkles size={18} />
                <h3 className="text-sm font-black">Study smarter</h3>
              </div>
              <p className="mt-3 text-xs leading-6 text-slate-600">
                Pehle free demo lessons complete karein. Phir premium course
                unlock karke complete preparation karein.
              </p>
              <Link
                to="/student/courses"
                className="mt-4 inline-flex items-center gap-2 text-xs font-black text-blue-700 hover:text-blue-900"
              >
                Explore other courses
                <ArrowRight size={15} />
              </Link>
            </section>
          </aside>
        </div>

        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Aao Padai Kare
          <span className="mx-2">·</span>
          Learn Today, Lead Tomorrow.
        </footer>
      </main>
    </div>
  );
}
