
import { Navigate } from "react-router-dom";
import { getStudentToken } from "../services/api";

export default function StudentProtectedRoute({ children }) {
  const token = getStudentToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
