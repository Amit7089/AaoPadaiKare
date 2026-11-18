
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  Upload,
  Plus,
  Trash2,
  RefreshCw,
  LoaderCircle,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  Pencil,
  X,
  BookOpen,
  Crown,
  Lock,
  Unlock,
  Filter,
} from "lucide-react";

import { api, clearAdminToken } from "../../services/api";

const classes = [6, 7, 8, 9, 10, 11, 12];

const subjects = [
  "Hindi",
  "English",
  "Mathematics",
  "Science",
  "Social Science",
  "Sanskrit",
];

const years = Array.from(
  { length: new Date().getFullYear() - 2019 + 1 },
  (_, index) => String(2020 + index)
);

const initialForm = {
  title: "",
  classNo: "10",
  subject: "Mathematics",
  year: String(new Date().getFullYear()),
  paperType: "question-paper",
  description: "",
  accessType: "free",
  isPublished: false,
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100";

const getResponseData = (response) => {
  return response?.data ?? response;
};

const getPaperList = (response) => {
  const data = getResponseData(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.papers)) return data.papers;
  if (Array.isArray(data?.questionPapers)) return data.questionPapers;

  return [];
};

const getPaperObject = (response) => {
  const data = getResponseData(response);

  return data?.paper || data?.questionPaper || data;
};

export default function AdminQuestionPapers() {
  const navigate = useNavigate();

  const [papers, setPapers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [pdf, setPdf] = useState(null);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [previewingId, setPreviewingId] = useState(null);
  const [statusId, setStatusId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterYear, setFilterYear] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ----------------------------------
  // Load all question papers
  // ----------------------------------

  const loadPapers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.getAdminQuestionPapers();
      setPapers(getPaperList(response));
    } catch (err) {
      setError(err.message || "Question papers load nahi ho paye.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPapers();
  }, [loadPapers]);

  // ----------------------------------
  // Logout
  // ----------------------------------

  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) {
      return;
    }

    clearAdminToken();
    navigate("/admin/login", { replace: true });
  };

  // ----------------------------------
  // Form change
  // ----------------------------------

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ----------------------------------
  // Reset form
  // ----------------------------------

  const resetForm = () => {
    setForm(initialForm);
    setPdf(null);
    setEditingId(null);

    const fileInput = document.getElementById("question-paper-pdf");

    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ----------------------------------
  // PDF validation
  // ----------------------------------

  const validatePdf = () => {
    if (!pdf) return true;

    if (
      pdf.type !== "application/pdf" &&
      !pdf.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Only PDF files are allowed.");
      return false;
    }

    if (pdf.size > 10 * 1024 * 1024) {
      setError("PDF size must be less than 10 MB.");
      return false;
    }

    return true;
  };

  // ----------------------------------
  // Add / Update question paper
  // ----------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!form.title.trim()) {
      setError("Please enter paper title.");
      return;
    }

    if (!form.subject) {
      setError("Please select a subject.");
      return;
    }

    if (!editingId && !pdf) {
      setError("Please select a PDF file.");
      return;
    }

    if (!validatePdf()) return;

    setSaving(true);

    try {
      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("classNo", form.classNo);
      formData.append("subject", form.subject);
      formData.append("year", form.year);
      formData.append("paperType", form.paperType);
      formData.append("description", form.description.trim());
      formData.append("accessType", form.accessType);
      formData.append("isPublished", String(form.isPublished));

      if (pdf) {
        formData.append("pdf", pdf);
      }

      if (editingId) {
        await api.updateQuestionPaper(editingId, formData);
        setMessage("Question paper updated successfully.");
      } else {
        await api.addQuestionPaper(formData);
        setMessage("Question paper uploaded successfully.");
      }

      resetForm();
      await loadPapers();
    } catch (err) {
      setError(err.message || "Question paper save nahi ho paya.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------
  // Edit paper
  // ----------------------------------

  const handleEdit = async (id) => {
    setError("");
    setMessage("");

    try {
      setSaving(true);

      const response = await api.getAdminQuestionPaper(id);
      const paper = getPaperObject(response);

      if (!paper?._id) {
        throw new Error("Question paper details nahi mile.");
      }

      setForm({
        title: paper.title || "",
        classNo: String(paper.classNo || "10"),
        subject: paper.subject || "Mathematics",
        year: String(paper.year || new Date().getFullYear()),
        paperType: paper.paperType || "question-paper",
        description: paper.description || "",
        accessType: paper.accessType || "free",
        isPublished: Boolean(paper.isPublished),
      });

      setEditingId(paper._id);
      setPdf(null);

      const fileInput = document.getElementById("question-paper-pdf");

      if (fileInput) {
        fileInput.value = "";
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      setError(err.message || "Paper edit details load nahi hue.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------
  // Preview PDF
  // ----------------------------------

  const handlePreview = async (id) => {
    setError("");
    setPreviewingId(id);

    try {
      const response = await api.getAdminQuestionPaper(id);
      const paper = getPaperObject(response);

      if (!paper?.pdfUrl) {
        throw new Error("PDF preview URL available nahi hai.");
      }

      window.open(paper.pdfUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      setError(err.message || "PDF preview open nahi ho paya.");
    } finally {
      setPreviewingId(null);
    }
  };

  // ----------------------------------
  // Delete paper
  // ----------------------------------

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this question paper?"
      )
    ) {
      return;
    }

    setError("");
    setMessage("");
    setDeletingId(id);

    try {
      await api.deleteQuestionPaper(id);

      setMessage("Question paper deleted successfully.");

      if (editingId === id) {
        resetForm();
      }

      await loadPapers();
    } catch (err) {
      setError(err.message || "Question paper delete nahi ho paya.");
    } finally {
      setDeletingId(null);
    }
  };

  // ----------------------------------
  // Publish / Unpublish
  // ----------------------------------

  const togglePublish = async (paper) => {
    setError("");
    setMessage("");
    setStatusId(paper._id);

    try {
      const formData = new FormData();

      formData.append("title", paper.title || "");
      formData.append("classNo", String(paper.classNo));
      formData.append("subject", paper.subject || "");
      formData.append("year", String(paper.year));
      formData.append("paperType", paper.paperType);
      formData.append("description", paper.description || "");
      formData.append("accessType", paper.accessType);
      formData.append("isPublished", String(!paper.isPublished));

      await api.updateQuestionPaper(paper._id, formData);

      setMessage(
        !paper.isPublished
          ? "Question paper published successfully."
          : "Question paper unpublished successfully."
      );

      await loadPapers();
    } catch (err) {
      setError(err.message || "Publish status update nahi ho paya.");
    } finally {
      setStatusId(null);
    }
  };

  // ----------------------------------
  // Filter options
  // ----------------------------------

  const filterSubjects = useMemo(() => {
    return [
      ...new Set(
        papers.map((paper) => paper.subject).filter(Boolean)
      ),
    ].sort();
  }, [papers]);

  const filterYears = useMemo(() => {
    return [
      ...new Set(
        papers.map((paper) => String(paper.year)).filter(Boolean)
      ),
    ].sort((a, b) => Number(b) - Number(a));
  }, [papers]);

  // ----------------------------------
  // Search and filter papers
  // ----------------------------------

  const filteredPapers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return papers.filter((paper) => {
      const matchesClass =
        filterClass === "all" ||
        String(paper.classNo) === filterClass;

      const matchesSubject =
        filterSubject === "all" ||
        paper.subject === filterSubject;

      const matchesYear =
        filterYear === "all" ||
        String(paper.year) === filterYear;

      const matchesType =
        filterType === "all" ||
        paper.paperType === filterType;

      const searchableText = [
        paper.title,
        paper.subject,
        paper.description,
        paper.year,
        paper.pdfName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !search || searchableText.includes(search);

      return (
        matchesClass &&
        matchesSubject &&
        matchesYear &&
        matchesType &&
        matchesSearch
      );
    });
  }, [
    papers,
    searchTerm,
    filterClass,
    filterSubject,
    filterYear,
    filterType,
  ]);

  const publishedCount = papers.filter(
    (paper) => paper.isPublished
  ).length;

  const premiumCount = papers.filter(
    (paper) => paper.accessType === "premium"
  ).length;

  // ----------------------------------
  // UI
  // ----------------------------------

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-7 sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/admin/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>

            <p className="text-xs font-bold tracking-widest text-blue-600">
              AAO PADAI KARE / ADMIN
            </p>

            <h1 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">
              Question Papers Management
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Upload, manage and publish previous year and solved papers.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadPapers}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-100"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </header>

        {/* Statistics */}
        <section className="mb-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <FileText className="mb-3 text-blue-600" size={24} />
            <p className="text-3xl font-black text-slate-900">
              {papers.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Total Papers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <CheckCircle2 className="mb-3 text-emerald-600" size={24} />
            <p className="text-3xl font-black text-slate-900">
              {publishedCount}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Published
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Crown className="mb-3 text-amber-500" size={24} />
            <p className="text-3xl font-black text-slate-900">
              {premiumCount}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Premium Papers
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <BookOpen className="mb-3 text-violet-600" size={24} />
            <p className="text-3xl font-black text-slate-900">
              {new Set(papers.map((paper) => paper.classNo)).size}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Classes Covered
            </p>
          </div>
        </section>

        {/* Alerts */}
        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={19} />
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            <AlertCircle size={19} />
            <span className="flex-1">{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              className="rounded-lg p-1 hover:bg-red-100"
            >
              <X size={17} />
            </button>
          </div>
        )}

        {/* Main Layout */}
        <section className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">

          {/* Upload / Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="mb-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  {editingId ? "Edit Question Paper" : "Upload New Paper"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Enter paper details and upload its PDF.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  <X size={15} />
                  Cancel
                </button>
              )}
            </div>

            {/* Paper Title */}
            <label className="mb-2 block text-sm font-bold text-slate-700">
              Paper Title
            </label>

            <input
              name="title"
              className={inputClass}
              placeholder="Example: Class 10 Mathematics 2025"
              value={form.title}
              onChange={handleChange}
              required
            />

            {/* Class and Subject */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Select Class
                </label>

                <select
                  name="classNo"
                  className={inputClass}
                  value={form.classNo}
                  onChange={handleChange}
                >
                  {classes.map((n) => (
                    <option key={n} value={n}>
                      Class {n}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Select Subject
                </label>

                <select
                  name="subject"
                  className={inputClass}
                  value={form.subject}
                  onChange={handleChange}
                >
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year and Paper Type */}
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Paper Year
                </label>

                <select
                  name="year"
                  className={inputClass}
                  value={form.year}
                  onChange={handleChange}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700">
                  Paper Type
                </label>

                <select
                  name="paperType"
                  className={inputClass}
                  value={form.paperType}
                  onChange={handleChange}
                >
                  <option value="question-paper">
                    Question Paper
                  </option>
                  <option value="solved-paper">
                    Solved Paper
                  </option>
                </select>
              </div>
            </div>

            {/* Description */}
            <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
              Description
            </label>

            <textarea
              name="description"
              className={`${inputClass} resize-y`}
              rows={3}
              placeholder="Enter paper details (optional)..."
              value={form.description}
              onChange={handleChange}
            />

            {/* PDF Upload */}
            <label className="mb-2 mt-5 block text-sm font-bold text-slate-700">
              Upload PDF {editingId ? "(Optional)" : ""}
            </label>

            <input
              id="question-paper-pdf"
              type="file"
              accept="application/pdf,.pdf"
              className={inputClass}
              onChange={(event) => {
                setPdf(event.target.files?.[0] || null);
                setError("");
              }}
            />

            <p className="mt-2 text-xs text-slate-400">
              PDF format only. Maximum file size: 10 MB.
              {editingId && " Leave empty to keep the existing PDF."}
            </p>

            {pdf && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
                <FileText size={18} />
                <span className="min-w-0 flex-1 truncate">
                  {pdf.name}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setPdf(null);
                    const input = document.getElementById(
                      "question-paper-pdf"
                    );
                    if (input) input.value = "";
                  }}
                  className="rounded-lg p-1 hover:bg-blue-100"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Free / Premium */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Paper Access
              </label>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,
                      accessType: "free",
                    }))
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-bold transition ${
                    form.accessType === "free"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Unlock size={17} />
                  Free
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setForm((previous) => ({
                      ...previous,
                      accessType: "premium",
                    }))
                  }
                  className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-bold transition ${
                    form.accessType === "premium"
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <Crown size={17} />
                  Premium
                </button>
              </div>

              <p className="mt-2 text-xs text-slate-500">
                Premium papers are accessible only to students with an
                active membership for the selected class.
              </p>
            </div>

            {/* Publish checkbox */}
            <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
              <input
                type="checkbox"
                name="isPublished"
                checked={form.isPublished}
                onChange={handleChange}
                className="h-5 w-5 accent-blue-600"
              />

              <div>
                <p className="text-sm font-bold text-blue-800">
                  Publish Paper
                </p>
                <p className="mt-1 text-xs text-blue-700">
                  Published papers can appear on the student website.
                </p>
              </div>
            </label>

            {/* Submit */}
            <button
              type="submit"
              disabled={saving || loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle size={19} className="animate-spin" />
              ) : editingId ? (
                <Pencil size={18} />
              ) : (
                <Upload size={18} />
              )}

              {saving
                ? "Please wait..."
                : editingId
                  ? "Update Question Paper"
                  : "Upload Question Paper"}
            </button>
          </form>

          {/* Papers List */}
          <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-slate-900">
                  Uploaded Papers
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manage all uploaded question and solved papers.
                </p>
              </div>

              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                {filteredPapers.length} / {papers.length} Papers
              </span>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search title, subject, year..."
                className={`${inputClass} pl-10`}
              />
            </div>

            {/* Filters */}
            <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <select
                className={inputClass}
                value={filterClass}
                onChange={(event) => setFilterClass(event.target.value)}
              >
                <option value="all">All Classes</option>
                {classes.map((n) => (
                  <option key={n} value={String(n)}>
                    Class {n}
                  </option>
                ))}
              </select>

              <select
                className={inputClass}
                value={filterSubject}
                onChange={(event) => setFilterSubject(event.target.value)}
              >
                <option value="all">All Subjects</option>
                {filterSubjects.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>

              <select
                className={inputClass}
                value={filterYear}
                onChange={(event) => setFilterYear(event.target.value)}
              >
                <option value="all">All Years</option>
                {filterYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                className={inputClass}
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
              >
                <option value="all">All Paper Types</option>
                <option value="question-paper">Question Paper</option>
                <option value="solved-paper">Solved Paper</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setFilterClass("all");
                setFilterSubject("all");
                setFilterYear("all");
                setFilterType("all");
              }}
              className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-800"
            >
              <Filter size={15} />
              Clear All Filters
            </button>

            {/* List */}
            {loading ? (
              <div className="flex justify-center p-10">
                <LoaderCircle
                  className="animate-spin text-blue-600"
                  size={32}
                />
              </div>
            ) : papers.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-8 text-center">
                <FileText
                  className="mx-auto mb-3 text-slate-300"
                  size={38}
                />

                <p className="font-bold text-slate-600">
                  No papers uploaded yet.
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Upload your first question paper using the form.
                </p>
              </div>
            ) : filteredPapers.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-8 text-center">
                <Search
                  className="mx-auto mb-3 text-slate-300"
                  size={36}
                />

                <p className="font-bold text-slate-600">
                  No matching papers found.
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Try changing your search or filters.
                </p>
              </div>
            ) : (
              <div className="max-h-[950px] space-y-3 overflow-y-auto">
                {filteredPapers.map((paper) => (
                  <div
                    key={paper._id}
                    className="rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-bold text-slate-800">
                          {paper.title}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Class {paper.classNo} · {paper.subject} ·{" "}
                          {paper.year}
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {paper.paperType === "solved-paper"
                            ? "Solved Paper"
                            : "Question Paper"}
                        </p>

                        {paper.pdfName && (
                          <p className="mt-2 flex items-center gap-1 break-all text-xs text-blue-600">
                            <FileText size={14} />
                            {paper.pdfName}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              paper.accessType === "premium"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {paper.accessType === "premium" ? (
                              <span className="inline-flex items-center gap-1">
                                <Crown size={12} />
                                Premium
                              </span>
                            ) : (
                              "Free"
                            )}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              paper.isPublished
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {paper.isPublished ? "Published" : "Draft"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => handlePreview(paper._id)}
                        disabled={previewingId === paper._id}
                        className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                      >
                        {previewingId === paper._id ? (
                          <LoaderCircle
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Eye size={14} />
                        )}
                        Preview
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(paper._id)}
                        disabled={saving}
                        className="flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-100 disabled:opacity-50"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => togglePublish(paper)}
                        disabled={statusId === paper._id}
                        className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                      >
                        {statusId === paper._id ? (
                          <LoaderCircle
                            size={14}
                            className="animate-spin"
                          />
                        ) : paper.isPublished ? (
                          <Lock size={14} />
                        ) : (
                          <Unlock size={14} />
                        )}

                        {paper.isPublished ? "Unpublish" : "Publish"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(paper._id)}
                        disabled={deletingId === paper._id}
                        className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        {deletingId === paper._id ? (
                          <LoaderCircle
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={14} />
                        )}
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-5 text-xs text-slate-400">
          <p>
            © {new Date().getFullYear()} Aao Padai Kare. All rights reserved.
          </p>

          <Link
            to="/admin/dashboard"
            className="font-semibold text-blue-600 hover:text-blue-800"
          >
            Admin Dashboard
          </Link>
        </footer>
      </div>
    </main>
  );
}
