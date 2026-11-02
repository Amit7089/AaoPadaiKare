
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, getAdminToken, clearAdminToken } from "../services/api";

export default function AdminProtectedRoute({ children }) {
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      if (!getAdminToken()) {
        setStatus("unauthorized");
        return;
      }

      try {
        await api.getAdmin();

        if (active) setStatus("authorized");
      } catch {
        clearAdminToken();

        if (active) setStatus("unauthorized");
      }
    }

    verifyAdmin();

    return () => {
      active = false;
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="font-semibold text-slate-600">
          Verifying admin access...
        </p>
      </div>
    );
  }

  if (status === "unauthorized") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
