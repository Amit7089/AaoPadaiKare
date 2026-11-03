
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/+$/, "");

// ==============================
// ADMIN TOKEN
// ==============================

export const getAdminToken = () =>
  localStorage.getItem("adminToken");

export const saveAdminToken = (token) => {
  localStorage.setItem("adminToken", token);
};

export const clearAdminToken = () => {
  localStorage.removeItem("adminToken");
};

// ==============================
// STUDENT TOKEN
// ==============================

export const getStudentToken = () =>
  localStorage.getItem("studentToken");

export const saveStudentToken = (token) => {
  localStorage.setItem("studentToken", token);
};

export const clearStudentToken = () => {
  localStorage.removeItem("studentToken");
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
      "Backend se connection nahi ho pa raha. Internet ya server connection check karein."
    );
  }

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Server se valid response nahi mila. Please try again."
    );
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

    throw new Error(
      result.message || `Request failed with status ${response.status}`
    );
  }

  return result;
}

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
      "none"
    ),

  getAdmin: () =>
    request("/admin/me", {}, "admin"),

  // ==============================
  // SYLLABUS
  // ==============================

  getSyllabus: (classNo) =>
    request(
      classNo ? `/syllabus/class/${classNo}` : "/syllabus"
    ),

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
      "admin"
    ),

  deleteChapter: (id) =>
    request(
      `/syllabus/${id}`,
      {
        method: "DELETE",
      },
      "admin"
    ),

  // ==============================
  // NOTES
  // ==============================

  getNotes: (filters = {}) => {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        params.set(key, value);
      }
    });

    const query = params.toString();

    return request(`/notes${query ? `?${query}` : ""}`);
  },

  // Add New Note
  addNote: (formData) =>
    request(
      "/notes",
      {
        method: "POST",
        body: formData,
      },
      "admin"
    ),

  // Update Existing Note
  updateNote: (id, formData) =>
    request(
      `/notes/${id}`,
      {
        method: "PUT",
        body: formData,
      },
      "admin"
    ),

  // Delete Note
  deleteNote: (id) =>
    request(
      `/notes/${id}`,
      {
        method: "DELETE",
      },
      "admin"
    ),

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
      "none"
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
      "none"
    ),

  getStudent: () =>
    request("/student/me", {}, "student"),
};
