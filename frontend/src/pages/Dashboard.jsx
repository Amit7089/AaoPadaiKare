
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
  PlayCircle,
  Target,
  Zap,
  Bell,
  Search,
  BookMarked,
} from "lucide-react";

import StudentProgressOverview from "../components/StudentProgressOverview";
import LiveClassesSection from "../components/LiveClassesSection";
import { api, clearStudentToken } from "../services/api";

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

const learningCards = [
  {
    title: "Study Notes",
    subtitle: "अध्यायवार पढ़ाई",
    description: "अपने सभी विषयों के नोट्स पढ़ें।",
    to: "/notes",
    icon: NotebookText,
    color: "bg-blue-50 text-blue-700",
    number: "01",
  },
  {
    title: "Explore Classes",
    subtitle: "सिलेबस एक्सप्लोर करें",
    description: "विषय और अध्याय की जानकारी पाएं।",
    to: "/classes",
    icon: GraduationCap,
    color: "bg-violet-50 text-violet-700",
    number: "02",
  },
  {
    title: "Question Papers",
    subtitle: "परीक्षा की तैयारी",
    description: "पिछले वर्षों के पेपर हल करें।",
    to: "/question-papers",
    icon: FileText,
    color: "bg-amber-50 text-amber-700",
    number: "03",
  },
  {
    title: "Competitive Courses",
    subtitle: "नई चुनौतियों की तैयारी",
    description: "NMMS, Navodaya और Scholarship।",
    to: "/student/courses",
    icon: Trophy,
    color: "bg-orange-50 text-orange-700",
    number: "04",
  },
  {
    title: "Practice Quiz",
    subtitle: "खुद को परखें",
    description: "प्रश्न हल करें और अभ्यास बढ़ाएं।",
    to: "/quiz",
    icon: ClipboardCheck,
    color: "bg-emerald-50 text-emerald-700",
    number: "05",
  },
  {
    title: "Online Tests",
    subtitle: "अपना टेस्ट दें",
    description: "ऑनलाइन टेस्ट और परिणाम देखें।",
    to: "/student/quizzes",
    icon: ClipboardList,
    color: "bg-indigo-50 text-indigo-700",
    number: "06",
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

function isNavigationActive(item, pathname) {
  if (item.to === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/student/dashboard";
  }

  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

function SectionTitle({ label, title, description, action }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {label && (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-700">
            {label}
          </p>
        )}
        <h2 className="mt-1.5 text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

function StatItem({ icon: Icon, label, value, note, color }) {
  return (
    <div className="flex min-w-0 items-center gap-3 border-b border-slate-100 py-4 last:border-0 sm:border-b-0 sm:border-r sm:px-4 sm:py-2 sm:last:border-0">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon size={21} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="mt-0.5 truncate text-xl font-black text-slate-900">
          {value}
        </p>
        {note && <p className="mt-0.5 text-[10px] text-slate-400">{note}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);

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

  useEffect(() => {
    setMobileMenu(false);
  }, [location.pathname]);

  function handleLogout() {
    clearStudentToken();
    navigate("/login", { replace: true });
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fc]">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <LoaderCircle size={30} className="animate-spin text-blue-700" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-500">
            आपका Dashboard तैयार हो रहा है...
          </p>
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f7fc] px-4">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <UserRound className="mx-auto text-blue-700" size={42} />
          <h2 className="mt-4 text-xl font-black text-slate-900">
            Profile लोड नहीं हुई
          </h2>
          <p className="mt-2 text-sm text-red-600">
            {error || "Please dobara login karein."}
          </p>
          <button
            onClick={fetchStudent}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white"
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
      new Date(item.expiresAt) > new Date()
  );

  return (
    <div className="min-h-screen bg-[#f4f7fc] text-slate-800">

      {/* MOBILE HEADER */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d4ed8] text-white shadow-md shadow-blue-200">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-sm font-black text-slate-900">Aao Padai Kare</p>
            <p className="text-[9px] font-bold tracking-[0.15em] text-slate-400">
              MP BOARD LEARNING
            </p>
          </div>
        </Link>

        <button
          onClick={() => setMobileMenu(!mobileMenu)}
          className="rounded-xl border border-slate-200 p-2.5 text-slate-700"
          aria-label="Toggle menu"
        >
          {mobileMenu ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <div className="flex min-h-screen">

        {/* DESKTOP SIDEBAR */}
        <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
          <Link to="/dashboard" className="flex items-center gap-3 px-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1d4ed8] text-white shadow-lg shadow-blue-200">
              <BookOpen size={24} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900">
                Aao Padai Kare
              </h2>
              <p className="text-[9px] font-bold tracking-[0.15em] text-slate-400">
                MP BOARD LEARNING
              </p>
            </div>
          </Link>

          <div className="mt-10">
            <p className="mb-3 px-3 text-[10px] font-black tracking-[0.18em] text-slate-400">
              LEARNING MENU
            </p>
            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isNavigationActive(item, location.pathname);

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-bold transition ${
                      active
                        ? "bg-blue-700 text-white shadow-md shadow-blue-100"
                        : "text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                    {active && <ChevronRight size={16} className="ml-auto" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* PREMIUM SIDEBAR */}
          <div className="relative mt-8 overflow-hidden rounded-2xl bg-[#14264f] p-4 text-white">
            <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-blue-400/20 blur-2xl" />
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Crown size={19} />
              </div>
              <h3 className="mt-4 font-black">Go Premium</h3>
              <p className="mt-1 text-xs leading-5 text-blue-100">
                अपनी क्लास के Premium Notes और Resources अनलॉक करें।
              </p>
              <Link
                to="/membership"
                className="mt-4 flex items-center justify-between rounded-lg bg-white px-3 py-2.5 text-xs font-extrabold text-blue-800 hover:bg-blue-50"
              >
                Membership देखें
                <ArrowUpRight size={15} />
              </Link>
            </div>
          </div>

          {/* ACCOUNT */}
          <div className="mt-auto border-t border-slate-100 pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 font-black text-blue-800">
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

        {/* MOBILE MENU */}
        {mobileMenu && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenu(false)}
          >
            <div
              className="absolute right-0 top-0 h-full w-[290px] max-w-[88vw] overflow-y-auto bg-white p-5 pt-20 shadow-2xl"
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
                    className={`mb-1.5 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${
                      active
                        ? "bg-blue-700 text-white"
                        : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    <Icon size={19} />
                    {item.label}
                    {active && <ChevronRight size={16} className="ml-auto" />}
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
                className="mt-5 flex w-full items-center gap-3 rounded-xl px-3 py-3 font-bold text-red-600 hover:bg-red-50"
              >
                <LogOut size={19} />
                Logout
              </button>
            </div>
          </div>
        )}

        {/* MAIN CONTENT */}
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1500px] px-4 py-5 sm:px-7 sm:py-8 xl:px-10">

            {/* TOP BAR */}
            <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-blue-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  STUDENT LEARNING PORTAL
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  आपका Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  आपकी पढ़ाई, टेस्ट और प्रोग्रेस का एक ही स्थान।
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-500 sm:block">
                  <CalendarDays size={15} className="mr-2 inline text-blue-700" />
                  MP Board · Class {studentClass}
                </div>
                <Link
                  to="/student/profile"
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-blue-200 hover:text-blue-700"
                >
                  <UserRound size={17} />
                  <span>Profile</span>
                </Link>
              </div>
            </div>

            {/* HERO */}
            <section className="relative overflow-hidden rounded-[28px] bg-[#14264f] shadow-xl shadow-blue-950/10">
              <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
              <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-indigo-400/20 blur-3xl" />
              <div className="absolute right-16 top-12 hidden h-48 w-48 rounded-full border border-white/10 lg:block" />
              <div className="absolute right-24 top-20 hidden h-32 w-32 rounded-full border border-white/10 lg:block" />

              <div className="relative grid gap-8 px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[1fr_280px] lg:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-wider text-blue-100">
                    <Sparkles size={13} />
                    WELCOME TO YOUR LEARNING SPACE
                  </div>

                  <h2 className="mt-5 text-3xl font-black leading-tight text-white sm:text-4xl lg:text-[42px]">
                    नमस्ते, {firstName}!
                    <br />
                    <span className="text-blue-300">
                      चलिए आज कुछ नया सीखते हैं।
                    </span>
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100 sm:text-base">
                    हर दिन थोड़ा सीखें, नियमित अभ्यास करें और अपने सपनों की
                    ओर आगे बढ़ें। आपकी सफलता की शुरुआत आज से होती है।
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/notes?class=${studentClass}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                    >
                      पढ़ाई शुरू करें
                      <ArrowRight size={17} />
                    </Link>
                    <Link
                      to="/student/quizzes"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
                    >
                      <PlayCircle size={17} />
                      Online Tests
                    </Link>
                  </div>
                </div>

                <div className="hidden lg:block">
                  <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                        <GraduationCap size={28} />
                      </div>
                      <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-black text-emerald-200">
                        MP BOARD
                      </span>
                    </div>
                    <p className="mt-7 text-xs font-semibold text-blue-200">
                      YOUR REGISTERED CLASS
                    </p>
                    <p className="mt-1 text-4xl font-black text-white">
                      Class {studentClass}
                    </p>
                    <div className="mt-5 border-t border-white/15 pt-4">
                      <p className="text-xs text-blue-100">
                        Aao Padai Kare · Learn Every Day
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* QUICK STATS */}
            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white px-4 shadow-sm sm:px-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
                <StatItem
                  icon={GraduationCap}
                  label="आपकी Registered Class"
                  value={`Class ${studentClass}`}
                  note="Student account"
                  color="bg-blue-50 text-blue-700"
                />
                <StatItem
                  icon={BookOpen}
                  label="Available Classes"
                  value="6 – 12"
                  note="MP Board syllabus"
                  color="bg-violet-50 text-violet-700"
                />
                <StatItem
                  icon={ShieldCheck}
                  label="Active Memberships"
                  value={activeMemberships.length}
                  note="Class-wise access"
                  color="bg-amber-50 text-amber-700"
                />
                <StatItem
                  icon={Target}
                  label="Learning Goal"
                  value="Learn Daily"
                  note="Keep moving forward"
                  color="bg-emerald-50 text-emerald-700"
                />
              </div>
            </section>

            {/* MEMBERSHIP */}
            <section className="relative mt-8 overflow-hidden rounded-[25px] bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#1d4ed8] p-6 text-white shadow-lg shadow-blue-900/10 sm:p-8">
              <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border-[35px] border-white/5" />
              <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                      <Crown size={25} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black tracking-[0.17em] text-blue-200">
                        MEMBERSHIP CENTER
                      </p>
                      <h2 className="mt-1 text-xl font-black sm:text-2xl">
                        {activeMemberships.length
                          ? "आपकी Premium Membership"
                          : "अपनी पढ़ाई को एक कदम आगे बढ़ाएं"}
                      </h2>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-blue-100">
                    {activeMemberships.length
                      ? "अपनी Active Membership और उसकी वैधता यहाँ देखें।"
                      : "Premium Notes और Locked Study Resources को अनलॉक करके अपनी तैयारी मजबूत बनाएं।"}
                  </p>

                  {activeMemberships.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {activeMemberships.map((item) => (
                        <div
                          key={item.classNo}
                          className="rounded-xl border border-white/20 bg-white/10 px-4 py-3"
                        >
                          <div className="flex items-center gap-2 text-sm font-extrabold">
                            <Star size={15} />
                            Class {item.classNo} · {item.plan}
                          </div>
                          <p className="mt-1 text-xs text-blue-100">
                            Valid till {formatDate(item.expiresAt)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-blue-100">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck size={15} />
                        Secure Payment
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={15} />
                        Class-wise Access
                      </span>
                    </div>
                  )}
                </div>

                <Link
                  to="/membership"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-extrabold text-blue-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-50"
                >
                  {activeMemberships.length ? "Manage Membership" : "Explore Plans"}
                  <ArrowUpRight size={17} />
                </Link>
              </div>
            </section>

            {/* PERFORMANCE */}
            <section className="mt-10">
              <StudentProgressOverview />
            </section>

            {/* LIVE CLASSES */}
            <section className="mt-10">
              <LiveClassesSection classNo={studentClass} />
            </section>

            {/* LEARNING HUB */}
            <section className="mt-11">
              <SectionTitle
                label="YOUR LEARNING HUB"
                title="पढ़ाई के सभी विकल्प"
                description="अपनी जरूरत के अनुसार कोई भी Learning Section चुनें।"
              />

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                      className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/40"
                    >
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${card.color}`}>
                        <Icon size={23} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-sm font-black text-slate-900">
                            {card.title}
                          </h3>
                          <span className="text-[10px] font-black text-slate-300">
                            {card.number}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] font-bold text-blue-700">
                          {card.subtitle}
                        </p>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {card.description}
                        </p>
                        <div className="mt-4 flex items-center gap-1 text-xs font-extrabold text-blue-700">
                          Open Section
                          <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* TEST CENTER */}
            <section className="mt-10">
              <SectionTitle
                label="PRACTICE & IMPROVE"
                title="Test & Result Center"
                description="अभ्यास करें, टेस्ट दें और अपनी Performance देखें।"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Link
                  to="/student/quizzes"
                  className="group relative overflow-hidden rounded-2xl border border-blue-100 bg-[#edf4ff] p-5 transition hover:border-blue-300 hover:shadow-md"
                >
                  <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-blue-100" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
                        <Zap size={22} />
                      </div>
                      <h3 className="mt-4 font-black text-slate-900">
                        Online Quizzes
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        उपलब्ध टेस्ट हल करें।
                      </p>
                    </div>
                    <ArrowRight className="text-blue-700 transition group-hover:translate-x-1" />
                  </div>
                </Link>

                <Link
                  to="/student/quiz-history"
                  className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-[#effbf5] p-5 transition hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="absolute -right-5 -top-8 h-28 w-28 rounded-full bg-emerald-100" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
                        <History size={22} />
                      </div>
                      <h3 className="mt-4 font-black text-slate-900">
                        Quiz History
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        अपने पिछले टेस्ट के परिणाम देखें।
                      </p>
                    </div>
                    <ArrowRight className="text-emerald-700 transition group-hover:translate-x-1" />
                  </div>
                </Link>
              </div>
            </section>

            {/* PROFILE */}
            <section className="mt-10 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-7">
                <div>
                  <p className="text-[10px] font-black tracking-[0.17em] text-blue-700">
                    ACCOUNT INFORMATION
                  </p>
                  <h2 className="mt-1 text-xl font-black text-slate-900">
                    Student Profile
                  </h2>
                </div>
                <Link
                  to="/student/profile"
                  className="inline-flex items-center gap-2 text-sm font-extrabold text-blue-700 hover:text-blue-900"
                >
                  Edit Profile
                  <ArrowUpRight size={16} />
                </Link>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                    <UserRound size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400">Name</p>
                    <p className="mt-1 truncate text-sm font-bold text-slate-800">
                      {studentName}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                    <Mail size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-400">Email</p>
                    <p className="mt-1 break-all text-sm font-bold text-slate-800">
                      {student.email || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Mobile</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      {student.mobile || "Not available"}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-0 items-center gap-3">
                  <div className="rounded-xl bg-amber-50 p-3 text-amber-700">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">Class</p>
                    <p className="mt-1 text-sm font-bold text-slate-800">
                      Class {studentClass}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* FOOTER */}
            <footer className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200 py-6 text-xs font-medium text-slate-400 sm:flex-row">
              <p>© {new Date().getFullYear()} Aao Padai Kare. All rights reserved.</p>
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
