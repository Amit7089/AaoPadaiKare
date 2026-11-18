
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  BookOpen,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileQuestion,
  Eye,
  EyeOff,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { getAdminToken } from "../../services/api";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const classes = [6, 7, 8, 9, 10, 11, 12];

const initialQuestion = {
  questionText: "",
  options: ["", "", "", ""],
  correctAnswerIndex: 0,
  marks: 1,
  explanation: "",
};

const initialForm = {
  title: "",
  description: "",
  classNo: "6",
  subject: "",
  chapter: "",
  durationMinutes: "30",
  passingMarks: "0",
  questions: [{ ...initialQuestion }],
};

const getEmptyForm = () => ({
  ...initialForm,
  questions: [
    {
      ...initialQuestion,
      options: ["", "", "", ""],
    },
  ],
});

export default function AdminQuizzes() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab =
    searchParams.get("tab") === "manage" ? "manage" : "create";

  const [quizzes, setQuizzes] = useState([]);
  const [form, setForm] = useState(getEmptyForm());

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");

  const token = getAdminToken();

  // Load all quizzes
  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/quizzes/admin/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Quizzes load nahi ho paye.");
      }

      setQuizzes(
        Array.isArray(data)
          ? data
          : data.quizzes || data.data || []
      );
    } catch (err) {
      setError(err.message || "Server connection error.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
    // Initial page load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter quizzes
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesClass =
        filterClass === "all" ||
        String(quiz.classNo) === filterClass;

      const searchText = search.toLowerCase();

      const matchesSearch =
        !searchText ||
        (quiz.title || "").toLowerCase().includes(searchText) ||
        (quiz.subject || "").toLowerCase().includes(searchText) ||
        (quiz.chapter || "").toLowerCase().includes(searchText);

      return matchesClass && matchesSearch;
    });
  }, [quizzes, filterClass, search]);

  // Statistics
  const stats = useMemo(
    () => ({
      total: quizzes.length,
      published: quizzes.filter((quiz) => quiz.isPublished).length,
      draft: quizzes.filter((quiz) => !quiz.isPublished).length,
      questions: quizzes.reduce(
        (total, quiz) => total + (quiz.questions?.length || 0),
        0
      ),
    }),
    [quizzes]
  );

  // Reset form
  const resetForm = () => {
    setForm(getEmptyForm());
    setEditingId(null);
  };

  // Change tab and URL
  const changeTab = (tab) => {
    setError("");
    setSuccess("");
    setSearchParams({ tab });
  };

  // Form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Question change
  const handleQuestionChange = (questionIndex, field, value) => {
    setForm((previous) => {
      const questions = [...previous.questions];

      questions[questionIndex] = {
        ...questions[questionIndex],
        [field]: value,
      };

      return {
        ...previous,
        questions,
      };
    });
  };

  // Option change
  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setForm((previous) => {
      const questions = [...previous.questions];

      const options = [...questions[questionIndex].options];
      options[optionIndex] = value;

      questions[questionIndex] = {
        ...questions[questionIndex],
        options,
      };

      return {
        ...previous,
        questions,
      };
    });
  };

  // Add question
  const addQuestion = () => {
    setForm((previous) => ({
      ...previous,
      questions: [
        ...previous.questions,
        {
          ...initialQuestion,
          options: ["", "", "", ""],
        },
      ],
    }));

    setError("");
  };

  // Remove question
  const removeQuestion = (index) => {
    if (form.questions.length === 1) {
      setError("Quiz mein kam se kam ek question hona zaroori hai.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      questions: previous.questions.filter(
        (_, questionIndex) => questionIndex !== index
      ),
    }));

    setError("");
  };

  // Calculate total marks
  const totalMarks = form.questions.reduce(
    (total, question) => total + Number(question.marks || 0),
    0
  );

  // Validate form
  const validateForm = () => {
    if (
      !form.title.trim() ||
      !form.subject.trim() ||
      !form.chapter.trim()
    ) {
      return "Please sabhi required details fill karein.";
    }

    if (
      !Number.isInteger(Number(form.durationMinutes)) ||
      Number(form.durationMinutes) < 1
    ) {
      return "Quiz duration kam se kam 1 minute honi chahiye.";
    }

    if (
      !Number.isInteger(Number(form.passingMarks)) ||
      Number(form.passingMarks) < 0 ||
      Number(form.passingMarks) > totalMarks
    ) {
      return "Passing marks valid hone chahiye aur total marks se zyada nahi ho sakte.";
    }

    if (!form.questions.length) {
      return "Quiz mein kam se kam ek question hona zaroori hai.";
    }

    for (let i = 0; i < form.questions.length; i++) {
      const question = form.questions[i];

      if (!question.questionText.trim()) {
        return `Question ${i + 1} ka text fill karein.`;
      }

      if (
        question.options.length !== 4 ||
        question.options.some((option) => !option.trim())
      ) {
        return `Question ${i + 1} ke sabhi 4 options fill karein.`;
      }

      if (
        !Number.isInteger(Number(question.correctAnswerIndex)) ||
        Number(question.correctAnswerIndex) < 0 ||
        Number(question.correctAnswerIndex) > 3
      ) {
        return `Question ${i + 1} ka correct answer select karein.`;
      }

      if (
        !Number.isInteger(Number(question.marks)) ||
        Number(question.marks) < 1
      ) {
        return `Question ${i + 1} ke marks kam se kam 1 hone chahiye.`;
      }
    }

    return null;
  };

  // Prepare API payload
  const preparePayload = () => ({
    title: form.title.trim(),
    description: form.description.trim(),
    classNo: Number(form.classNo),
    subject: form.subject.trim(),
    chapter: form.chapter.trim(),
    durationMinutes: Number(form.durationMinutes),
    passingMarks: Number(form.passingMarks),
    questions: form.questions.map((question) => ({
      questionText: question.questionText.trim(),
      options: question.options.map((option) => option.trim()),
      correctAnswerIndex: Number(question.correctAnswerIndex),
      marks: Number(question.marks),
      explanation: question.explanation.trim(),
    })),
  });

  // Create or update quiz
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingId);

      const url = isEditing
        ? `${API_URL}/quizzes/${editingId}`
        : `${API_URL}/quizzes`;

      const payload = preparePayload();

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(
          isEditing
            ? payload
            : { ...payload, isPublished: false }
        ),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Quiz update nahi ho paya."
              : "Quiz create nahi ho paya.")
        );
      }

      setSuccess(
        isEditing
          ? "Quiz successfully update ho gaya!"
          : "Quiz successfully create ho gaya! Ab aap ise publish kar sakte hain."
      );

      resetForm();
      await loadQuizzes();

      if (isEditing) {
        changeTab("manage");
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // Edit quiz - Load full quiz with correct answers
  const handleEdit = async (quizId) => {
    try {
      setEditLoading(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/quizzes/admin/${quizId}/edit`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Quiz details load nahi ho paye."
        );
      }

      const quiz = data.quiz;

      if (!quiz) {
        throw new Error("Quiz data nahi mila.");
      }

      setForm({
        title: quiz.title || "",
        description: quiz.description || "",
        classNo: String(quiz.classNo || 6),
        subject: quiz.subject || "",
        chapter: quiz.chapter || "",
        durationMinutes: String(quiz.durationMinutes || 30),
        passingMarks: String(quiz.passingMarks ?? 0),
        questions:
          quiz.questions?.length > 0
            ? quiz.questions.map((question) => ({
                questionText: question.questionText || "",
                options: [
                  ...(question.options || []),
                  "",
                  "",
                  "",
                  "",
                ].slice(0, 4),
                correctAnswerIndex: Number(
                  question.correctAnswerIndex ?? 0
                ),
                marks: Number(question.marks ?? 1),
                explanation: question.explanation || "",
              }))
            : [
                {
                  ...initialQuestion,
                  options: ["", "", "", ""],
                },
              ],
      });

      setEditingId(quiz._id);
      changeTab("create");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      setSuccess("Quiz edit mode mein load ho gaya. Changes karke Save karein.");
    } catch (err) {
      setError(err.message || "Quiz load karte waqt error aaya.");
    } finally {
      setEditLoading(false);
    }
  };

  // Cancel editing
  const cancelEdit = () => {
    if (
      !window.confirm(
        "Kya aap editing cancel karke changes discard karna chahte hain?"
      )
    ) {
      return;
    }

    resetForm();
    setError("");
    setSuccess("Editing cancel kar di gayi.");
    changeTab("manage");
  };

  // Publish / Unpublish quiz
  const handlePublishToggle = async (quiz) => {
    const action = quiz.isPublished ? "unpublish" : "publish";

    if (
      !window.confirm(
        `Kya aap is quiz ko ${action} karna chahte hain?`
      )
    ) {
      return;
    }

    try {
      setUpdatingId(quiz._id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/quizzes/${quiz._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isPublished: !quiz.isPublished,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Quiz status update nahi hua."
        );
      }

      setSuccess(
        quiz.isPublished
          ? "Quiz successfully unpublished."
          : "Quiz successfully published."
      );

      await loadQuizzes();
    } catch (err) {
      setError(err.message || "Status update karte waqt error aaya.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete quiz
  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Kya aap is quiz ko permanently delete karna chahte hain?"
      )
    ) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await fetch(`${API_URL}/quizzes/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Quiz delete nahi ho paya.");
      }

      setSuccess("Quiz successfully delete ho gaya!");

      await loadQuizzes();
    } catch (err) {
      setError(err.message || "Delete karte waqt error aaya.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <Link
              to="/admin/dashboard"
              className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              Quiz Management
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create, edit and manage online MCQ tests for students.
            </p>
          </div>

          <button
            onClick={loadQuizzes}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8">
        {/* Alerts */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            <CheckCircle2 size={19} />
            <span>{success}</span>
          </div>
        )}

        {/* Statistics */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: "Total Quizzes",
              value: stats.total,
              icon: FileQuestion,
            },
            {
              label: "Published",
              value: stats.published,
              icon: CheckCircle2,
            },
            {
              label: "Drafts",
              value: stats.draft,
              icon: EyeOff,
            },
            {
              label: "Total Questions",
              value: stats.questions,
              icon: BookOpen,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {stat.label}
                    </p>
                    <h2 className="mt-2 text-3xl font-black text-slate-900">
                      {loading ? "—" : stat.value}
                    </h2>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
                    <Icon size={24} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Quiz Navigation */}
        <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <button
            type="button"
            onClick={() => changeTab("create")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeTab === "create"
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-blue-50"
            }`}
          >
            <Plus size={17} />
            Create Quiz
          </button>

          <button
            type="button"
            onClick={() => changeTab("manage")}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition ${
              activeTab === "manage"
                ? "bg-blue-600 text-white shadow"
                : "bg-slate-100 text-slate-600 hover:bg-blue-50"
            }`}
          >
            <FileQuestion size={17} />
            Manage Quizzes
          </button>
        </div>

        {/* CREATE / EDIT QUIZ TAB */}
        {activeTab === "create" && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-6 py-5">
              <div
                className={`rounded-xl p-3 ${
                  editingId
                    ? "bg-amber-50 text-amber-600"
                    : "bg-blue-50 text-blue-600"
                }`}
              >
                {editingId ? <Pencil size={21} /> : <Plus size={21} />}
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingId ? "Edit Quiz" : "Create New Quiz"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editingId
                    ? "Update quiz details, questions and correct answers."
                    : "Add quiz details and MCQ questions."}
                </p>
              </div>

              {editingId && (
                <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                  Editing Mode
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-7 p-6">
              {/* Basic Details */}
              <div>
                <h3 className="mb-4 font-bold text-slate-800">
                  Quiz Details
                </h3>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Quiz Title *
                    </label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                      placeholder="e.g. Mathematics Chapter 1 Test"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Select Class *
                    </label>
                    <select
                      name="classNo"
                      value={form.classNo}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                    >
                      {classes.map((classNo) => (
                        <option key={classNo} value={classNo}>
                          Class {classNo}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Subject *
                    </label>
                    <input
                      name="subject"
                      value={form.subject}
                      onChange={handleFormChange}
                      placeholder="e.g. Mathematics"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Chapter *
                    </label>
                    <input
                      name="chapter"
                      value={form.chapter}
                      onChange={handleFormChange}
                      placeholder="e.g. Real Numbers"
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Duration (Minutes) *
                    </label>
                    <input
                      type="number"
                      name="durationMinutes"
                      min="1"
                      value={form.durationMinutes}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Passing Marks *
                    </label>
                    <input
                      type="number"
                      name="passingMarks"
                      min="0"
                      max={totalMarks}
                      value={form.passingMarks}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Total Marks
                    </label>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-black text-blue-700">
                      {totalMarks} Marks
                    </div>
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      rows="3"
                      placeholder="Quiz ke baare mein details..."
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="border-t border-slate-100 pt-6">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Quiz Questions
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Har question ke 4 options aur correct answer set karein.
                    </p>
                  </div>

                  <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                    {form.questions.length} Questions
                  </span>
                </div>

                <div className="space-y-6">
                  {form.questions.map((question, questionIndex) => (
                    <div
                      key={questionIndex}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5"
                    >
                      <div className="mb-5 flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-800">
                          Question {questionIndex + 1}
                        </h4>

                        <button
                          type="button"
                          onClick={() => removeQuestion(questionIndex)}
                          className="flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={15} />
                          Remove
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-700">
                            Question *
                          </label>
                          <textarea
                            value={question.questionText}
                            onChange={(e) =>
                              handleQuestionChange(
                                questionIndex,
                                "questionText",
                                e.target.value
                              )
                            }
                            rows="2"
                            placeholder="Enter your question..."
                            required
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex}>
                              <label className="mb-2 block text-sm font-bold text-slate-700">
                                Option {optionIndex + 1} *
                              </label>
                              <input
                                value={option}
                                onChange={(e) =>
                                  handleOptionChange(
                                    questionIndex,
                                    optionIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Enter option ${optionIndex + 1}`}
                                required
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                              />
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                              Correct Answer *
                            </label>
                            <select
                              value={question.correctAnswerIndex}
                              onChange={(e) =>
                                handleQuestionChange(
                                  questionIndex,
                                  "correctAnswerIndex",
                                  Number(e.target.value)
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            >
                              {question.options.map((_, index) => (
                                <option key={index} value={index}>
                                  Option {index + 1}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-bold text-slate-700">
                              Marks *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={question.marks}
                              onChange={(e) =>
                                handleQuestionChange(
                                  questionIndex,
                                  "marks",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-bold text-slate-700">
                            Explanation (Optional)
                          </label>
                          <textarea
                            value={question.explanation}
                            onChange={(e) =>
                              handleQuestionChange(
                                questionIndex,
                                "explanation",
                                e.target.value
                              )
                            }
                            rows="2"
                            placeholder="Explain the correct answer..."
                            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={addQuestion}
                  className="mt-5 flex items-center gap-2 rounded-xl border border-dashed border-blue-300 bg-blue-50 px-5 py-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                >
                  <Plus size={18} />
                  Add Another Question
                </button>
              </div>

              {/* Submit */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-sm text-slate-500">
                    {editingId
                      ? "Save your changes to update this quiz."
                      : "New quizzes will be saved as drafts."}
                  </p>

                  {editingId && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={saving}
                      className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700 disabled:opacity-50"
                    >
                      <X size={15} />
                      Cancel Editing
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingId ? <Save size={19} /> : <Plus size={19} />}
                  {saving
                    ? editingId
                      ? "Saving Changes..."
                      : "Creating Quiz..."
                    : editingId
                    ? "Save Changes"
                    : "Create Quiz"}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* MANAGE QUIZZES TAB */}
        {activeTab === "manage" && (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  All Quizzes
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View, edit, publish and manage your quizzes.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                {filteredQuizzes.length} Quizzes
              </span>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 gap-3 border-b border-slate-100 bg-slate-50/70 p-5 md:grid-cols-2">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={17}
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search quiz, subject or chapter..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="all">All Classes</option>
                {classes.map((classNo) => (
                  <option key={classNo} value={classNo}>
                    Class {classNo}
                  </option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="p-12 text-center text-sm text-slate-500">
                Loading quizzes...
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="p-12 text-center">
                <FileQuestion
                  className="mx-auto mb-3 text-slate-300"
                  size={42}
                />
                <h3 className="font-bold text-slate-700">
                  No quizzes found
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Create a new quiz to get started.
                </p>
                <button
                  type="button"
                  onClick={() => changeTab("create")}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  <Plus size={17} />
                  Create Your First Quiz
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Quiz Details</th>
                      <th className="px-5 py-4">Class</th>
                      <th className="px-5 py-4">Questions</th>
                      <th className="px-5 py-4">Duration</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {filteredQuizzes.map((quiz) => (
                      <tr
                        key={quiz._id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800">
                            {quiz.title}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {quiz.subject} • {quiz.chapter}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                            Class {quiz.classNo}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {quiz.questions?.length || 0}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          <span className="flex items-center gap-2">
                            <Clock size={15} />
                            {quiz.durationMinutes} min
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                              quiz.isPublished
                                ? "bg-green-50 text-green-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {quiz.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => handleEdit(quiz._id)}
                              disabled={editLoading}
                              title="Edit quiz"
                              className="rounded-lg border border-amber-100 p-2 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                            >
                              {editLoading ? (
                                <RefreshCw
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Pencil size={16} />
                              )}
                            </button>

                            {/* Publish / Unpublish */}
                            <button
                              type="button"
                              onClick={() => handlePublishToggle(quiz)}
                              disabled={updatingId === quiz._id}
                              title={
                                quiz.isPublished
                                  ? "Unpublish quiz"
                                  : "Publish quiz"
                              }
                              className="rounded-lg border border-blue-100 p-2 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                            >
                              {quiz.isPublished ? (
                                <EyeOff size={16} />
                              ) : (
                                <Eye size={16} />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDelete(quiz._id)}
                              disabled={deletingId === quiz._id}
                              title="Delete quiz"
                              className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} Aao Padai Kare. All rights reserved.
          </p>
          <p className="flex items-center gap-2">
            <GraduationCap size={15} />
            Online Quiz Management
          </p>
        </footer>
      </main>
    </div>
  );
}
