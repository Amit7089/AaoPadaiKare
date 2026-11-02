
import { Link } from "react-router-dom";
import { BookOpen, Heart, ArrowUpRight } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 lg:grid-cols-3 lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white">
              <BookOpen size={24} />
            </span>
            <span className="text-lg font-black text-slate-900">
              Aao <span className="text-indigo-600">Padai Kare</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-slate-600">
            Students ke liye notes, practice aur exam preparation ko aasaan
            banane ki ek learning platform.
          </p>
        </div>

        <div>
          <h3 className="font-extrabold text-slate-900">Quick Links</h3>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600">
            <Link className="hover:text-indigo-700" to="/">Home</Link>
            <Link className="hover:text-indigo-700" to="/classes">Classes 6–12</Link>
            <Link className="hover:text-indigo-700" to="/notes">Study Notes</Link>
            <Link className="hover:text-indigo-700" to="/quiz">Practice Quiz</Link>
            <Link className="hover:text-indigo-700" to="/login">Login</Link>
          </div>
        </div>

        <div>
          <h3 className="font-extrabold text-slate-900">Keep Learning</h3>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Roz thoda seekho, regular practice karo aur apne goals ki taraf
            badhte raho.
          </p>
          <Link
            to="/classes"
            className="mt-4 inline-flex items-center gap-2 font-bold text-indigo-700 hover:text-indigo-900"
          >
            Start learning <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-center text-xs text-slate-500 sm:px-6 md:flex-row lg:px-8">
          <p>© {new Date().getFullYear()} Aao Padai Kare. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Made for learners with <Heart size={14} className="text-rose-500" />
          </p>
        </div>
      </div>
    </footer>
  );
}
