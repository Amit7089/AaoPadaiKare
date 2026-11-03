
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  BookOpen,
  Menu,
  X,
  GraduationCap,
  UserPlus,
  LayoutDashboard,
  UserCircle,
  LogOut,
  Home,
} from "lucide-react";

import {
  getAdminToken,
  getStudentToken,
  clearAdminToken,
  clearStudentToken,
} from "../services/api";

const publicLinks = [
  { label: "Home", to: "/" },
  { label: "Classes", to: "/classes" },
  { label: "Notes", to: "/notes" },
  { label: "Quiz", to: "/quiz" },
];

const studentLinks = [
  { label: "Home", to: "/" },
  { label: "Classes", to: "/classes" },
  { label: "Notes", to: "/notes" },
  { label: "Quiz", to: "/quiz" },
  { label: "Dashboard", to: "/dashboard" },
];

const adminLinks = [
  { label: "Home", to: "/" },
  { label: "Admin Panel", to: "/admin/dashboard" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [auth, setAuth] = useState({
    role: "guest",
    loggedIn: false,
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Check login status
  const checkAuth = () => {
    const adminToken = getAdminToken();
    const studentToken = getStudentToken();

    if (adminToken) {
      setAuth({
        role: "admin",
        loggedIn: true,
      });
    } else if (studentToken) {
      setAuth({
        role: "student",
        loggedIn: true,
      });
    } else {
      setAuth({
        role: "guest",
        loggedIn: false,
      });
    }
  };

  // Check authentication on page and route changes
  useEffect(() => {
    checkAuth();
    setMenuOpen(false);
  }, [location.pathname]);

  // Update authentication when localStorage changes in another tab
  useEffect(() => {
    const handleStorage = () => checkAuth();

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Logout
  const handleLogout = () => {
    if (auth.role === "admin") {
      clearAdminToken();
    } else if (auth.role === "student") {
      clearStudentToken();
    }

    setAuth({
      role: "guest",
      loggedIn: false,
    });

    setMenuOpen(false);
    navigate("/login", { replace: true });
  };

  // Navigation links based on login status
  const links =
    auth.role === "admin"
      ? adminLinks
      : auth.role === "student"
      ? studentLinks
      : publicLinks;

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

        {/* Desktop Authentication Buttons */}
        <div className="hidden shrink-0 items-center gap-2 md:flex">

          {!auth.loggedIn && (
            <>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
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
            </>
          )}

          {auth.role === "student" && (
            <>
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50"
              >
                <UserCircle size={18} />
                My Profile
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          )}

          {auth.role === "admin" && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-100"
            >
              <LogOut size={17} />
              Admin Logout
            </button>
          )}
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

              {!auth.loggedIn && (
                <>
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
                </>
              )}

              {auth.role === "student" && (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-indigo-200 px-3 py-3 text-sm font-bold text-indigo-700"
                  >
                    <UserCircle size={17} />
                    My Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-sm font-bold text-red-600"
                  >
                    <LogOut size={17} />
                    Logout
                  </button>
                </>
              )}

              {auth.role === "admin" && (
                <button
                  onClick={handleLogout}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-3 text-sm font-bold text-red-600"
                >
                  <LogOut size={17} />
                  Admin Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
