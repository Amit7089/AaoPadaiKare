
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  NotebookPen,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
  ClipboardCheck,
  BookMarked,
  Lightbulb,
} from "lucide-react";

const classes = [
  { number: 6, label: "Class 6", color: "from-sky-500 to-blue-600" },
  { number: 7, label: "Class 7", color: "from-violet-500 to-purple-600" },
  { number: 8, label: "Class 8", color: "from-pink-500 to-rose-600" },
  { number: 9, label: "Class 9", color: "from-amber-500 to-orange-600" },
  { number: 10, label: "Class 10", color: "from-emerald-500 to-green-600" },
  { number: 11, label: "Class 11", color: "from-cyan-500 to-teal-600" },
  { number: 12, label: "Class 12", color: "from-indigo-500 to-blue-700" },
];

const features = [
  {
    icon: BookMarked,
    title: "Chapter-wise Notes",
    description:
      "Topics ko aasaan language mein samjho aur revision ke liye notes padho.",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    icon: ClipboardCheck,
    title: "MCQ Practice",
    description:
      "Apni preparation check karo aur practice ke saath confidence badhao.",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    icon: PlayCircle,
    title: "Video Learning",
    description:
      "Difficult topics ko step-by-step samajhne ke liye video lessons dekho.",
    color: "bg-orange-100 text-orange-700",
  },
  {
    icon: Trophy,
    title: "Exam Preparation",
    description:
      "Important questions aur regular practice ke saath exam ki taiyari karo.",
    color: "bg-pink-100 text-pink-700",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden">
      {/* HERO */}
      <section className="relative bg-gradient-to-br from-indigo-50 via-white to-sky-50">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-0 h-72 w-72 rounded-full bg-sky-100/70 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-bold text-indigo-700 shadow-sm">
              <Sparkles size={16} />
              Smart learning for MP Board students
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              Padhai ab hogi
              <span className="block bg-gradient-to-r from-indigo-600 to-blue-500 bg-clip-text text-transparent">
                aur bhi aasaan!
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              Class 6 se 12 tak ke students ke liye notes, MCQ practice aur
              exam preparation — sab kuch ek hi jagah.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/classes"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 font-bold text-white shadow-xl shadow-indigo-200 transition hover:-translate-y-1 hover:bg-indigo-700"
              >
                Apni Class Chune
                <ArrowRight size={19} />
              </Link>
              <Link
                to="/quiz"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 font-bold text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:text-indigo-700"
              >
                <PlayCircle size={19} />
                Quiz Practice
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Easy-to-understand learning
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-600" />
                Classes 6–12
              </span>
            </div>
          </div>

          {/* Hero illustration */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute inset-5 rounded-[2.5rem] bg-indigo-200/60 blur-2xl" />
            <div className="relative rounded-[2rem] border border-white bg-white p-5 shadow-2xl shadow-indigo-100 sm:p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    Your learning space
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                    Aaj kya seekhenge?
                  </h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
                  <GraduationCap size={27} />
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
                      LEARN • PRACTICE • GROW
                    </span>
                    <h3 className="mt-5 text-2xl font-black">
                      Small steps,
                      <br />
                      big success!
                    </h3>
                    <p className="mt-2 text-sm text-indigo-100">
                      Har din thoda behtar bano.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl bg-white/15 p-3 sm:block">
                    <Lightbulb size={36} />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-white/25">
                    <div className="h-2 w-3/5 rounded-full bg-amber-300" />
                  </div>
                  <span className="text-xs font-bold">Keep going!</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <NotebookPen size={21} />
                  </div>
                  <p className="mt-3 font-bold text-slate-900">Quick Notes</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Revise smartly
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Target size={21} />
                  </div>
                  <p className="mt-3 font-bold text-slate-900">Practice Quiz</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Test your knowledge
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -left-4 top-24 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-xl sm:flex">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 size={22} />
              </span>
              <span>
                <span className="block text-sm font-extrabold text-slate-900">
                  Learn daily
                </span>
                <span className="text-xs text-slate-500">Grow confidently</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CLASSES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-indigo-600">
              Start learning
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Apni class chune
            </h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Apni class select karo aur apne learning resources explore karo.
            </p>
          </div>
          <Link
            to="/classes"
            className="inline-flex items-center gap-2 font-bold text-indigo-700 hover:text-indigo-900"
          >
            All Classes <ArrowRight size={18} />
          </Link>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {classes.map((item) => (
            <Link
              key={item.number}
              to={`/classes/${item.number}`}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100 sm:p-6"
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-lg transition group-hover:scale-110`}
              >
                <BookOpen size={27} />
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                {item.label}
              </h3>
              <p className="mt-1 text-sm text-slate-500">Explore study material</p>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm font-bold text-indigo-700">
                  Start learning
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition group-hover:bg-indigo-600 group-hover:text-white">
                  <ArrowRight size={17} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-y border-slate-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-indigo-600">
              Everything in one place
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Padhai ke liye sab kuch
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Concepts samjho, practice karo aur exam ke liye taiyar raho.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-slate-200/60"
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.color} transition group-hover:scale-110`}
                  >
                    <Icon size={26} />
                  </div>
                  <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 px-6 py-12 text-center text-white shadow-2xl shadow-indigo-200 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full border-[35px] border-white/10" />
          <div className="pointer-events-none absolute -bottom-28 -left-10 h-64 w-64 rounded-full border-[35px] border-white/10" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-bold">
              <Sparkles size={16} /> Your future starts today
            </span>
            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-black sm:text-4xl lg:text-5xl">
              Aaj se apni padhai ko ek nayi direction do!
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-indigo-100">
              Apni class chuno, learning shuru karo aur har din apna confidence
              badhao.
            </p>
            <Link
              to="/classes"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-extrabold text-indigo-700 shadow-lg transition hover:-translate-y-1 hover:bg-indigo-50"
            >
              Explore Classes <ArrowRight size={19} />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
