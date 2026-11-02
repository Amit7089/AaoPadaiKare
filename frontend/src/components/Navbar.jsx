
import { useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  BookOpen,
  Menu,
  X,
  GraduationCap,
  UserPlus,
} from "lucide-react";

const links = [
  { label: "Home", to: "/" },
  { label: "Classes", to: "/classes" },
  { label: "Notes", to: "/notes" },
  { label: "Quiz", to: "/quiz" },
  { label: "Dashboard", to: "/dashboard" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // Route change hone par mobile menu automatically close hoga
  const linkClass = ({ isActive }) =>
    `rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      isActive
        ? "bg-indigo-50 text-indigo-700"
        : "text-slate-600 hover:bg-slate-50 hover:text-indigo-700"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          onClick={() => setMenuOpen(false)}
          className="flex shrink-0 items-center gap-2.5"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
            <GraduationCap size={27} />
          </span>

          <span>
            <span className="block whitespace-nowrap text-base font-extrabold tracking-tight text-slate-900 sm:text-xl">
              Aao <span className="text-indigo-600">Padai Kare</span>
            </span>

            <span className="hidden text-xs font-medium text-slate-500 sm:block">
              MP Board Learning Platform
            </span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={linkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Link
            to="/register"
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
              location.pathname === "/register"
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-slate-200 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            <UserPlus size={17} />
            Register
          </Link>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
          >
            <BookOpen size={17} />
            Login
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 md:hidden"
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={() => setMenuOpen(false)}
                className={linkClass}
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 px-3 py-3 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
              >
                <UserPlus size={17} />
                Register
              </Link>

              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-3 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
              >
                <BookOpen size={17} />
                Login
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
