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
import Membership from "./pages/Membership";

// Student Quiz Pages
import StudentQuizzes from "./pages/StudentQuizzes";
import QuizAttempt from "./pages/QuizAttempt";
import StudentQuizHistory from "./pages/StudentQuizHistory";
import QuizResultDetails from "./pages/QuizResultDetails";
import QuestionPapers from "./pages/QuestionPapers";
// Student Competitive Courses
// Student Competitive Courses
import StudentCourses from "./pages/StudentCourses.jsx";
import StudentCourseDetails from "./pages/StudentCourseDetails.jsx";
import StudentCourseLesson from "./pages/StudentCourseLesson.jsx";

// Admin
import AdminNotes from "./pages/Admin/AdminNotes";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminSyllabus from "./pages/Admin/AdminSyllabus";
import AdminLiveClasses from "./pages/Admin/AdminLiveClasses";
import AdminQuizzes from "./pages/Admin/AdminQuizzes";
import AdminAnalytics from "./pages/Admin/AdminAnalytics";
import AdminQuestionPapers from "./pages/Admin/AdminQuestionPapers";

// Competitive Courses Admin
import AdminCourses from "./pages/Admin/AdminCourses";

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
          {/* PUBLIC STUDENT ROUTES */}

          <Route path="/" element={<Home />} />

          <Route path="/classes" element={<Classes />} />

          <Route path="/classes/:classNo" element={<ClassDetail />} />

          <Route path="/notes" element={<Notes />} />

          <Route path="/notes/:id" element={<NoteDetails />} />

          <Route path="/question-papers" element={<QuestionPapers />} />

          <Route path="/quiz" element={<Quiz />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          {/* MEMBERSHIP */}

          <Route path="/membership" element={<Membership />} />

          {/* STUDENT PROTECTED ROUTES */}

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
          {/* STUDENT COMPETITIVE COURSES */}

          <Route
            path="/student/courses"
            element={
              <StudentProtectedRoute>
                <StudentCourses />
              </StudentProtectedRoute>
            }
          />

          <Route
            path="/student/courses/:slug"
            element={
              <StudentProtectedRoute>
                <StudentCourseDetails />
              </StudentProtectedRoute>
            }
          />

          <Route
            path="/student/courses/:slug/lessons/:lessonId"
            element={
              <StudentProtectedRoute>
                <StudentCourseLesson />
              </StudentProtectedRoute>
            }
          />

          {/* STUDENT ONLINE QUIZZES */}

          <Route
            path="/student/quizzes"
            element={
              <StudentProtectedRoute>
                <StudentQuizzes />
              </StudentProtectedRoute>
            }
          />

          <Route
            path="/student/quizzes/:id"
            element={
              <StudentProtectedRoute>
                <QuizAttempt />
              </StudentProtectedRoute>
            }
          />

          <Route
            path="/student/quiz-history"
            element={
              <StudentProtectedRoute>
                <StudentQuizHistory />
              </StudentProtectedRoute>
            }
          />

          <Route
            path="/student/quizzes/:id/result"
            element={
              <StudentProtectedRoute>
                <QuizResultDetails />
              </StudentProtectedRoute>
            }
          />

          {/* ADMIN LOGIN */}

          <Route path="/admin/login" element={<Login />} />

          {/* ADMIN DASHBOARD */}

          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />

          {/* ADMIN NOTES */}

          <Route
            path="/admin/notes"
            element={
              <AdminProtectedRoute>
                <AdminNotes />
              </AdminProtectedRoute>
            }
          />

          {/* ADMIN SYLLABUS */}

          <Route
            path="/admin/syllabus"
            element={
              <AdminProtectedRoute>
                <AdminSyllabus />
              </AdminProtectedRoute>
            }
          />

          {/* ADMIN LIVE CLASSES */}

          <Route
            path="/admin/live-classes"
            element={
              <AdminProtectedRoute>
                <AdminLiveClasses />
              </AdminProtectedRoute>
            }
          />

          {/* ADMIN QUIZ MANAGEMENT */}

          <Route
            path="/admin/quizzes"
            element={
              <AdminProtectedRoute>
                <AdminQuizzes />
              </AdminProtectedRoute>
            }
          />

          {/* ADMIN ANALYTICS */}

          <Route
            path="/admin/analytics"
            element={
              <AdminProtectedRoute>
                <AdminAnalytics />
              </AdminProtectedRoute>
            }
          />

          {/* ADMIN QUESTION PAPERS */}

          <Route
            path="/admin/question-papers"
            element={
              <AdminProtectedRoute>
                <AdminQuestionPapers />
              </AdminProtectedRoute>
            }
          />

          {/* ADMIN COMPETITIVE COURSES */}

          <Route
            path="/admin/courses"
            element={
              <AdminProtectedRoute>
                <AdminCourses />
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
