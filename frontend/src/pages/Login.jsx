
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  BookOpen,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  LoaderCircle,
} from "lucide-react";

import {
  api,
  saveAdminToken,
  saveStudentToken,
  clearAdminToken,
  clearStudentToken,
} from "../services/api";

export default function Login() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Please email aur password enter karein.");
      return;
    }

    try {
      setLoading(true);

      // First: Try Admin Login
      try {
        const adminResponse = await api.adminLogin({
          email,
          password,
        });

        if (adminResponse?.success && adminResponse?.token) {
          clearStudentToken();
          saveAdminToken(adminResponse.token);

          setSuccess("Admin login successful! Dashboard open ho raha hai...");

          window.dispatchEvent(new Event("authChange"));

          navigate("/admin/dashboard", { replace: true });
          return;
        }
      } catch (adminError) {
        // Admin login fail hone par Student login check hoga.
      }

      // Second: Try Student Login
      const studentResponse = await api.studentLogin({
        email,
        password,
      });

      if (!studentResponse?.success || !studentResponse?.token) {
        throw new Error(
          "Invalid email or password. Please dobara check karein."
        );
      }

      clearAdminToken();
      saveStudentToken(studentResponse.token);

      setSuccess("Student login successful! Dashboard open ho raha hai...");

      window.dispatchEvent(new Event("authChange"));

      navigate("/student/dashboard", { replace: true });

    } catch (err) {
      setError(
        err.message || "Login nahi ho paya. Email aur password check karein."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-indigo-100 md:grid-cols-2">

        {/* LEFT SECTION */}
        <section className="hidden flex-col justify-between bg-gradient-to-br from-indigo-700 to-blue-600 p-10 text-white md:flex lg:p-12">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <BookOpen size={26} />
            </span>

            <span className="text-xl font-black">
              Aao Padai Kare
            </span>
          </Link>

          <div>
            <h1 className="text-4xl font-black leading-tight">
              Your learning journey starts here.
            </h1>

            <p className="mt-5 leading-8 text-indigo-100">
              Learn new concepts, practice regularly aur apne academic goals ki
              taraf aage badho.
            </p>
          </div>

          <p className="text-sm text-indigo-100">
            Learn today. Grow tomorrow.
          </p>
        </section>

        {/* RIGHT SECTION */}
        <section className="p-6 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">

            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-indigo-700 hover:text-indigo-900"
            >
              <BookOpen size={19} />
              Aao Padai Kare
            </Link>

            <h2 className="mt-7 text-3xl font-black text-slate-900">
              Welcome back!
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Admin ya Student account se sign in karein.
            </p>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Email address
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50">
                  <Mail size={19} className="shrink-0 text-slate-400" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="w-full border-0 bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Password
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50">
                  <LockKeyhole
                    size={19}
                    className="shrink-0 text-slate-400"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    disabled={loading}
                    className="w-full border-0 bg-transparent py-3.5 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="shrink-0 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? (
                      <EyeOff size={19} />
                    ) : (
                      <Eye size={19} />
                    )}
                  </button>
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-extrabold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <LoaderCircle size={19} className="animate-spin" />
                    Checking Account...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>

            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-bold text-indigo-700 hover:text-indigo-900"
              >
                Create Account
              </Link>
            </p>

          </div>
        </section>
      </div>
    </main>
  );
}
