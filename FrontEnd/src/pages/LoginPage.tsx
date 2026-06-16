import { useState } from "react";
import { api } from "../api/client";
import { useAuthStore } from "../store/AuthStore";
import type { Role } from "../types/auth";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Loader2, ShieldCheck, UserPlus, ArrowRight } from "lucide-react";
import { cn } from "@/shared/utils";

const roles: Role[] = ["EMPLOYEE", "MANAGER", "HR", "ADMIN"];

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [department, setDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      const response =
        mode === "signup"
          ? await api.post("/auth/signup/employee", {
              fullName,
              email,
              password,
              linkedinUrl,
              department,
            })
          : await api.post("/auth/login", {
              email,
              password,
              role,
            });

      setAuth(response.data);

      if (response.data.role === "EMPLOYEE") navigate("/employee");
      if (response.data.role === "ADMIN") navigate("/admin");
      if (response.data.role === "HR") navigate("/hr");
      if (response.data.role === "MANAGER") navigate("/manager");
    } catch (error) {
      setMessage(
        mode === "signup"
          ? "Signup failed. Please check the details or use another email."
          : "Login failed. Please check your email, password, and role."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100 flex items-center justify-center px-4 py-12 relative overflow-hidden font-sans">
      {/* Background decorations */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] aspect-square rounded-full bg-primary-100/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] aspect-square rounded-full bg-accent-100/30 blur-[120px] pointer-events-none" />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1fr_480px] relative z-10">
        {/* Left Side: Branding & Info */}
        <section className="hidden lg:block text-left">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-primary-200/60 bg-primary-50/50 px-4 py-2 text-sm font-semibold text-primary-700 backdrop-blur-sm animate-fade-in">
              <GraduationCap className="w-5 h-5 text-primary-600" />
              <span>CLMS Portal</span>
            </div>

            <h1 className="mt-6 text-4xl lg:text-5xl font-black leading-tight text-surface-900 tracking-tight">
              Learn, track, and complete training in one <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">focused workspace</span>.
            </h1>

            <p className="mt-6 text-base leading-relaxed text-surface-600">
              Employees get real-time course progress, due alerts, assigned modules, and learning materials in a premium interface built for daily productivity.
            </p>

            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { name: "Courses", color: "border-primary-100 bg-primary-50/30 text-primary-800" },
                { name: "Reports", color: "border-success-100 bg-success-50/30 text-success-800" },
                { name: "Alerts", color: "border-warning-100 bg-warning-50/30 text-warning-800" }
              ].map((item) => (
                <div
                  key={item.name}
                  className={cn(
                    "rounded-2xl border p-4 shadow-sm backdrop-blur-sm transition-all hover:scale-105 hover:shadow-md",
                    item.color
                  )}
                >
                  <p className="text-sm font-bold">{item.name}</p>
                  <p className="mt-1 text-[11px] opacity-75 font-medium">Role-based access</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Side: Form Card */}
        <div className="w-full flex items-center justify-center">
          <form
            onSubmit={handleLogin}
            className="w-full rounded-3xl border border-surface-200/80 bg-white/80 p-8 shadow-2xl shadow-surface-200/50 backdrop-blur-md text-left"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-surface-900 tracking-tight">
                  {mode === "login" ? "Welcome back" : "Create Account"}
                </h1>
                <p className="mt-1.5 text-xs font-semibold text-surface-500">
                  {mode === "login"
                    ? "Select your role and sign in to continue."
                    : "Register your employee profile to start learning."}
                </p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 p-3.5 text-white shadow-lg shadow-primary-500/20">
                {mode === "login" ? <ShieldCheck className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="mt-8 grid grid-cols-2 gap-1 rounded-2xl bg-surface-100 p-1.5">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setMode("login")}
                className={cn(
                  "rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer",
                  mode === "login"
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-500 hover:text-surface-800"
                )}
              >
                Login
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  setMode("signup");
                  setRole("EMPLOYEE");
                }}
                className={cn(
                  "rounded-xl py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-200 cursor-pointer",
                  mode === "signup"
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-500 hover:text-surface-800"
                )}
              >
                Employee Signup
              </button>
            </div>

            {/* Role selection (only visible in Login mode) */}
            {mode === "login" && (
              <div className="mt-6">
                <label className="block text-[11px] font-black uppercase tracking-wider text-surface-500 mb-2.5">
                  Select System Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((item) => (
                    <button
                      key={item}
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => setRole(item)}
                      className={cn(
                        "rounded-xl border py-2.5 text-xs font-bold transition-all cursor-pointer",
                        role === item
                          ? "border-primary-500 bg-primary-50/60 text-primary-700 shadow-sm"
                          : "border-surface-200 text-surface-600 hover:border-surface-300 hover:bg-surface-50"
                      )}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 space-y-4">
              {mode === "signup" && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-surface-500 mb-1.5">
                    Full Name
                  </label>
                  <input
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all placeholder:text-surface-400"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-surface-500 mb-1.5">
                  Email Address
                </label>
                <input
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all placeholder:text-surface-400"
                  placeholder="employee@acmecorp.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                  type="email"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-surface-500 mb-1.5">
                  Password
                </label>
                <input
                  className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all placeholder:text-surface-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting}
                  type="password"
                  required
                />
              </div>

              {mode === "signup" && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-surface-500 mb-1.5">
                    LinkedIn Profile URL (Optional)
                  </label>
                  <input
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all placeholder:text-surface-400"
                    placeholder="https://linkedin.com/in/username"
                    value={linkedinUrl}
                    onChange={(event) => setLinkedinUrl(event.target.value)}
                    disabled={isSubmitting}
                    type="url"
                  />
                </div>
              )}

              {mode === "signup" && (
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-surface-500 mb-1.5">
                    Department *
                  </label>
                  <select
                    className="w-full rounded-xl border border-surface-200 bg-surface-50 px-4 py-3 text-sm font-semibold outline-none focus:bg-white focus:border-primary-400 focus:ring-4 focus:ring-primary-100 transition-all text-surface-700"
                    value={department}
                    onChange={(event) => setDepartment(event.target.value)}
                    disabled={isSubmitting}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Frontend Development">Frontend Development</option>
                    <option value="Backend Development">Backend Development</option>
                    <option value="Full Stack Development">Full Stack Development</option>
                    <option value="AI / ML">AI / ML</option>
                    <option value="Data Science">Data Science</option>
                    <option value="Cloud Engineering">Cloud Engineering</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Cyber Security">Cyber Security</option>
                    <option value="QA / Testing">QA / Testing</option>
                    <option value="UI / UX">UI / UX</option>
                    <option value="Mobile Development">Mobile Development</option>
                    <option value="Business Analyst">Business Analyst</option>
                    <option value="Product Management">Product Management</option>
                  </select>
                </div>
              )}
            </div>

            {message && (
              <div className="mt-5 rounded-2xl border border-danger-200 bg-danger-50 px-4 py-3 text-xs font-semibold text-danger-700 animate-slide-up">
                {message}
              </div>
            )}

            <button
              disabled={isSubmitting}
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-primary-500/20 transition-all hover:scale-[1.01] hover:from-primary-700 hover:to-accent-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="animate-spin" size={16} />}
              <span>
                {isSubmitting
                  ? mode === "login"
                    ? "Signing In..."
                    : "Signing Up..."
                  : mode === "login"
                    ? "Sign In"
                    : "Register Profile"}
              </span>
              {!isSubmitting && <ArrowRight size={14} className="ml-1" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
