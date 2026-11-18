import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  NotebookText,
  FileText,
  ClipboardCheck,
  ClipboardList,
  History,
  Crown,
  ArrowUpRight,
  ArrowRight,
  UserRound,
  Mail,
  Phone,
  LogOut,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CalendarDays,
  Menu,
  X,
  ChevronRight,
  Trophy,
  Star,
} from "lucide-react";
import StudentProgressOverview from "../components/StudentProgressOverview";
import LiveClassesSection from "../components/LiveClassesSection";
import { api, clearStudentToken } from "../services/api";

// STUDENT SIDEBAR NAVIGATION
const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Explore Classes", to: "/classes", icon: GraduationCap },
  { label: "Study Notes", to: "/notes", icon: NotebookText },
  { label: "Question Papers", to: "/question-papers", icon: FileText },
  { label: "Competitive Courses", to: "/student/courses", icon: Trophy },
  { label: "Practice Quiz", to: "/quiz", icon: ClipboardCheck },
  { label: "Online Quizzes", to: "/student/quizzes", icon: ClipboardList },
  { label: "Quiz History", to: "/student/quiz-history", icon: History },
];

// DASHBOARD LEARNING CARDS
const learningCards = [
  {
    number: "01",
    title: "Explore Classes",
    description: "Apne syllabus ke subjects aur chapters explore karein.",
    to: "/classes",
    icon: GraduationCap,
    color: "bg-blue-50 text-blue-700",
  },
  {
    number: "02",
    title: "Study Notes",
    description: "Chapter-wise notes se apni preparation strong banayein.",
    to: "/notes",
    icon: NotebookText,
    color: "bg-violet-50 text-violet-700",
  },
  {
    number: "03",
    title: "Previous Year Papers",
    description:
      "Previous year solved aur unsolved papers se exam ki practice karein.",
    to: "/question-papers",
    icon: FileText,
    color: "bg-amber-50 text-amber-700",
  },
  {
    number: "04",
    title: "Competitive Courses",
    description: "NMMS, Navodaya aur Scholarship exams ki preparation karein.",
    to: "/student/courses",
    icon: Trophy,
    color: "bg-amber-50 text-amber-700",
  },
  {
    number: "05",
    title: "Practice Quiz",
    description: "Questions solve karein aur apni knowledge test karein.",
    to: "/quiz",
    icon: ClipboardCheck,
    color: "bg-emerald-50 text-emerald-700",
  },
  {
    number: "06",
    title: "Online Quizzes & Tests",
    description:
      "Apni class ke online MCQ tests attempt karein aur result dekhein.",
    to: "/student/quizzes",
    icon: ClipboardList,
    color: "bg-indigo-50 text-indigo-700",
  },
];

function formatDate(date) {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ACTIVE NAVIGATION CHECK
function isNavigationActive(item, pathname) {
  if (item.to === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/student/dashboard";
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

  // FETCH STUDENT PROFILE
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

  // LOGOUT
  function handleLogout() {
    clearStudentToken();
    navigate("/login", { replace: true });
  }

  // CLOSE MOBILE MENU AFTER NAVIGATION
  useEffect(() => {
    setMobileMenu(false);
  }, [location.pathname]);

  // LOADING
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc]">
        <div className="text-center">
          <LoaderCircle
            className="mx-auto animate-spin text-indigo-600"
            size={40}
          />
          <p className="mt-4 text-sm font-semibold text-slate-500">
            Preparing your learning space...
          </p>
        </div>
      </div>
    );
  }

  // ERROR
  if (error || !student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fc] px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <UserRound className="mx-auto text-indigo-600" size={42} />

          <h2 className="mt-4 text-xl font-black text-slate-900">
            Profile load nahi hui
          </h2>

          <p className="mt-2 text-sm text-red-600">
            {error || "Please dobara login karein."}
          </p>

          <button
            onClick={fetchStudent}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white"
          >
            <RefreshCw size={17} />
            Try Again
          </button>

          <button
            onClick={handleLogout}
            className="mt-3 block w-full rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-600"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const studentName = student.name || "Student";
  const studentClass = student.classNo || "";
  const firstName = studentName.trim().split(" ")[0];

  const activeMemberships = (student.memberships || []).filter(
    (item) =>
      item.status === "active" &&
      item.expiresAt &&
      new Date(item.expiresAt) > new Date(),
  );

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-slate-800">
      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <BookOpen size={22} />
          </div>

          <div>
            <p className="font-black text-slate-900">Aao Padai Kare</p>
            <p className="text-[10px] font-bold tracking-widest text-slate-400">
              LEARN EVERY DAY
            </p>
          </div>
        </Link>

        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="rounded-xl border border-slate-200 p-2"
          aria-label="Toggle menu"
        >
          {mobileMenu ? <X size={21} /> : <Menu size={21} />}
        </button>
      </header>

      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-7 lg:flex">
          <Link to="/dashboard" className="flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
              <BookOpen size={24} />
            </div>

            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                Aao Padai Kare
              </h2>
              <p className="text-[10px] font-bold tracking-[0.15em] text-slate-400">
                LEARN EVERY DAY
              </p>
            </div>
          </Link>

          <div className="mt-12">
            <p className="mb-4 px-3 text-[10px] font-extrabold tracking-[0.18em] text-slate-400">
              LEARNING MENU
            </p>

            <nav className="space-y-1.5">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isNavigationActive(item, location.pathname);

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={19} />
                    {item.label}

                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* PREMIUM CARD */}
          <div className="mt-10 rounded-2xl bg-gradient-to-br from-indigo-700 to-blue-600 p-4 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Crown size={20} />
            </div>

            <h3 className="mt-4 font-black">Go Premium</h3>

            <p className="mt-1 text-xs leading-5 text-indigo-100">
              Unlock more learning resources for your class.
            </p>

            <Link
              to="/membership"
              className="mt-4 flex items-center justify-between rounded-lg bg-white px-3 py-2.5 text-xs font-extrabold text-indigo-700 hover:bg-indigo-50"
            >
              View Membership
              <ArrowUpRight size={16} />
            </Link>
          </div>

          {/* STUDENT ACCOUNT */}
          <div className="mt-auto border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-black text-indigo-700">
                {firstName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-extrabold text-slate-900">
                  {studentName}
                </p>
                <p className="text-xs text-slate-400">Class {studentClass}</p>
              </div>

              <button
                onClick={handleLogout}
                title="Logout"
                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </aside>

        {/* MOBILE NAVIGATION */}
        {mobileMenu && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/30 lg:hidden"
            onClick={() => setMobileMenu(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-[280px] overflow-y-auto bg-white p-5 pt-20 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="text-xs font-black tracking-widest text-slate-400">
                  NAVIGATION
                </p>

                <button
                  onClick={() => setMobileMenu(false)}
                  className="rounded-lg p-2 hover:bg-slate-100"
                >
                  <X size={19} />
                </button>
              </div>

              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isNavigationActive(item, location.pathname);

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    onClick={() => setMobileMenu(false)}
                    className={`mb-2 flex items-center gap-3 rounded-xl px-3 py-3 font-bold transition ${
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    <Icon size={19} />
                    {item.label}

                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-indigo-600" />
                    )}
                  </Link>
                );
              })}

              <Link
                to="/membership"
                onClick={() => setMobileMenu(false)}
                className="mt-5 flex items-center gap-3 rounded-xl bg-amber-50 px-3 py-3 font-bold text-amber-700"
              >
                <Crown size={19} />
                Membership
              </Link>

              <button
                onClick={handleLogout}
                className="mt-8 flex w-full items-center gap-3 rounded-xl px-3 py-3 font-bold text-red-600 hover:bg-red-50"
              >
                <LogOut size={19} />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1450px] px-4 py-6 sm:px-7 sm:py-8 lg:px-10">
            {/* PAGE HEADER */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">
                  Monday to Sunday · Your learning journey
                </p>

                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  Dashboard
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Welcome back, {firstName}. Let's make today productive.
                </p>
              </div>

              <Link
                to="/student/profile"
                className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm hover:border-indigo-200 hover:text-indigo-700"
              >
                <UserRound size={17} />
                My Profile
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* HERO */}
            <section className="relative overflow-hidden rounded-[28px] bg-[#172554] px-6 py-8 text-white sm:px-9 sm:py-10">
              <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
              <div className="absolute -bottom-24 right-1/3 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />

              <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold tracking-wider text-indigo-100">
                    <Sparkles size={14} />
                    YOUR PERSONAL LEARNING SPACE
                  </div>

                  <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                    Learn Better.
                    <br />
                    Achieve More.
                  </h2>

                  <p className="mt-4 max-w-lg text-sm leading-7 text-indigo-100">
                    Har chapter ke saath apni knowledge badhayein. Consistent
                    learning se apne goals ko achieve karein.
                  </p>

                  <Link
                    to={`/notes?class=${studentClass}`}
                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-indigo-800 shadow-lg transition hover:-translate-y-0.5 hover:bg-indigo-50"
                  >
                    Continue Learning
                    <ArrowRight size={17} />
                  </Link>
                </div>

                <div className="hidden h-40 w-40 items-center justify-center rounded-[32px] border border-white/15 bg-white/10 md:flex">
                  <GraduationCap size={100} strokeWidth={1.2} />
                </div>
              </div>
            </section>

            {/* OVERVIEW */}
            <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    <GraduationCap size={22} />
                  </div>

                  <span className="text-xs font-bold text-slate-400">
                    STUDENT
                  </span>
                </div>

                <p className="mt-5 text-sm font-semibold text-slate-500">
                  Your Registered Class
                </p>

                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  Class {studentClass}
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                    <BookOpen size={22} />
                  </div>

                  <span className="text-xs font-bold text-slate-400">
                    MP BOARD
                  </span>
                </div>

                <p className="mt-5 text-sm font-semibold text-slate-500">
                  Available Classes
                </p>

                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  6 – 12
                </h3>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
                    <ShieldCheck size={22} />
                  </div>

                  <span className="text-xs font-bold text-slate-400">
                    PREMIUM
                  </span>
                </div>

                <p className="mt-5 text-sm font-semibold text-slate-500">
                  Active Memberships
                </p>

                <h3 className="mt-1 text-2xl font-black text-slate-900">
                  {activeMemberships.length}
                </h3>
              </div>
            </section>

            {/* MEMBERSHIP */}
            <section className="mt-8 overflow-hidden rounded-[26px] border border-amber-200 bg-white shadow-sm">
              <div className="grid md:grid-cols-[1fr_auto]">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                      <Crown size={25} />
                    </div>

                    <div>
                      <p className="text-[10px] font-black tracking-[0.16em] text-amber-700">
                        MEMBERSHIP CENTER
                      </p>

                      <h2 className="mt-1 text-xl font-black text-slate-900">
                        {activeMemberships.length
                          ? "Your Premium Learning"
                          : "Take Your Learning Further"}
                      </h2>
                    </div>
                  </div>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-slate-500">
                    {activeMemberships.length
                      ? "Aapki active memberships aur unki validity yahan check karein."
                      : "Apni class ke premium notes aur locked study resources unlock karne ke liye membership explore karein."}
                  </p>

                  {activeMemberships.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-3">
                      {activeMemberships.map((item) => (
                        <div
                          key={item.classNo}
                          className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-800">
                            <Star size={15} />
                            Class {item.classNo} · {item.plan}
                          </div>

                          <p className="mt-1 text-xs text-emerald-700">
                            Valid till {formatDate(item.expiresAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={15} className="text-emerald-600" />
                        Secure payment
                      </span>

                      <span className="flex items-center gap-1.5">
                        <BookOpen size={15} className="text-indigo-600" />
                        Class-wise access
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-center border-t border-amber-100 bg-amber-50/60 p-6 md:w-64 md:border-l md:border-t-0">
                  <Link
                    to="/membership"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#172554] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg transition hover:bg-indigo-700"
                  >
                    {activeMemberships.length
                      ? "Manage Membership"
                      : "Explore Plans"}
                    <ArrowUpRight size={17} />
                  </Link>
                </div>
              </div>
            </section>

            {/* STUDENT PERFORMANCE */}
            <StudentProgressOverview />

            {/* LIVE CLASSES */}
            <LiveClassesSection classNo={studentClass} />

            {/* LEARNING SECTION */}
            <section className="mt-10">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-black tracking-[0.17em] text-indigo-600">
                    GET STARTED
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-900">
                    Your Learning Activities
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Everything you need for your studies, in one place.
                  </p>
                </div>
              </div>

              {/* RESPONSIVE LEARNING CARDS */}
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {learningCards.map((card) => {
                  const Icon = card.icon;

                  const destination =
                    card.title === "Study Notes"
                      ? `/notes?class=${studentClass}`
                      : card.to;

                  return (
                    <Link
                      key={card.number}
                      to={destination}
                      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className={`rounded-2xl p-3 ${card.color}`}>
                          <Icon size={25} />
                        </div>

                        <span className="text-xs font-black tracking-widest text-slate-300">
                          {card.number}
                        </span>
                      </div>

                      <h3 className="mt-6 text-lg font-black text-slate-900">
                        {card.title}
                      </h3>

                      <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                        {card.description}
                      </p>

                      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-sm font-extrabold text-indigo-700">
                        Open Section
                        <span className="rounded-full bg-indigo-50 p-2 transition group-hover:bg-indigo-600 group-hover:text-white">
                          <ArrowRight size={16} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* QUIZ QUICK ACCESS */}
            <section className="mt-8 grid gap-4 sm:grid-cols-2">
              <Link
                to="/student/quizzes"
                className="group flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50 p-5 transition hover:border-indigo-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-white p-3 text-indigo-700">
                    <ClipboardList size={24} />
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900">
                      Online Quizzes
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Available tests attempt karein.
                    </p>
                  </div>
                </div>

                <ArrowRight className="text-indigo-700 transition group-hover:translate-x-1" />
              </Link>

              <Link
                to="/student/quiz-history"
                className="group flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-5 transition hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-white p-3 text-emerald-700">
                    <History size={24} />
                  </div>

                  <div>
                    <h3 className="font-black text-slate-900">Quiz History</h3>

                    <p className="mt-1 text-xs text-slate-500">
                      Apne previous attempts aur results dekhein.
                    </p>
                  </div>
                </div>

                <ArrowRight className="text-emerald-700 transition group-hover:translate-x-1" />
              </Link>
            </section>

            {/* PROFILE */}
            <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-[10px] font-black tracking-[0.17em] text-indigo-600">
                    ACCOUNT INFORMATION
                  </p>

                  <h2 className="mt-2 text-xl font-black text-slate-900">
                    Student Profile
                  </h2>
                </div>

                <Link
                  to="/student/profile"
                  className="inline-flex items-center gap-2 text-sm font-extrabold text-indigo-700 hover:text-indigo-900"
                >
                  Edit Profile
                  <ArrowUpRight size={16} />
                </Link>
              </div>

              <div className="mt-6 grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-slate-600">
                    <UserRound size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400">Name</p>

                    <p className="mt-1 truncate text-sm font-bold text-slate-800">
                      {studentName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-slate-600">
                    <Mail size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-bold text-slate-800">
                      {student.email || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-slate-600">
                    <Phone size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Mobile
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {student.mobile || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-50 p-3 text-slate-600">
                    <CalendarDays size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400">
                      Class
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-800">
                      Class {studentClass}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 py-6 text-xs font-medium text-slate-400 sm:flex-row">
              <p>© {new Date().getFullYear()} Aao Padai Kare</p>

              <p className="flex items-center gap-2">
                <Trophy size={14} />
                Learn Today, Lead Tomorrow.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
