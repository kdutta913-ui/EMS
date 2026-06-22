import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import "./CAdmin.css";

import {
  LayoutDashboard,
  UserPlus,
  Users,
  Building2,
  CheckSquare,
  Settings as SettingsIcon,
  Brain,
  MessageSquare,
} from "lucide-react";
import ChatLayout from "../../chatsys/Chatlayout";

import CAdminDashboardHome from "./cadminhome/CAdminhome";
import RegisterEmployee from "./registeremp/Emp";
import Employees from "./employees/Emps";
import DepartmentsTeams from "./dept/Dept";
import Approvals from "./approvals/Approvals";
import CompanyProfile from "./company/Company";
import Settings from "./settings/Settings";
import AIInsights from "./ai/Ai";

import { getSession, clearSession } from "../../utils/api";

const navSections = [
  {
    label: "Main",
    items: [
      { id: "dashboard",  label: "Dashboard",         icon: <LayoutDashboard size={16} /> },
      { id: "register",   label: "Register Employee",  icon: <UserPlus size={16} /> },
      { id: "employees",  label: "Employees",          icon: <Users size={16} /> },
    ],
  },
  {
    label: "Manage",
    items: [
      { id: "departments",  label: "Departments & Teams", icon: <Building2 size={16} /> },
      { id: "approvals",    label: "Approvals",            icon: <CheckSquare size={16} /> },
      { id: "ai-insights",  label: "AI-Insights",          icon: <Brain size={16} /> },
    ],
  },
  {
    label: "Settings",
    items: [
      { id: "profile",   label: "Company Profile", icon: <Building2 size={16} />     },
      { id: "settings",  label: "Settings",         icon: <SettingsIcon size={16} /> },
      { id: "chat",      label: "Chat",             icon: <MessageSquare size={16} /> },
    ],
  },
];

const pageTitles = {
  dashboard:   "Company Admin Dashboard",
  register:    "Register Employee",
  employees:   "Employees",
  departments: "Departments & Teams",
  approvals:   "Approvals",
  "ai-insights": "AI-Insights",
  profile:     "Company Profile",
  settings:    "Settings",
};

const CAdminDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const navigate = useNavigate();

  const { user: sessionUser } = getSession();
  const userName = sessionUser?.name || "Admin";
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const companyName = sessionUser?.companyName || "Your Company";

  const handleLogout = () => {
    clearSession();
    navigate("/login");
  };

  const topbarExtra = (
    <>
      <span className="ems-topbar__pill ems-topbar__pill--blue">
        <Building2 size={13} />
        {companyName}
      </span>
      <button className="ems-topbar__action-btn" onClick={() => setActiveNav("register")}>
        <UserPlus size={14} />
        Register Employee
      </button>
    </>
  );

  const renderPage = () => {
    switch (activeNav) {
      case "dashboard":    return <CAdminDashboardHome />;
      case "register":     return <RegisterEmployee />;
      case "employees":    return <Employees />;
      case "departments":  return <DepartmentsTeams />;
      case "approvals":    return <Approvals />;
      case "ai-insights":  return <AIInsights />;
      case "profile":      return <CompanyProfile />;
      case "settings":     return <Settings />;
      default:             return <CAdminDashboardHome />;
    }
  };

  const sidebarUser = { name: userName, role: "Company Admin", initials };

  if (activeNav === "chat") {
    return (
      <ChatLayout
        onBackToDashboard={() => setActiveNav("dashboard")}
        userRole="CompanyAdmin"
      />
    );
  }

  return (
    <div className="ca-layout">
      <Sidebar navSections={navSections} activeNav={activeNav} onNavChange={setActiveNav} user={sidebarUser} />
      <div className="ca-main">
        <Topbar
          pageTitle={pageTitles[activeNav]}
          user={{ initials }}
          notifCount={0}
          extra={topbarExtra}
          onLogout={handleLogout}
        />
        <main className="ca-content">{renderPage()}</main>
      </div>
    </div>
  );
};

export default CAdminDashboard;
