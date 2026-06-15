import { useAuthStore } from "../store/AuthStore";
import { useNavigate } from "react-router-dom";

export function SimpleDashboard({ title }: { title: string }) {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-slate-900 px-4 py-2 text-white"
          >
            Logout
          </button>
        </div>

        <p className="mt-4 text-slate-500">
          Dashboard UI can be expanded based on this role.
        </p>
      </div>
    </div>
  );
}