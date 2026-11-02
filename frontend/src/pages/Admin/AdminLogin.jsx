
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LockKeyhole, Mail, Eye, EyeOff } from "lucide-react";
import { api, saveAdminToken } from "../../services/api";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await api.adminLogin({ email, password });

      saveAdminToken(result.token);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl sm:p-9">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
          <LockKeyhole size={30} />
        </div>

        <div className="mt-5 text-center">
          <p className="text-sm font-bold text-indigo-600">
            AAO PADAI KARE
          </p>
          <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to manage your learning platform.
          </p>
        </div>

        {error && (
          <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Admin Email
            </label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full rounded-xl border border-slate-200 py-3 pl-4 pr-12 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login to Admin Panel"}
          </button>
        </form>

        <Link
          to="/"
          className="mt-6 block text-center text-sm font-semibold text-slate-500 hover:text-indigo-600"
        >
          Back to Website
        </Link>
      </div>
    </main>
  );
}
