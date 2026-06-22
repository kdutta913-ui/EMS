import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import "./Hrdash.css";
import { getSession, clearSession } from "../../utils/api";

import {
  LayoutDashboard,
  FileText,
  Calendar,
  UserPlus,
  UserMinus,
  Shield,
  Folder,
  Brain,
  MessageSquare,
} from "lucide-react";
import ChatLayout from "../../chatsys/Chatlayout";
import CheckInOutWidget from "../../components/CheckInOutWidget";

/* ── Pages ── */
import EmployeeRecords from "./emprec/Emprec";
import LeaveAttendance from "./leave/Leave";
import Onboarding from "./onboarding/Onboarding";
import Offboarding from "./offboarding/Offboarding";
import Compliance from "./compliance/Complaince";
import Documents from "./document/Document";
import AIInsights from "./aiinsights/Ai";

/* ── Dashboard Content ── */
import HRDashboardHome from "./hrhome/Hrhome";

/* ── Navigation Configuration ── */
const navSections = [
  {
    label: "Main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={16} />,
      },
      {
        id: "records",
        label: "Employee Records",
        icon: <FileText size={16} />,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        id: "leave",
        label: "Leave & Attendance",
        icon: <Calendar size={16} />,
      },
      {
        id: "onboarding",
        label: "Onboarding",
        icon: <UserPlus size={16} />,
      },
      {
        id: "offboarding",
        label: "Offboarding",
        icon: <UserMinus size={16} />,
      },
    ],
  },
  {
    label: "Performance",
    items: [
      {
        id: "compliance",
        label: "Compliance",
        icon: <Shield size={16} />,
      },
      {
        id: "documents",
        label: "Documents",
        icon: <Folder size={16} />,
      },
      {
        id: "ai-insights",
        label: "AI Insights",
        icon: <Brain size={16} />,
      },
      {
        id: "chat",
        label: "Chat",
        icon: <MessageSquare size={16} />,
      },
    ],
  },
];

// user resolved from session at runtime inside the component

/* ── Page Title Mapping ── */
const pageTitles = {
  dashboard: "HR Dashboard",
  records: "Employee Records",
  leave: "Leave & Attendance",
  onboarding: "Onboarding",
  offboarding: "Offboarding",
  compliance: "Compliance",
  documents: "Documents",
  aiinsights: "AI Insights",
};

/* ── Main Component ── */
const HRDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const navigate = useNavigate();
  const { user: sessionUser } = getSession();
  const userName = sessionUser?.name || "HR Manager";
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const user = { name: userName, role: "HR", initials };

  /* ── Topbar Extra Content ── */
  const now = new Date();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  const topbarExtra = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="ems-topbar__pill ems-topbar__pill--amber">
        <Calendar size={13} />
        Cycle: Q{quarter} {now.getFullYear()}
      </span>
      <CheckInOutWidget />
    </div>
  );

  /* ── Render Selected Page ── */
  const renderPage = () => {
    switch (activeNav) {
      case "dashboard":
        return <HRDashboardHome />;

      case "records":
        return <EmployeeRecords />;

      case "leave":
        return <LeaveAttendance />;

      case "onboarding":
        return <Onboarding />;

      case "offboarding":
        return <Offboarding />;

      case "compliance":
        return <Compliance />;

      case "documents":
        return <Documents />;

      case "ai-insights":
        return <AIInsights />;

      default:
        return <HRDashboardHome />;
    }
  };

  if (activeNav === "chat") {
    return (
      <ChatLayout
        onBackToDashboard={() => setActiveNav("dashboard")}
        userRole="HR"
      />
    );
  }

  return (
    <div className="hr-layout">
      <Sidebar
        navSections={navSections}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        user={user}
      />
      <div className="hr-main">
        <Topbar
          pageTitle={pageTitles[activeNav]}
          user={{ initials: user.initials }}
          notifCount={0}
          extra={topbarExtra}
          onLogout={() => { clearSession(); navigate("/login"); }}
        />
        <main className="hr-content">{renderPage()}</main>
      </div>
    </div>
  );
};

export default HRDashboard;