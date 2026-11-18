
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Edit,
  Eye,
  FileText,
  Globe,
  Layers,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Trophy,
  Upload,
  Video,
  X,
} from "lucide-react";

import {
  getAdminCourses,
  addCourse,
  updateCourse,
  updateCoursePublishStatus,
  deleteCourse,
  getCourseSubjects,
  addCourseSubject,
  updateCourseSubject,
  deleteCourseSubject,
  getAdminCourseLessons,
  getAdminCourseLesson,
  addCourseLesson,
  updateCourseLesson,
  deleteCourseLesson,
} from "../../services/api";

const CATEGORIES = [
  { value: "scholarship", label: "Scholarship Exam" },
  { value: "school-entrance", label: "School Entrance" },
  { value: "olympiad", label: "Olympiad" },
  { value: "foundation", label: "Foundation" },
  { value: "other", label: "Other" },
];

const CLASSES = Array.from({ length: 12 }, (_, index) => index + 1);

const emptyCourse = {
  title: "",
  slug: "",
  examCode: "",
  category: "scholarship",
  targetClasses: [8],
  shortDescription: "",
  description: "",
  eligibility: "",
  supportedLanguages: ["Hindi", "English"],
  thumbnailUrl: "",
  price: 0,
  compareAtPrice: 0,
  durationDays: 365,
  featured: false,
  displayOrder: 0,
};

const emptySubject = {
  name: "",
  description: "",
  displayOrder: 0,
};

const emptyLesson = {
  title: "",
  chapter: "",
  language: "Hindi",
  content: "",
  videoUrl: "",
  accessType: "demo",
  displayOrder: 0,
  isPublished: true,
};

function getList(response, keys = []) {
  if (Array.isArray(response)) return response;

  for (const key of keys) {
    if (Array.isArray(response?.[key])) return response[key];
    if (Array.isArray(response?.data?.[key])) return response.data[key];
  }

  if (Array.isArray(response?.data)) return response.data;

  return [];
}

function getObject(response, keys = []) {
  if (!response) return null;

  for (const key of keys) {
    if (response?.[key] && typeof response[key] === "object") {
      return response[key];
    }
    if (response?.data?.[key] && typeof response.data[key] === "object") {
      return response.data[key];
    }
  }

  return response?.data || response;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function makeSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatPrice(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

function Modal({ title, subtitle, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 sm:p-5">
      <div
        className={`max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white shadow-2xl ${
          wide ? "max-w-3xl" : "max-w-xl"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const textareaClass =
  "w-full resize-y rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

function StatusBadge({ active, children }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {children}
    </span>
  );
}

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [courseModal, setCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState(emptyCourse);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [lessons, setLessons] = useState([]);

  const [subjectModal, setSubjectModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectForm, setSubjectForm] = useState(emptySubject);

  const [lessonModal, setLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [lessonPdf, setLessonPdf] = useState(null);
  const [removeExistingPdf, setRemoveExistingPdf] = useState(false);

  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingLessons, setLoadingLessons] = useState(false);

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesSearch =
        !query ||
        course.title?.toLowerCase().includes(query) ||
        course.examCode?.toLowerCase().includes(query) ||
        course.slug?.toLowerCase().includes(query);

      const matchesCategory =
        categoryFilter === "all" || course.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [courses, search, categoryFilter]);

  const publishedCount = courses.filter((course) => course.isPublished).length;
  const draftCount = courses.length - publishedCount;

  const showNotice = (message) => {
    setNotice(message);
    setError("");
    window.setTimeout(() => setNotice(""), 3500);
  };

  const showError = (message) => {
    setError(message);
    setNotice("");
  };

  // Load all courses
  const loadCourses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getAdminCourses();
      setCourses(getList(response, ["courses"]));
    } catch (err) {
      showError(getErrorMessage(err, "Courses load nahi ho paye."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Course form helpers
  const openAddCourse = () => {
    setEditingCourse(null);
    setCourseForm({ ...emptyCourse, targetClasses: [8] });
    setCourseModal(true);
  };

  const openEditCourse = (course) => {
    setEditingCourse(course);

    setCourseForm({
      title: course.title || "",
      slug: course.slug || "",
      examCode: course.examCode || "",
      category: course.category || "scholarship",
      targetClasses: course.targetClasses || [],
      shortDescription: course.shortDescription || "",
      description: course.description || "",
      eligibility: course.eligibility || "",
      supportedLanguages: course.supportedLanguages || ["Hindi", "English"],
      thumbnailUrl: course.thumbnailUrl || "",
      price: course.price ?? 0,
      compareAtPrice: course.compareAtPrice ?? 0,
      durationDays: course.durationDays ?? 365,
      featured: Boolean(course.featured),
      displayOrder: course.displayOrder ?? 0,
    });

    setCourseModal(true);
  };

  const updateCourseField = (field, value) => {
    setCourseForm((previous) => ({ ...previous, [field]: value }));
  };

  const toggleTargetClass = (classNo) => {
    setCourseForm((previous) => {
      const exists = previous.targetClasses.includes(classNo);

      return {
        ...previous,
        targetClasses: exists
          ? previous.targetClasses.filter((item) => item !== classNo)
          : [...previous.targetClasses, classNo].sort((a, b) => a - b),
      };
    });
  };

  const toggleLanguage = (language) => {
    setCourseForm((previous) => {
      const exists = previous.supportedLanguages.includes(language);

      return {
        ...previous,
        supportedLanguages: exists
          ? previous.supportedLanguages.filter((item) => item !== language)
          : [...previous.supportedLanguages, language],
      };
    });
  };

  const saveCourse = async (event) => {
    event.preventDefault();

    if (!courseForm.title.trim()) {
      showError("Course title required hai.");
      return;
    }

    if (!courseForm.targetClasses.length) {
      showError("Kam se kam ek target class select karo.");
      return;
    }

    if (!courseForm.supportedLanguages.length) {
      showError("Kam se kam ek language select karo.");
      return;
    }

    if (Number(courseForm.price) < 0 || Number(courseForm.durationDays) < 1) {
      showError("Price aur duration valid hona chahiye.");
      return;
    }

    const payload = {
      ...courseForm,
      title: courseForm.title.trim(),
      slug: courseForm.slug.trim() || makeSlug(courseForm.title),
      examCode: courseForm.examCode.trim(),
      price: Number(courseForm.price),
      compareAtPrice: Number(courseForm.compareAtPrice || 0),
      durationDays: Number(courseForm.durationDays),
      displayOrder: Number(courseForm.displayOrder || 0),
    };

    try {
      setSaving(true);
      setError("");

      if (editingCourse) {
        await updateCourse(editingCourse._id, payload);
        showNotice("Course successfully update ho gaya.");
      } else {
        await addCourse(payload);
        showNotice("New course successfully create ho gaya.");
      }

      setCourseModal(false);
      setEditingCourse(null);
      await loadCourses();
    } catch (err) {
      showError(getErrorMessage(err, "Course save nahi ho paya."));
    } finally {
      setSaving(false);
    }
  };

  const handlePublishToggle = async (course) => {
    try {
      setSaving(true);
      await updateCoursePublishStatus(course._id, !course.isPublished);
      showNotice(
        course.isPublished
          ? "Course unpublish ho gaya."
          : "Course publish ho gaya."
      );
      await loadCourses();
    } catch (err) {
      showError(getErrorMessage(err, "Publish status update nahi hua."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    const confirmed = window.confirm(
      `"${course.title}" delete karna chahte ho? Is course ke subjects aur lessons bhi delete ho jayenge.`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteCourse(course._id);

      if (selectedCourse?._id === course._id) {
        setSelectedCourse(null);
        setSelectedSubject(null);
        setSubjects([]);
        setLessons([]);
      }

      showNotice("Course delete ho gaya.");
      await loadCourses();
    } catch (err) {
      showError(getErrorMessage(err, "Course delete nahi ho paya."));
    } finally {
      setSaving(false);
    }
  };

  // Subjects
  const loadSubjects = async (course) => {
    try {
      setLoadingSubjects(true);
      setSelectedCourse(course);
      setSelectedSubject(null);
      setLessons([]);

      const response = await getCourseSubjects(course._id);
      setSubjects(getList(response, ["subjects"]));
    } catch (err) {
      showError(getErrorMessage(err, "Subjects load nahi ho paye."));
    } finally {
      setLoadingSubjects(false);
    }
  };

  const openAddSubject = () => {
    setEditingSubject(null);
    setSubjectForm({
      ...emptySubject,
      displayOrder: subjects.length,
    });
    setSubjectModal(true);
  };

  const openEditSubject = (subject) => {
    setEditingSubject(subject);
    setSubjectForm({
      name: subject.name || "",
      description: subject.description || "",
      displayOrder: subject.displayOrder ?? 0,
    });
    setSubjectModal(true);
  };

  const saveSubject = async (event) => {
    event.preventDefault();

    if (!subjectForm.name.trim()) {
      showError("Subject name required hai.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...subjectForm,
        name: subjectForm.name.trim(),
        displayOrder: Number(subjectForm.displayOrder || 0),
      };

      if (editingSubject) {
        await updateCourseSubject(editingSubject._id, payload);
        showNotice("Subject update ho gaya.");
      } else {
        await addCourseSubject(selectedCourse._id, payload);
        showNotice("Subject add ho gaya.");
      }

      setSubjectModal(false);
      await loadSubjects(selectedCourse);
    } catch (err) {
      showError(getErrorMessage(err, "Subject save nahi ho paya."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSubject = async (subject) => {
    const confirmed = window.confirm(
      `"${subject.name}" aur iske lessons delete karna chahte ho?`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteCourseSubject(subject._id);

      if (selectedSubject?._id === subject._id) {
        setSelectedSubject(null);
        setLessons([]);
      }

      showNotice("Subject delete ho gaya.");
      await loadSubjects(selectedCourse);
    } catch (err) {
      showError(getErrorMessage(err, "Subject delete nahi ho paya."));
    } finally {
      setSaving(false);
    }
  };

  // Lessons
  const loadLessons = async (subject) => {
    try {
      setLoadingLessons(true);
      setSelectedSubject(subject);

      const response = await getAdminCourseLessons(
        selectedCourse._id,
        subject._id
      );

      setLessons(getList(response, ["lessons"]));
    } catch (err) {
      showError(getErrorMessage(err, "Lessons load nahi ho paye."));
    } finally {
      setLoadingLessons(false);
    }
  };

  const openAddLesson = () => {
    setEditingLesson(null);
    setLessonForm({
      ...emptyLesson,
      language: selectedCourse?.supportedLanguages?.[0] || "Hindi",
      displayOrder: lessons.length,
    });
    setLessonPdf(null);
    setRemoveExistingPdf(false);
    setLessonModal(true);
  };

  const openEditLesson = async (lesson) => {
    try {
      setSaving(true);

      const response = await getAdminCourseLesson(lesson._id);
      const fullLesson = getObject(response, ["lesson"]) || lesson;

      setEditingLesson(fullLesson);

      setLessonForm({
        title: fullLesson.title || "",
        chapter: fullLesson.chapter || "",
        language: fullLesson.language || "Hindi",
        content: fullLesson.content || "",
        videoUrl: fullLesson.videoUrl || "",
        accessType: fullLesson.accessType || "demo",
        displayOrder: fullLesson.displayOrder ?? 0,
        isPublished: Boolean(fullLesson.isPublished),
      });

      setLessonPdf(null);
      setRemoveExistingPdf(false);
      setLessonModal(true);
    } catch (err) {
      showError(getErrorMessage(err, "Lesson details load nahi hue."));
    } finally {
      setSaving(false);
    }
  };

  const saveLesson = async (event) => {
    event.preventDefault();

    if (!lessonForm.title.trim()) {
      showError("Lesson title required hai.");
      return;
    }

    if (!lessonForm.chapter.trim()) {
      showError("Chapter name required hai.");
      return;
    }

    if (
      lessonForm.videoUrl.trim() &&
      !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(
        lessonForm.videoUrl.trim()
      )
    ) {
      showError("Valid YouTube URL enter karo (https://).");
      return;
    }

    const formData = new FormData();

    formData.append("title", lessonForm.title.trim());
    formData.append("chapter", lessonForm.chapter.trim());
    formData.append("language", lessonForm.language);
    formData.append("content", lessonForm.content || "");
    formData.append("videoUrl", lessonForm.videoUrl.trim());
    formData.append("accessType", lessonForm.accessType);
    formData.append("displayOrder", String(Number(lessonForm.displayOrder || 0)));
    formData.append("isPublished", String(Boolean(lessonForm.isPublished)));

    if (lessonPdf) {
      formData.append("pdf", lessonPdf);
    }

    if (removeExistingPdf) {
      formData.append("removePdf", "true");
    }

    try {
      setSaving(true);
      setError("");

      if (editingLesson) {
        await updateCourseLesson(editingLesson._id, formData);
        showNotice("Lesson update ho gaya.");
      } else {
        await addCourseLesson(
          selectedCourse._id,
          selectedSubject._id,
          formData
        );
        showNotice("New lesson add ho gaya.");
      }

      setLessonModal(false);
      setEditingLesson(null);
      setLessonPdf(null);
      setRemoveExistingPdf(false);
      await loadLessons(selectedSubject);
    } catch (err) {
      showError(getErrorMessage(err, "Lesson save nahi ho paya."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lesson) => {
    const confirmed = window.confirm(
      `"${lesson.title}" delete karna chahte ho?`
    );

    if (!confirmed) return;

    try {
      setSaving(true);
      await deleteCourseLesson(lesson._id);
      showNotice("Lesson delete ho gaya.");
      await loadLessons(selectedSubject);
    } catch (err) {
      showError(getErrorMessage(err, "Lesson delete nahi ho paya."));
    } finally {
      setSaving(false);
    }
  };

  const backToCourses = () => {
    setSelectedCourse(null);
    setSelectedSubject(null);
    setSubjects([]);
    setLessons([]);
    setError("");
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* PAGE HEADER */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <span>Admin</span>
              <ChevronRight size={14} />
              <span>Competitive Courses</span>
              {selectedCourse && (
                <>
                  <ChevronRight size={14} />
                  <span className="max-w-[160px] truncate text-blue-600">
                    {selectedCourse.title}
                  </span>
                </>
              )}
            </div>

            <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
              {selectedCourse ? selectedCourse.title : "Competitive Courses"}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {selectedCourse
                ? "Manage course subjects, chapters and learning materials."
                : "Create and manage entrance exam and scholarship courses."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCourse ? (
              <button
                onClick={backToCourses}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft size={17} />
                All Courses
              </button>
            ) : (
              <>
                <button
                  onClick={loadCourses}
                  disabled={loading}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  title="Refresh courses"
                >
                  <RefreshCw
                    size={18}
                    className={loading ? "animate-spin" : ""}
                  />
                </button>

                <button
                  onClick={openAddCourse}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
                >
                  <Plus size={18} />
                  Add New Course
                </button>
              </>
            )}
          </div>
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError("")} aria-label="Dismiss error">
              <X size={17} />
            </button>
          </div>
        )}

        {notice && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            <Check size={17} />
            {notice}
          </div>
        )}

        {/* COURSE LIST VIEW */}
        {!selectedCourse && (
          <>
            {/* SUMMARY */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">
                    Total Courses
                  </p>
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <BookOpen size={20} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {loading ? "—" : courses.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">
                    Published
                  </p>
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <Globe size={20} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {loading ? "—" : publishedCount}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500">
                    Drafts
                  </p>
                  <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                    <Pencil size={20} />
                  </div>
                </div>
                <p className="mt-3 text-3xl font-black text-slate-900">
                  {loading ? "—" : draftCount}
                </p>
              </div>
            </div>

            {/* FILTERS */}
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search course, exam code or slug..."
                  className={`${inputClass} pl-10`}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className={`${inputClass} sm:w-60`}
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* COURSE TABLE */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <div>
                  <h2 className="font-extrabold text-slate-900">
                    All Courses
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {filteredCourses.length} course(s) found
                  </p>
                </div>
                <Trophy className="text-blue-500" size={22} />
              </div>

              {loading ? (
                <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
                  <Loader2 className="animate-spin" size={19} />
                  Loading courses...
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <BookOpen size={27} />
                  </div>
                  <h3 className="font-bold text-slate-800">
                    No courses found
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add your first competitive exam course.
                  </p>
                  <button
                    onClick={openAddCourse}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    <Plus size={17} />
                    Add Course
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-4">Course</th>
                        <th className="px-5 py-4">Category</th>
                        <th className="px-5 py-4">Classes</th>
                        <th className="px-5 py-4">Price</th>
                        <th className="px-5 py-4">Languages</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {filteredCourses.map((course) => (
                        <tr
                          key={course._id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {course.thumbnailUrl ? (
                                <img
                                  src={course.thumbnailUrl}
                                  alt=""
                                  className="h-11 w-11 rounded-xl border border-slate-100 object-cover"
                                />
                              ) : (
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                  <Trophy size={20} />
                                </div>
                              )}

                              <div>
                                <p className="max-w-[220px] truncate text-sm font-bold text-slate-800">
                                  {course.title}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {course.examCode || course.slug}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {CATEGORIES.find(
                              (item) => item.value === course.category
                            )?.label || course.category}
                          </td>

                          <td className="px-5 py-4 text-sm text-slate-600">
                            {course.targetClasses?.length
                              ? course.targetClasses
                                  .map((item) => `Class ${item}`)
                                  .join(", ")
                              : "—"}
                          </td>

                          <td className="px-5 py-4">
                            <p className="text-sm font-bold text-slate-800">
                              {formatPrice(course.price)}
                            </p>
                            {Number(course.compareAtPrice) > 0 && (
                              <p className="text-xs text-slate-400 line-through">
                                {formatPrice(course.compareAtPrice)}
                              </p>
                            )}
                          </td>

                          <td className="px-5 py-4 text-xs text-slate-600">
                            {course.supportedLanguages?.join(", ") || "—"}
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge active={course.isPublished}>
                              {course.isPublished ? "Published" : "Draft"}
                            </StatusBadge>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => loadSubjects(course)}
                                title="Manage subjects and lessons"
                                className="rounded-lg bg-blue-50 p-2 text-blue-700 hover:bg-blue-100"
                              >
                                <Layers size={17} />
                              </button>

                              <button
                                onClick={() => openEditCourse(course)}
                                title="Edit course"
                                className="rounded-lg bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"
                              >
                                <Edit size={17} />
                              </button>

                              <button
                                onClick={() => handlePublishToggle(course)}
                                disabled={saving}
                                title={course.isPublished ? "Unpublish" : "Publish"}
                                className="rounded-lg bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                              >
                                <Eye size={17} />
                              </button>

                              <button
                                onClick={() => handleDeleteCourse(course)}
                                disabled={saving}
                                title="Delete course"
                                className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* SUBJECT AND LESSON MANAGEMENT */}
        {selectedCourse && (
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
            {/* COURSE DETAILS + SUBJECT LIST */}
            <aside className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Course Details
                  </span>
                  <button
                    onClick={() => openEditCourse(selectedCourse)}
                    className="rounded-lg bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                    title="Edit course"
                  >
                    <Edit size={16} />
                  </button>
                </div>

                <h2 className="text-lg font-black text-slate-900">
                  {selectedCourse.title}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedCourse.examCode || selectedCourse.slug}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusBadge active={selectedCourse.isPublished}>
                    {selectedCourse.isPublished ? "Published" : "Draft"}
                  </StatusBadge>
                  <StatusBadge active={Number(selectedCourse.price) === 0}>
                    {Number(selectedCourse.price) === 0
                      ? "Free"
                      : "Premium"}
                  </StatusBadge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4">
                  <div>
                    <p className="text-xs text-slate-400">Course Price</p>
                    <p className="mt-1 font-extrabold text-slate-800">
                      {formatPrice(selectedCourse.price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Duration</p>
                    <p className="mt-1 font-extrabold text-slate-800">
                      {selectedCourse.durationDays} days
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-500">
                  {selectedCourse.shortDescription ||
                    selectedCourse.description ||
                    "No course description added."}
                </p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 p-4">
                  <div>
                    <h3 className="font-extrabold text-slate-900">Subjects</h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {subjects.length} subject(s)
                    </p>
                  </div>

                  <button
                    onClick={openAddSubject}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    title="Add subject"
                  >
                    <Plus size={18} />
                  </button>
                </div>

                {loadingSubjects ? (
                  <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                    <Loader2 size={17} className="animate-spin" />
                    Loading subjects...
                  </div>
                ) : subjects.length === 0 ? (
                  <div className="p-8 text-center">
                    <Layers className="mx-auto mb-2 text-slate-300" size={30} />
                    <p className="text-sm font-semibold text-slate-600">
                      No subjects added
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Add the first subject for this course.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {subjects.map((subject) => (
                      <div
                        key={subject._id}
                        className={`flex items-center gap-2 p-3 transition ${
                          selectedSubject?._id === subject._id
                            ? "bg-blue-50"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        <button
                          onClick={() => loadLessons(subject)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              selectedSubject?._id === subject._id
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            <BookOpen size={17} />
                          </div>

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold text-slate-800">
                              {subject.name}
                            </span>
                            <span className="mt-0.5 block text-[11px] text-slate-400">
                              {subject.isPublished === false
                                ? "Unpublished"
                                : "Subject"}
                            </span>
                          </span>

                          <ChevronRight size={16} className="text-slate-400" />
                        </button>

                        <button
                          onClick={() => openEditSubject(subject)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                          title="Edit subject"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => handleDeleteSubject(subject)}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Delete subject"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* LESSON PANEL */}
            <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <h2 className="font-extrabold text-slate-900">
                    {selectedSubject
                      ? `${selectedSubject.name} Lessons`
                      : "Course Lessons"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedSubject
                      ? "Add chapter-wise lessons, PDFs and videos."
                      : "Select a subject to manage its lessons."}
                  </p>
                </div>

                {selectedSubject && (
                  <button
                    onClick={openAddLesson}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    <Plus size={17} />
                    Add Lesson
                  </button>
                )}
              </div>

              {!selectedSubject ? (
                <div className="px-5 py-20 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                    <Layers size={26} />
                  </div>
                  <h3 className="font-bold text-slate-800">
                    Select a subject
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Choose a subject from the left panel to view its lessons.
                  </p>
                </div>
              ) : loadingLessons ? (
                <div className="flex items-center justify-center gap-2 p-14 text-sm text-slate-500">
                  <Loader2 size={18} className="animate-spin" />
                  Loading lessons...
                </div>
              ) : lessons.length === 0 ? (
                <div className="px-5 py-16 text-center">
                  <FileText className="mx-auto mb-3 text-slate-300" size={36} />
                  <h3 className="font-bold text-slate-800">
                    No lessons yet
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Add the first chapter or lesson for this subject.
                  </p>
                  <button
                    onClick={openAddLesson}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    <Plus size={17} />
                    Add First Lesson
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson._id}
                      className="flex flex-col gap-3 p-4 transition hover:bg-slate-50/70 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                          <FileText size={19} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800">
                            {lesson.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {lesson.chapter || `Lesson ${index + 1}`}
                            {" · "}
                            {lesson.language || "Hindi"}
                            {" · "}
                            Order {lesson.displayOrder ?? index}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <StatusBadge active={lesson.accessType === "demo"}>
                              {lesson.accessType === "demo" ? "Demo" : "Premium"}
                            </StatusBadge>

                            <StatusBadge active={lesson.isPublished !== false}>
                              {lesson.isPublished === false
                                ? "Unpublished"
                                : "Published"}
                            </StatusBadge>

                            {lesson.pdfName && (
                              <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                                PDF
                              </span>
                            )}

                            {lesson.videoUrl && (
                              <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700">
                                Video
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
                        <button
                          onClick={() => openEditLesson(lesson)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          <Edit size={14} />
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteLesson(lesson)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* COURSE MODAL */}
      {courseModal && (
        <Modal
          title={editingCourse ? "Edit Course" : "Create New Course"}
          subtitle="Enter the competitive exam course details."
          onClose={() => setCourseModal(false)}
          wide
        >
          <form onSubmit={saveCourse} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Course Title *">
                <input
                  required
                  value={courseForm.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    updateCourseField("title", title);
                    if (!editingCourse || !courseForm.slug) {
                      updateCourseField("slug", makeSlug(title));
                    }
                  }}
                  placeholder="e.g. NMMS Scholarship Preparation"
                  className={inputClass}
                />
              </Field>

              <Field label="Exam Code">
                <input
                  value={courseForm.examCode}
                  onChange={(event) =>
                    updateCourseField("examCode", event.target.value)
                  }
                  placeholder="e.g. NMMS"
                  className={inputClass}
                />
              </Field>

              <Field label="Course Slug">
                <input
                  value={courseForm.slug}
                  onChange={(event) =>
                    updateCourseField("slug", makeSlug(event.target.value))
                  }
                  placeholder="nmms-scholarship-preparation"
                  className={inputClass}
                />
              </Field>

              <Field label="Category *">
                <select
                  value={courseForm.category}
                  onChange={(event) =>
                    updateCourseField("category", event.target.value)
                  }
                  className={inputClass}
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Target Classes *">
              <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 p-3">
                {CLASSES.map((classNo) => {
                  const checked = courseForm.targetClasses.includes(classNo);

                  return (
                    <button
                      type="button"
                      key={classNo}
                      onClick={() => toggleTargetClass(classNo)}
                      className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                        checked
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"
                      }`}
                    >
                      Class {classNo}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Short Description">
              <input
                value={courseForm.shortDescription}
                onChange={(event) =>
                  updateCourseField("shortDescription", event.target.value)
                }
                placeholder="A short introduction to this course"
                className={inputClass}
              />
            </Field>

            <Field label="Full Description">
              <textarea
                rows={4}
                value={courseForm.description}
                onChange={(event) =>
                  updateCourseField("description", event.target.value)
                }
                placeholder="Explain course details, preparation plan and benefits..."
                className={textareaClass}
              />
            </Field>

            <Field label="Eligibility">
              <textarea
                rows={2}
                value={courseForm.eligibility}
                onChange={(event) =>
                  updateCourseField("eligibility", event.target.value)
                }
                placeholder="Enter eligibility details..."
                className={textareaClass}
              />
            </Field>

            <Field label="Supported Languages *">
              <div className="flex flex-wrap gap-3">
                {["Hindi", "English"].map((language) => (
                  <label
                    key={language}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={courseForm.supportedLanguages.includes(language)}
                      onChange={() => toggleLanguage(language)}
                      className="h-4 w-4 accent-blue-600"
                    />
                    {language}
                  </label>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Course Price (₹)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={courseForm.price}
                  onChange={(event) =>
                    updateCourseField("price", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Compare At Price (₹)">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={courseForm.compareAtPrice}
                  onChange={(event) =>
                    updateCourseField("compareAtPrice", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Duration (Days)">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={courseForm.durationDays}
                  onChange={(event) =>
                    updateCourseField("durationDays", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Thumbnail Image URL">
              <input
                type="url"
                value={courseForm.thumbnailUrl}
                onChange={(event) =>
                  updateCourseField("thumbnailUrl", event.target.value)
                }
                placeholder="https://example.com/course-image.jpg"
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Display Order">
                <input
                  type="number"
                  value={courseForm.displayOrder}
                  onChange={(event) =>
                    updateCourseField("displayOrder", event.target.value)
                  }
                  className={inputClass}
                />
              </Field>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={courseForm.featured}
                  onChange={(event) =>
                    updateCourseField("featured", event.target.checked)
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                <span>
                  <span className="block text-sm font-bold text-slate-800">
                    Featured Course
                  </span>
                  <span className="text-xs text-slate-400">
                    Highlight this course
                  </span>
                </span>
              </label>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setCourseModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={17} className="animate-spin" />}
                {editingCourse ? "Update Course" : "Create Course"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* SUBJECT MODAL */}
      {subjectModal && (
        <Modal
          title={editingSubject ? "Edit Subject" : "Add Subject"}
          subtitle={`Course: ${selectedCourse?.title || ""}`}
          onClose={() => setSubjectModal(false)}
        >
          <form onSubmit={saveSubject} className="space-y-4">
            <Field label="Subject Name *">
              <input
                required
                value={subjectForm.name}
                onChange={(event) =>
                  setSubjectForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Mental Ability Test"
                className={inputClass}
              />
            </Field>

            <Field label="Description">
              <textarea
                rows={3}
                value={subjectForm.description}
                onChange={(event) =>
                  setSubjectForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="Subject description..."
                className={textareaClass}
              />
            </Field>

            <Field label="Display Order">
              <input
                type="number"
                value={subjectForm.displayOrder}
                onChange={(event) =>
                  setSubjectForm((previous) => ({
                    ...previous,
                    displayOrder: event.target.value,
                  }))
                }
                className={inputClass}
              />
            </Field>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setSubjectModal(false)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingSubject ? "Update Subject" : "Add Subject"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* LESSON MODAL */}
      {lessonModal && (
        <Modal
          title={editingLesson ? "Edit Lesson" : "Add New Lesson"}
          subtitle={`${selectedCourse?.title || ""} / ${selectedSubject?.name || ""}`}
          onClose={() => setLessonModal(false)}
          wide
        >
          <form onSubmit={saveLesson} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Lesson Title *">
                <input
                  required
                  value={lessonForm.title}
                  onChange={(event) =>
                    setLessonForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Introduction to Reasoning"
                  className={inputClass}
                />
              </Field>

              <Field label="Chapter Name *">
                <input
                  required
                  value={lessonForm.chapter}
                  onChange={(event) =>
                    setLessonForm((previous) => ({
                      ...previous,
                      chapter: event.target.value,
                    }))
                  }
                  placeholder="e.g. Chapter 1"
                  className={inputClass}
                />
              </Field>

              <Field label="Language *">
                <select
                  value={lessonForm.language}
                  onChange={(event) =>
                    setLessonForm((previous) => ({
                      ...previous,
                      language: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  {(selectedCourse?.supportedLanguages || ["Hindi", "English"]).map(
                    (language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    )
                  )}
                </select>
              </Field>

              <Field label="Access Type *">
                <select
                  value={lessonForm.accessType}
                  onChange={(event) =>
                    setLessonForm((previous) => ({
                      ...previous,
                      accessType: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="demo">Demo (Free)</option>
                  <option value="premium">Premium (Enrolled Students)</option>
                </select>
              </Field>

              <Field label="Display Order">
                <input
                  type="number"
                  value={lessonForm.displayOrder}
                  onChange={(event) =>
                    setLessonForm((previous) => ({
                      ...previous,
                      displayOrder: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <input
                  type="checkbox"
                  checked={lessonForm.isPublished}
                  onChange={(event) =>
                    setLessonForm((previous) => ({
                      ...previous,
                      isPublished: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-blue-600"
                />
                <span>
                  <span className="block text-sm font-bold text-slate-800">
                    Publish Lesson
                  </span>
                  <span className="text-xs text-slate-400">
                    Make lesson visible to students
                  </span>
                </span>
              </label>
            </div>

            <Field label="Lesson Content">
              <textarea
                rows={7}
                value={lessonForm.content}
                onChange={(event) =>
                  setLessonForm((previous) => ({
                    ...previous,
                    content: event.target.value,
                  }))
                }
                placeholder="Write lesson notes or explanation here..."
                className={textareaClass}
              />
            </Field>

            <Field label="YouTube Video URL">
              <div className="relative">
                <Video
                  size={17}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="url"
                  value={lessonForm.videoUrl}
                  onChange={(event) =>
                    setLessonForm((previous) => ({
                      ...previous,
                      videoUrl: event.target.value,
                    }))
                  }
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`${inputClass} pl-10`}
                />
              </div>
            </Field>

            <Field
              label="Lesson PDF"
              hint="PDF file only. The server validates the uploaded file."
            >
              <div className="rounded-xl border border-dashed border-slate-300 p-4">
                {editingLesson?.pdfName && !removeExistingPdf && !lessonPdf && (
                  <div className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-violet-50 p-3">
                    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-violet-800">
                      <FileText size={18} />
                      <span className="truncate">
                        {editingLesson.pdfName}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRemoveExistingPdf(true)}
                      className="shrink-0 text-xs font-bold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                )}

                {removeExistingPdf && (
                  <p className="mb-3 text-xs font-semibold text-red-600">
                    Existing PDF will be removed when you save this lesson.
                  </p>
                )}

                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 py-3 text-center">
                  <Upload className="text-slate-400" size={24} />
                  <span className="text-sm font-bold text-slate-700">
                    {lessonPdf ? lessonPdf.name : "Choose PDF file"}
                  </span>
                  <span className="text-xs text-slate-400">
                    Select a PDF from your computer
                  </span>
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;

                      if (file && file.type !== "application/pdf") {
                        showError("Sirf PDF file upload kar sakte ho.");
                        event.target.value = "";
                        return;
                      }

                      setLessonPdf(file);
                      if (file) setRemoveExistingPdf(false);
                    }}
                  />
                </label>

                {lessonPdf && (
                  <button
                    type="button"
                    onClick={() => setLessonPdf(null)}
                    className="mt-2 text-xs font-bold text-red-600 hover:underline"
                  >
                    Remove selected file
                  </button>
                )}
              </div>
            </Field>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setLessonModal(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving && <Loader2 size={17} className="animate-spin" />}
                {editingLesson ? "Update Lesson" : "Save Lesson"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
