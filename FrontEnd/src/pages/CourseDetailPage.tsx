import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useNavigate, useParams } from "react-router-dom";
import { VideoPlayer } from "../components/VideoPlayer";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  FileText,
  Layers,
  Loader2,
  MonitorPlay,
  Presentation,
} from "lucide-react";

interface Section {
  id: number;
  title: string;
  materialType: "VIDEO" | "PDF" | "PPT" | "DOCUMENT";
  materialUrl: string;
  sectionOrder: number;
}

interface Module {
  id: number;
  title: string;
  moduleOrder: number;
  sections: Section[];
}

interface Course {
  id: number;
  title: string;
  category: string;
  description: string;
  dueDate: string;
  modules: Module[];
}

export function CourseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");

    api
      .get(`/employee/courses/${id}`)
      .then((response) => {
        const loadedCourse: Course = response.data;
        setCourse(loadedCourse);
        setSelectedSection(loadedCourse.modules?.[0]?.sections?.[0] || null);
      })
      .catch(() => setError("Unable to load this course right now."))
      .finally(() => setLoading(false));
  }, [id]);

  const totalSections = useMemo(
    () => course?.modules.reduce((total, module) => total + module.sections.length, 0) || 0,
    [course]
  );

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f7fb] p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
          <Loader2 className="mx-auto animate-spin text-blue-600" size={32} />
          <p className="mt-3 text-sm font-medium text-slate-700">
            Loading course material...
          </p>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f4f7fb] p-6">
        <div className="rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <p className="font-semibold text-slate-950">{error || "Course not found."}</p>
          <button
            onClick={() => navigate("/employee/courses")}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7fb] p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <button
          onClick={() => navigate("/employee/courses")}
          className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to courses
        </button>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <span className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase ${getCourseTheme(course.category).badge}`}>
                {course.category}
              </span>
              <h1 className="mt-3 text-2xl font-semibold text-slate-950">
                {course.title}
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {course.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-64">
              <InfoTile label="Modules" value={course.modules.length} />
              <InfoTile label="Sections" value={totalSections} />
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
            <CalendarDays size={17} />
            Due date: {course.dueDate}
          </div>
        </section>

        <div className="mt-6 grid gap-4 lg:grid-cols-[380px_1fr]">
          <aside className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="rounded-md bg-blue-50 p-2 text-blue-700">
                <Layers size={18} />
              </div>
              <div>
                <h2 className="font-semibold text-slate-950">Modules & sections</h2>
                <p className="text-xs text-slate-500">Fetched from module and section tables</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {course.modules.map((module) => (
                <div
                  key={module.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-slate-950">
                      {module.title}
                    </h3>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-medium text-slate-500">
                      {module.sections.length} sections
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {module.sections.map((section) => {
                      const active = selectedSection?.id === section.id;
                      const materialTheme = getMaterialTheme(section.materialType);

                      return (
                        <button
                          key={section.id}
                          onClick={() => setSelectedSection(section)}
                          className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition ${
                            active
                              ? "border-blue-300 bg-white shadow-sm"
                              : "border-transparent bg-white/60 hover:border-slate-200 hover:bg-white"
                          }`}
                        >
                          <span className={`rounded-md p-2 ${materialTheme.icon}`}>
                            {getMaterialIcon(section.materialType)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-semibold text-slate-900">
                              {section.title}
                            </span>
                            <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${materialTheme.badge}`}>
                              {section.materialType}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <main className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Selected section
                </p>
                <h2 className="mt-1 text-lg font-semibold text-slate-950">
                  {selectedSection?.title || "No section selected"}
                </h2>
              </div>

              {selectedSection && (
                <a
                  href={selectedSection.materialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ExternalLink size={16} />
                  Open source
                </a>
              )}
            </div>

            <div className="mt-4">
              {selectedSection ? (
                <MaterialViewer section={selectedSection} />
              ) : (
                <div className="grid h-96 place-items-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
                  Select a section to view material.
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function MaterialViewer({ section }: { section: Section }) {
  if (section.materialType === "VIDEO") {
    return <VideoPlayer src={section.materialUrl} />;
  }

  if (section.materialType === "PPT") {
    return (
      <iframe
        title={section.title}
        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(section.materialUrl)}`}
        className="h-[72vh] w-full rounded-lg border border-slate-200 bg-slate-50"
      />
    );
  }

  return (
    <iframe
      title={section.title}
      src={section.materialUrl}
      className="h-[72vh] w-full rounded-lg border border-slate-200 bg-slate-50"
    />
  );
}

function InfoTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function getMaterialIcon(type: Section["materialType"]) {
  if (type === "VIDEO") return <MonitorPlay size={17} />;
  if (type === "PPT") return <Presentation size={17} />;
  return <FileText size={17} />;
}

function getMaterialTheme(type: Section["materialType"]) {
  if (type === "VIDEO") {
    return {
      badge: "bg-blue-50 text-blue-700",
      icon: "bg-blue-50 text-blue-700",
    };
  }

  if (type === "PPT") {
    return {
      badge: "bg-amber-50 text-amber-700",
      icon: "bg-amber-50 text-amber-700",
    };
  }

  return {
    badge: "bg-emerald-50 text-emerald-700",
    icon: "bg-emerald-50 text-emerald-700",
  };
}

function getCourseTheme(category: string) {
  const key = category?.toUpperCase();

  if (key === "COMPLIANCE") {
    return { badge: "bg-rose-50 text-rose-700" };
  }

  if (key === "TECHNICAL") {
    return { badge: "bg-blue-50 text-blue-700" };
  }

  if (key === "HR") {
    return { badge: "bg-emerald-50 text-emerald-700" };
  }

  return { badge: "bg-amber-50 text-amber-700" };
}
