
import { Link } from "react-router-dom";
import { ArrowRight, BookOpen } from "lucide-react";

const colors = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-pink-500 to-rose-600",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-green-600",
  "from-cyan-500 to-teal-600",
  "from-indigo-500 to-blue-700",
];

export default function ClassCard({ classNo, index = 0 }) {
  return (
    <Link
      to={`/classes/${classNo}`}
      className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl sm:p-6"
    >
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colors[index % colors.length]} text-white shadow-lg transition group-hover:scale-110`}>
        <BookOpen size={27} />
      </div>
      <h3 className="mt-5 text-xl font-black text-slate-900">Class {classNo}</h3>
      <p className="mt-2 text-sm text-slate-500">Subjects, chapters and practice</p>
      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm font-bold text-indigo-700">Explore class</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
          <ArrowRight size={17} />
        </span>
      </div>
    </Link>
  );
}
