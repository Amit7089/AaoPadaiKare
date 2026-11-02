
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Eye,
  EyeOff,
  UserRound,
  LoaderCircle,
  Mail,
  Phone,
  GraduationCap,
  Lock,
} from "lucide-react";
import { api } from "../services/api";

export default function Register() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    classNo: "10",
    password: "",
  });

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

    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const result = await api.studentRegister({
        ...formData,
        classNo: Number(formData.classNo),
      });

      setSuccess(
        result.message || "Registration successful! Please login."
      );

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-normal text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50";

  return (
    <main className="flex min-h-[85vh] items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-sky-50 px-4 py-10 sm:px-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-indigo-100 sm:p-9">

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-extrabold text-indigo-700"
        >
          <BookOpen size={22} />
          Aao Padai Kare
        </Link>

        <div className="mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700">
          <UserRound size={29} />
        </div>

        <h1 className="mt-5 text-3xl font-black text-slate-900">
          Create Your Account
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Apni learning journey shuru karne ke liye details bharein.
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">

          {/* Full Name */}
          <label className="block text-sm font-bold text-slate-700">
            Full Name

            <div className="relative">
              <UserRound
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                name="name"
                type="text"
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
                className={`${inputClass} pl-11`}
              />
            </div>
          </label>

          {/* Email */}
          <label className="block text-sm font-bold text-slate-700">
            Email Address

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`${inputClass} pl-11`}
              />
            </div>
          </label>

          {/* Mobile */}
          <label className="block text-sm font-bold text-slate-700">
            Mobile Number

            <div className="relative">
              <Phone
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                name="mobile"
                type="tel"
                required
                maxLength={10}
                inputMode="numeric"
                pattern="[6-9][0-9]{9}"
                autoComplete="tel-national"
                placeholder="10-digit mobile number"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                  }))
                }
                className={`${inputClass} pl-11`}
              />
            </div>
          </label>

          {/* Class */}
          <label className="block text-sm font-bold text-slate-700">
            Select Your Class

            <div className="relative">
              <GraduationCap
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                name="classNo"
                required
                value={formData.classNo}
                onChange={handleChange}
                className={`${inputClass} pl-11`}
              >
                {[6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <option key={n} value={n}>
                    Class {n}
                  </option>
                ))}
              </select>
            </div>
          </label>

          {/* Password */}
          <label className="block text-sm font-bold text-slate-700">
            Password

            <div className="mt-2 flex items-center rounded-xl border border-slate-200 px-4 transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50">
              <Lock size={18} className="shrink-0 text-slate-400" />

              <input
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-3.5 text-sm outline-none"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="shrink-0 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>

            <span className="mt-1 block text-xs font-normal text-slate-400">
              Password must contain at least 8 characters.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 font-extrabold text-white shadow-lg shadow-indigo-100 transition hover:-translate-y-0.5 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle size={19} className="animate-spin" />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-extrabold text-indigo-700 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="mt-4 text-center text-xs leading-5 text-slate-400">
          Your password is securely encrypted before being stored.
        </p>
      </div>
    </main>
  );
}
