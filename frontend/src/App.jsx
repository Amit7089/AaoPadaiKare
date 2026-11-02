import { Link, Route, Routes, useLocation } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Classes from "./pages/Classes";
import ClassDetail from "./pages/ClassDetail";
import Notes from "./pages/Notes";
import NoteDetails from "./pages/NoteDetails";
import Quiz from "./pages/Quiz";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import StudentProtectedRoute from "./components/StudentProtectedRoute";
import MyProfile from "./pages/MyProfile";

// Admin
import AdminLogin from "./pages/Admin/AdminLogin";
import AdminNotes from "./pages/Admin/AdminNotes";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminSyllabus from "./pages/Admin/AdminSyllabus";

function NotFound() {
  return (
    <main className="flex min-h-[65vh] flex-col items-center justify-center px-4 text-center">
      <div className="text-7xl font-black text-indigo-600">404</div>

      <h1 className="mt-4 text-2xl font-black text-slate-900">
        Page nahi mila!
      </h1>

      <p className="mt-2 text-slate-600">
        Ye page available nahi hai ya URL galat hai.
      </p>

      <Link
        to="/"
        className="mt-6 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700"
      >
        Back to Home
      </Link>
    </main>
  );
}

export default function App() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <div className="flex min-h-screen flex-col">
      {!isAdminPage && <Navbar />}

      <div className="flex-1">
        <Routes>
          {/* Student Routes */}
          <Route path="/" element={<Home />} />

          <Route path="/classes" element={<Classes />} />

          <Route path="/classes/:classNo" element={<ClassDetail />} />

          <Route path="/notes" element={<Notes />} />

          <Route path="/notes/:id" element={<NoteDetails />} />

          <Route path="/quiz" element={<Quiz />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          {/* Student Dashboard */}
          <Route
            path="/dashboard"
            element={
              <StudentProtectedRoute>
                <Dashboard />
              </StudentProtectedRoute>
            }
          />

          <Route
            path="/student/dashboard"
            element={
              <StudentProtectedRoute>
                <Dashboard />
              </StudentProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <StudentProtectedRoute>
                <MyProfile />
              </StudentProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/notes"
            element={
              <AdminProtectedRoute>
                <AdminNotes />
              </AdminProtectedRoute>
            }
          />

          <Route
            path="/admin/syllabus"
            element={
              <AdminProtectedRoute>
                <AdminSyllabus />
              </AdminProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {!isAdminPage && <Footer />}
    </div>
  );
}
