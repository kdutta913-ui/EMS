import { Outlet, Navigate } from "react-router-dom"
import { getSession } from "./api.js"

const ProtectedRoutes = ({ allowedRoles }) => {
  const { token, user } = getSession()

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const roleHome = {
      CompanyAdmin: "/cadmin",
      Employee: "/empdash",
      TeamLead: "/teamlead",
      HR: "/hrdash",
      Finance: "/finance",
      SuperAdmin: "/superadmin",
    }
    return <Navigate to={roleHome[user.role] || "/login"} replace />
  }

  return <Outlet />
}

export default ProtectedRoutes
