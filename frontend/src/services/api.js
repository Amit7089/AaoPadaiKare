const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

// ==============================
// ADMIN TOKEN
// ==============================

export const getAdminToken = () => {
  return localStorage.getItem("adminToken");
};

export const saveAdminToken = (token) => {
  localStorage.setItem("adminToken", token);
  window.dispatchEvent(new Event("authChange"));
};

export const clearAdminToken = () => {
  localStorage.removeItem("adminToken");
  window.dispatchEvent(new Event("authChange"));
};

// ==============================
// STUDENT TOKEN
// ==============================

export const getStudentToken = () => {
  return localStorage.getItem("studentToken");
};

export const saveStudentToken = (token) => {
  localStorage.setItem("studentToken", token);
  window.dispatchEvent(new Event("authChange"));
};

export const clearStudentToken = () => {
  localStorage.removeItem("studentToken");
  window.dispatchEvent(new Event("authChange"));
};

// ==============================
// COMMON API REQUEST
// ==============================

async function request(endpoint, options = {}, authType = "none") {
  const headers = new Headers(options.headers || {});

  let token = null;

  if (authType === "admin") {
    token = getAdminToken();
  } else if (authType === "student") {
    token = getStudentToken();
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("API connection error:", error);

    throw new Error(
      "Backend se connection nahi ho pa raha. Internet ya server connection check karein.",
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("Server se valid response nahi mila. Please try again.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (authType === "admin" && token) {
        clearAdminToken();
      }

      if (authType === "student" && token) {
        clearStudentToken();
      }
    }

    const error = new Error(
      result.message || `Request failed with status ${response.status}`,
    );

    error.status = response.status;
    error.data = result;

    throw error;
  }

  return result;
}

// ==============================
// COMMON QUERY BUILDER
// ==============================

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });

  return params.toString();
};

// ==============================
// ALL API FUNCTIONS
// ==============================

export const api = {
  // ==============================
  // ADMIN AUTHENTICATION
  // ==============================

  adminLogin: (data) =>
    request(
      "/admin/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "none",
    ),

  getAdmin: () => request("/admin/me", {}, "admin"),

  // ==============================
  // SYLLABUS
  // ==============================

  getSyllabus: (classNo) =>
    request(classNo ? `/syllabus/class/${classNo}` : "/syllabus"),

  addChapter: (data) =>
    request(
      "/syllabus",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "admin",
    ),

  deleteChapter: (id) =>
    request(
      `/syllabus/${id}`,
      {
        method: "DELETE",
      },
      "admin",
    ),

  // ==============================
  // STUDENT NOTES
  // ==============================

  getNotes: (filters = {}) => {
    const query = buildQuery(filters);

    return request(`/notes${query ? `?${query}` : ""}`, {}, "student");
  },

  getNote: (id) => request(`/notes/${id}`, {}, "student"),

  // ==============================
  // ADMIN NOTES
  // ==============================

  getAdminNotes: (filters = {}) => {
    const query = buildQuery(filters);

    return request(`/notes/admin/all${query ? `?${query}` : ""}`, {}, "admin");
  },

  getAdminNote: (id) => request(`/notes/admin/${id}`, {}, "admin"),

  addNote: (formData) =>
    request(
      "/notes",
      {
        method: "POST",
        body: formData,
      },
      "admin",
    ),

  updateNote: (id, formData) =>
    request(
      `/notes/${id}`,
      {
        method: "PUT",
        body: formData,
      },
      "admin",
    ),

  deleteNote: (id) =>
    request(
      `/notes/${id}`,
      {
        method: "DELETE",
      },
      "admin",
    ),

  // ==============================
  // QUESTION PAPERS - ADMIN
  // ==============================

  getAdminQuestionPapers: (filters = {}) => {
    const query = buildQuery(filters);

    return request(
      `/question-papers/admin/all${query ? `?${query}` : ""}`,
      {},
      "admin",
    );
  },

  getAdminQuestionPaper: (id) =>
    request(`/question-papers/admin/${id}`, {}, "admin"),

  addQuestionPaper: (formData) =>
    request(
      "/question-papers",
      {
        method: "POST",
        body: formData,
      },
      "admin",
    ),

  updateQuestionPaper: (id, formData) =>
    request(
      `/question-papers/${id}`,
      {
        method: "PUT",
        body: formData,
      },
      "admin",
    ),

  deleteQuestionPaper: (id) =>
    request(
      `/question-papers/${id}`,
      {
        method: "DELETE",
      },
      "admin",
    ),

  // ==============================
  // QUESTION PAPERS - STUDENT
  // ==============================

  getQuestionPapers: (filters = {}) => {
    const query = buildQuery(filters);

    return request(
      `/question-papers${query ? `?${query}` : ""}`,
      {},
      "student",
    );
  },

  getQuestionPaper: (id) => request(`/question-papers/${id}`, {}, "student"),

  // ==============================
  // STUDENT AUTHENTICATION
  // ==============================

  studentRegister: (data) =>
    request(
      "/student/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "none",
    ),

  studentLogin: (data) =>
    request(
      "/student/login",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "none",
    ),

  getStudent: () => request("/student/me", {}, "student"),

  // ==============================
  // MEMBERSHIP PLANS
  // ==============================

  getMembershipPlans: () => request("/membership/plans"),

  getMyMemberships: () => request("/membership/my-memberships", {}, "student"),

  checkMembership: (classNo) =>
    request(`/membership/check/${classNo}`, {}, "student"),

  // ==============================
  // STUDENT QUIZ PERFORMANCE
  // ==============================

  getStudentQuizResults: () => request("/student/results", {}, "student"),

  // ==============================
  // MEMBERSHIP RAZORPAY PAYMENT
  // ==============================

  createMembershipOrder: (data) =>
    request(
      "/membership/payment/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "student",
    ),

  verifyMembershipPayment: (data) =>
    request(
      "/membership/payment/verify-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "student",
    ),

  // ==================================================
  // COMPETITIVE COURSES - ADMIN
  // ==================================================

  getAdminCourses: () => request("/admin/courses", {}, "admin"),

  getAdminCourse: (id) => request(`/admin/courses/${id}`, {}, "admin"),

  addCourse: (data) =>
    request(
      "/admin/courses",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "admin",
    ),

  updateCourse: (id, data) =>
    request(
      `/admin/courses/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "admin",
    ),

  updateCoursePublishStatus: (id, isPublished) =>
    request(
      `/admin/courses/${id}/publish`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isPublished }),
      },
      "admin",
    ),

  deleteCourse: (id) =>
    request(
      `/admin/courses/${id}`,
      {
        method: "DELETE",
      },
      "admin",
    ),

  // ==================================================
  // COURSE SUBJECTS - ADMIN
  // ==================================================

  getCourseSubjects: (courseId) =>
    request(`/admin/courses/${courseId}/subjects`, {}, "admin"),

  addCourseSubject: (courseId, data) =>
    request(
      `/admin/courses/${courseId}/subjects`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "admin",
    ),

  updateCourseSubject: (subjectId, data) =>
    request(
      `/admin/courses/subjects/${subjectId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "admin",
    ),

  deleteCourseSubject: (subjectId) =>
    request(
      `/admin/courses/subjects/${subjectId}`,
      {
        method: "DELETE",
      },
      "admin",
    ),

  // ==================================================
  // COURSE LESSONS - ADMIN
  // ==================================================

  getAdminCourseLessons: (courseId, subjectId) =>
    request(
      `/admin/courses/${courseId}/subjects/${subjectId}/lessons`,
      {},
      "admin",
    ),

  getAdminCourseLesson: (lessonId) =>
    request(`/admin/courses/lessons/${lessonId}`, {}, "admin"),

  addCourseLesson: (courseId, subjectId, formData) =>
    request(
      `/admin/courses/${courseId}/subjects/${subjectId}/lessons`,
      {
        method: "POST",
        body: formData,
      },
      "admin",
    ),

  updateCourseLesson: (lessonId, formData) =>
    request(
      `/admin/courses/lessons/${lessonId}`,
      {
        method: "PUT",
        body: formData,
      },
      "admin",
    ),

  deleteCourseLesson: (lessonId) =>
    request(
      `/admin/courses/lessons/${lessonId}`,
      {
        method: "DELETE",
      },
      "admin",
    ),

  // ==================================================
  // COMPETITIVE COURSES - STUDENT
  // ==================================================

  getCourses: (filters = {}) => {
    const query = buildQuery(filters);

    return request(`/courses${query ? `?${query}` : ""}`, {}, "student");
  },

  getCourse: (slug, language = "Hindi") =>
    request(
      `/courses/${encodeURIComponent(slug)}?language=${encodeURIComponent(language)}`,
      {},
      "student",
    ),

  getCourseLesson: (courseId, lessonId) =>
    request(`/courses/${courseId}/lessons/${lessonId}`, {}, "student"),

  // ==================================================
  // COMPETITIVE COURSE PAYMENT - RAZORPAY
  // ==================================================

  createCourseOrder: (data) =>
    request(
      "/course-payment/create-order",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "student",
    ),

  verifyCoursePayment: (data) =>
    request(
      "/course-payment/verify-payment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      },
      "student",
    ),
};

// ==================================================
// NAMED EXPORTS - COMPETITIVE COURSES
// ==================================================

export const {
  // Admin Courses
  getAdminCourses,
  getAdminCourse,
  addCourse,
  updateCourse,
  updateCoursePublishStatus,
  deleteCourse,

  // Course Subjects
  getCourseSubjects,
  addCourseSubject,
  updateCourseSubject,
  deleteCourseSubject,

  // Course Lessons
  getAdminCourseLessons,
  getAdminCourseLesson,
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,

  // Student Courses
  getCourses,
  getCourse,
  getCourseLesson,

  // Course Payments
  createCourseOrder,
  verifyCoursePayment,
} = api;
