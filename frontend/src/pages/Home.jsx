
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight, ArrowRight, BookOpen, GraduationCap, Sparkles,
  Trophy, Brain, PlayCircle, ClipboardCheck, Atom, Calculator,
  Languages, Clock3, Zap, Target, MoveUpRight, ChevronRight,
  Star, Lightbulb, Rocket, BookMarked
} from "lucide-react";
import { api } from "../services/api";

const classes = [
  { n: 6, title: "कक्षा 06", label: "शुरुआत यहीं से", color: "#22D3EE" },
  { n: 7, title: "कक्षा 07", label: "सीखने का सफर", color: "#A78BFA" },
  { n: 8, title: "कक्षा 08", label: "मजबूत आधार", color: "#F472B6" },
  { n: 9, title: "कक्षा 09", label: "नई चुनौतियाँ", color: "#FBBF24" },
  { n: 10, title: "कक्षा 10", label: "बोर्ड की तैयारी", color: "#34D399" },
  { n: 11, title: "कक्षा 11", label: "नई दिशा", color: "#60A5FA" },
  { n: 12, title: "कक्षा 12", label: "लक्ष्य की ओर", color: "#C084FC" },
];

const categories = {
  scholarship: "छात्रवृत्ति",
  "school-entrance": "प्रवेश परीक्षा",
  olympiad: "ओलंपियाड",
  foundation: "फाउंडेशन",
  other: "प्रतियोगी परीक्षा",
};

const tools = [
  {
    no: "01",
    icon: BookOpen,
    title: "नोट्स और किताबें",
    desc: "हर विषय की अध्यायवार अध्ययन सामग्री",
    link: "/classes",
    color: "text-cyan-300",
    glow: "bg-cyan-400/10",
  },
  {
    no: "02",
    icon: Brain,
    title: "टेस्ट और क्विज़",
    desc: "प्रश्न हल करें और अपनी तैयारी जाँचें",
    link: "/quiz",
    color: "text-violet-300",
    glow: "bg-violet-400/10",
  },
  {
    no: "03",
    icon: PlayCircle,
    title: "वीडियो लर्निंग",
    desc: "कठिन विषयों को आसान तरीके से समझें",
    link: "/classes",
    color: "text-emerald-300",
    glow: "bg-emerald-400/10",
  },
];

function Eyebrow({ children }) {
  return (
    <div className="mb-4 flex items-center gap-3 text-[10px] font-black tracking-[0.24em] text-cyan-300 sm:text-xs">
      <span className="h-px w-8 bg-cyan-400" />
      {children}
    </div>
  );
}

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadCourses = async () => {
      try {
        const response = await api.getCourses();
        if (active) {
          setCourses(
            Array.isArray(response?.courses)
              ? response.courses.slice(0, 3)
              : []
          );
        }
      } catch (error) {
        console.error("Courses loading error:", error);
        if (active) setCourses([]);
      } finally {
        if (active) setCoursesLoading(false);
      }
    };

    loadCourses();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="overflow-hidden bg-[#070B14] text-white">

      {/* HERO: CINEMATIC INTRO */}
      <section className="relative isolate min-h-[720px] overflow-hidden bg-[#080D19]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 top-0 h-[500px] w-[500px] rounded-full bg-blue-600/20 blur-[150px]" />
          <div className="absolute -right-40 top-10 h-[550px] w-[550px] rounded-full bg-violet-600/20 blur-[150px]" />
          <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-cyan-500/10 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.055]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(148,163,184,.5) 1px, transparent 1px),linear-gradient(90deg,rgba(148,163,184,.5) 1px,transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:min-h-[690px] lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:py-20">

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-4 py-2 text-[10px] font-bold text-cyan-200 sm:text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_#22d3ee]" />
              मध्य प्रदेश बोर्ड के विद्यार्थियों के लिए
              <Sparkles size={14} />
            </div>

            <h1 className="mt-8 text-[44px] font-black leading-[1.13] tracking-tight sm:text-6xl lg:text-[76px]">
              अब पढ़ाई
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                होगी स्मार्ट।
              </span>
              <span className="mt-2 block text-white">
                सपने होंगे साकार।
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-sm leading-8 text-slate-400 sm:text-base">
              नोट्स, ऑनलाइन टेस्ट, वीडियो और प्रतियोगी परीक्षाओं की तैयारी।
              आपकी पढ़ाई के लिए एक ऐसी डिजिटल जगह जहाँ सीखना बने आसान।
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/classes"
                className="group inline-flex items-center justify-center gap-3 rounded-xl bg-cyan-300 px-7 py-4 text-sm font-black text-[#06111F] shadow-[0_0_35px_rgba(34,211,238,.22)] transition duration-300 hover:-translate-y-1 hover:bg-cyan-200 hover:shadow-[0_0_45px_rgba(34,211,238,.4)]"
              >
                पढ़ाई शुरू करें
                <ArrowUpRight size={18} className="transition group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>

              <Link
                to="/quiz"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-7 py-4 text-sm font-bold text-white transition hover:border-cyan-300/40 hover:bg-cyan-300/10"
              >
                <PlayCircle size={19} className="text-cyan-300" />
                टेस्ट दें
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-500">
              <span className="flex items-center gap-2">
                <GraduationCap size={16} className="text-cyan-300" />
                कक्षा 6 से 12
              </span>
              <span className="flex items-center gap-2">
                <Languages size={16} className="text-violet-300" />
                हिंदी और अंग्रेज़ी
              </span>
              <span className="flex items-center gap-2">
                <Zap size={16} className="text-amber-300" />
                अपनी गति से सीखें
              </span>
            </div>
          </div>

          {/* RIGHT VISUAL - KNOWLEDGE ORBIT */}
          <div className="relative mx-auto flex min-h-[400px] w-full max-w-[530px] items-center justify-center sm:min-h-[510px]">

            <div className="absolute h-[280px] w-[280px] rounded-full bg-cyan-400/10 blur-[80px] sm:h-[380px] sm:w-[380px]" />

            <div className="absolute h-[300px] w-[300px] animate-[spin_35s_linear_infinite] rounded-full border border-dashed border-cyan-300/20 sm:h-[420px] sm:w-[420px]" />
            <div className="absolute h-[230px] w-[230px] animate-[spin_28s_linear_infinite_reverse] rounded-full border border-violet-300/20 sm:h-[330px] sm:w-[330px]" />

            <div className="relative z-10 flex h-[220px] w-[220px] flex-col items-center justify-center rounded-full border border-cyan-300/30 bg-gradient-to-br from-[#17365A] via-[#14213D] to-[#17122F] shadow-[0_0_80px_rgba(34,211,238,.15)] sm:h-[285px] sm:w-[285px]">
              <div className="absolute inset-3 rounded-full border border-white/[0.08]" />
              <GraduationCap size={42} className="mb-3 text-cyan-300 sm:h-12 sm:w-12" />
              <p className="text-[10px] font-bold tracking-[0.3em] text-cyan-200">AAO PADAI KARE</p>
              <p className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">ज्ञान</p>
              <p className="mt-2 text-xs text-slate-400">सीखें • समझें • बढ़ें</p>
            </div>

            {/* Orbiting icons */}
            <div className="absolute left-[7%] top-[18%] flex h-12 w-12 animate-bounce items-center justify-center rounded-2xl border border-cyan-300/20 bg-[#101D32] text-cyan-300 shadow-xl shadow-cyan-500/10 sm:h-14 sm:w-14">
              <Atom size={26} />
            </div>
            <div className="absolute right-[6%] top-[18%] flex h-12 w-12 animate-[bounce_4s_infinite] items-center justify-center rounded-2xl border border-violet-300/20 bg-[#19152F] text-violet-300 shadow-xl shadow-violet-500/10 sm:h-14 sm:w-14">
              <Calculator size={26} />
            </div>
            <div className="absolute bottom-[15%] left-[9%] flex h-12 w-12 animate-[bounce_3s_infinite] items-center justify-center rounded-2xl border border-amber-300/20 bg-[#241E2C] text-amber-300 shadow-xl shadow-amber-500/10 sm:h-14 sm:w-14">
              <Lightbulb size={26} />
            </div>
            <div className="absolute bottom-[14%] right-[8%] flex h-12 w-12 animate-[bounce_5s_infinite] items-center justify-center rounded-2xl border border-emerald-300/20 bg-[#10251F] text-emerald-300 shadow-xl shadow-emerald-500/10 sm:h-14 sm:w-14">
              <Trophy size={26} />
            </div>

            {/* Floating info */}
            <div className="absolute left-0 top-[46%] hidden -translate-x-2 rounded-xl border border-white/10 bg-[#111B2D]/90 p-3 shadow-xl backdrop-blur sm:block">
              <div className="flex items-center gap-2">
                <BookOpen size={17} className="text-cyan-300" />
                <span className="text-[11px] font-bold">अध्ययन सामग्री</span>
              </div>
            </div>
            <div className="absolute right-0 top-[48%] hidden translate-x-2 rounded-xl border border-white/10 bg-[#111B2D]/90 p-3 shadow-xl backdrop-blur sm:block">
              <div className="flex items-center gap-2">
                <Brain size={17} className="text-violet-300" />
                <span className="text-[11px] font-bold">स्मार्ट अभ्यास</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom metrics strip */}
        <div className="relative border-t border-white/[0.07] bg-white/[0.02]">
          <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-white/[0.08] px-5 py-5 sm:px-8 lg:px-10">
            {[
              ["07", "कक्षाएँ"],
              ["01", "डिजिटल पाठशाला"],
              ["∞", "सीखने के अवसर"],
            ].map(([value, label]) => (
              <div key={label} className="px-2 text-center">
                <p className="text-xl font-black text-cyan-300 sm:text-2xl">{value}</p>
                <p className="mt-1 text-[10px] text-slate-500 sm:text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLASS SELECTOR - HORIZONTAL NUMBER WALL */}
      <section className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute right-0 top-10 h-72 w-72 rounded-full bg-violet-600/[0.08] blur-[110px]" />

        <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <Eyebrow>अपनी कक्षा चुनें</Eyebrow>
              <h2 className="text-3xl font-black sm:text-5xl">
                आपका अगला <span className="text-cyan-300">कदम।</span>
              </h2>
              <p className="mt-4 text-sm text-slate-400">
                जिस कक्षा में पढ़ते हैं, वहीं से अपनी यात्रा शुरू करें।
              </p>
            </div>
            <Link to="/classes" className="mb-1 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 transition hover:text-white">
              सभी कक्षाएँ <ArrowRight size={17} />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {classes.map((item, index) => (
              <Link
                key={item.n}
                to={`/classes/${item.n}`}
                className="group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0D1423] p-4 transition duration-300 hover:-translate-y-2 hover:border-white/20 sm:min-h-[210px] sm:p-5"
              >
                <div
                  className="absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-10 blur-2xl transition group-hover:opacity-30"
                  style={{ backgroundColor: item.color }}
                />
                <span className="relative text-[10px] font-bold text-slate-500">
                  LEVEL {String(index + 1).padStart(2, "0")}
                </span>
                <div className="relative">
                  <p
                    className="text-4xl font-black tracking-tighter sm:text-5xl"
                    style={{ color: item.color }}
                  >
                    {String(item.n).padStart(2, "0")}
                  </p>
                  <h3 className="mt-3 text-sm font-black text-white">{item.title}</h3>
                  <p className="mt-1 text-[10px] text-slate-500">{item.label}</p>
                </div>
                <div className="relative flex items-center justify-between border-t border-white/[0.08] pt-3">
                  <span className="text-[10px] font-bold text-slate-400">खोलें</span>
                  <ArrowUpRight size={16} className="text-cyan-300 transition group-hover:-translate-y-1 group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* LEARNING EXPERIENCE - SPLIT LAYOUT */}
      <section className="border-y border-white/[0.06] bg-[#0B1220] py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:px-10">

          <div>
            <Eyebrow>आपकी पढ़ाई, आपके तरीके से</Eyebrow>
            <h2 className="text-3xl font-black leading-tight sm:text-5xl">
              सिर्फ पढ़ना नहीं,
              <span className="mt-2 block text-violet-300">समझना भी जरूरी है।</span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-8 text-slate-400">
              पढ़ाई को छोटे और आसान चरणों में बाँटें। पढ़ें, अभ्यास करें और
              अपनी तैयारी को लगातार बेहतर बनाएँ।
            </p>
            <Link
              to="/classes"
              className="mt-8 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 transition hover:gap-4"
            >
              पढ़ाई की शुरुआत करें <ArrowRight size={17} />
            </Link>

            <div className="mt-12 hidden grid-cols-2 gap-3 sm:grid">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <BookMarked size={22} className="text-cyan-300" />
                <p className="mt-4 text-sm font-bold">अध्यायवार नोट्स</p>
                <p className="mt-1 text-xs text-slate-500">आसान अध्ययन</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                <Target size={22} className="text-violet-300" />
                <p className="mt-4 text-sm font-bold">लक्ष्य आधारित तैयारी</p>
                <p className="mt-1 text-xs text-slate-500">बेहतर अभ्यास</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.no}
                  to={tool.link}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111A2B] p-5 transition duration-300 hover:translate-x-1 hover:border-cyan-300/30 hover:bg-[#152139] sm:gap-6 sm:p-7"
                >
                  <span className="text-xs font-black text-slate-600">{tool.no}</span>
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tool.glow} ${tool.color} sm:h-14 sm:w-14`}>
                    <Icon size={25} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-black text-white sm:text-lg">{tool.title}</h3>
                    <p className="mt-1 text-xs text-slate-400 sm:text-sm">{tool.desc}</p>
                  </div>
                  <ArrowUpRight size={20} className="shrink-0 text-slate-500 transition group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-300" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* COMPETITIVE COURSES */}
      {!coursesLoading && courses.length > 0 && (
        <section className="relative overflow-hidden py-20 sm:py-28">
          <div className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-violet-600/10 blur-[120px]" />

          <div className="relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <Eyebrow>सामान्य पढ़ाई से आगे</Eyebrow>
                <h2 className="text-3xl font-black sm:text-5xl">
                  बड़े लक्ष्य, <span className="text-violet-300">खास तैयारी।</span>
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
                  NMMS, नवोदय और दूसरी प्रतियोगी परीक्षाओं के लिए विशेष कोर्स।
                </p>
              </div>
              <Link to="/student/courses" className="mb-1 inline-flex items-center gap-2 text-sm font-bold text-cyan-300 hover:text-white">
                सभी कोर्स देखें <ArrowRight size={17} />
              </Link>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course._id}
                  to={`/student/courses/${encodeURIComponent(course.slug)}`}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#10192A] transition duration-300 hover:-translate-y-2 hover:border-violet-300/30 hover:shadow-[0_20px_60px_rgba(124,58,237,.12)]"
                >
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-900 to-violet-950">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.title}
                        loading="lazy"
                        className="h-full w-full object-cover opacity-80 transition duration-700 group-hover:scale-110 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <Trophy size={55} className="text-violet-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#10192A] to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur">
                      {categories[course.category] || "प्रतियोगी परीक्षा"}
                    </span>
                    <span className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition group-hover:rotate-45 group-hover:bg-cyan-300 group-hover:text-slate-950">
                      <MoveUpRight size={18} />
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-black text-white transition group-hover:text-cyan-300">
                      {course.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-6 text-slate-400">
                      {course.shortDescription}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Languages size={13} className="text-cyan-300" />
                        {(course.supportedLanguages || []).join(" / ") || "Hindi"}
                      </span>
                      {course.durationDays > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock3 size={13} className="text-violet-300" />
                          {course.durationDays} दिन
                        </span>
                      )}
                    </div>

                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.08] pt-4">
                      <div>
                        {Number(course.price) > 0 ? (
                          <>
                            {Number(course.compareAtPrice) > Number(course.price) && (
                              <span className="mr-2 text-xs text-slate-500 line-through">
                                ₹{course.compareAtPrice}
                              </span>
                            )}
                            <span className="text-xl font-black text-white">₹{course.price}</span>
                          </>
                        ) : (
                          <span className="font-black text-emerald-300">निःशुल्क</span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-cyan-300">कोर्स देखें</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-white/[0.06] bg-[#0A1020] px-5 py-24 sm:px-8 sm:py-32 lg:px-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[130px]" />
          <div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/[0.08]" />
          <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/[0.07]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-300 shadow-[0_0_40px_rgba(34,211,238,.15)]">
            <Rocket size={30} />
          </div>

          <Eyebrow>आपका भविष्य, आपकी मेहनत</Eyebrow>
          <h2 className="mt-5 text-3xl font-black leading-tight sm:text-5xl lg:text-6xl">
            आज सीखेंगे,
            <span className="block bg-gradient-to-r from-cyan-300 to-violet-400 bg-clip-text text-transparent">
              कल आगे बढ़ेंगे।
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-sm leading-8 text-slate-400 sm:text-base">
            हर बड़ा लक्ष्य एक छोटे कदम से शुरू होता है। अपनी कक्षा चुनें और
            आज ही अपनी पढ़ाई को नई दिशा दें।
          </p>

          <Link
            to="/classes"
            className="group mt-9 inline-flex items-center gap-3 rounded-xl bg-cyan-300 px-8 py-4 text-sm font-black text-[#07111F] shadow-[0_0_35px_rgba(34,211,238,.2)] transition hover:-translate-y-1 hover:bg-cyan-200 hover:shadow-[0_0_50px_rgba(34,211,238,.35)]"
          >
            चलिए पढ़ाई शुरू करें
            <ArrowRight size={18} className="transition group-hover:translate-x-1" />
          </Link>

          <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Star size={14} className="fill-amber-300 text-amber-300" />
            ज्ञान ही सबसे बड़ी शक्ति है
            <Star size={14} className="fill-amber-300 text-amber-300" />
          </div>
        </div>
      </section>
    </main>
  );
}
