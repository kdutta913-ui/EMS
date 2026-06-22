import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import "./Finance.css";
import { getSession, clearSession } from "../../utils/api";

import {
  LayoutDashboard,
  Wallet,
  Receipt,
  RefreshCcw,
  Shield,
  FileBarChart,
  Brain,
  Calendar,
  MessageSquare,
} from "lucide-react";
import ChatLayout from "../../chatsys/Chatlayout";
import CheckInOutWidget from "../../components/CheckInOutWidget";

/* ── Dashboard Home ── */
import FinanceDashboardHome from "./finhome/Finhome";

/* ── Module Pages ── */
import Payroll from "./payroll/Payroll";
import ExpenseClaims from "./ec/Ec";
import Reimbursements from "./reimburse/Reimburse";
import TaxCompliance from "./tax/Tax";
import FinancialReports from "./report/Report";
import AIFinance from "./ai/Ai";

/* ── Sidebar Navigation ── */
const navSections = [
  {
    label: "Main",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard size={16} />,
      },
    ],
  },
  {
    label: "Finance Operations",
    items: [
      {
        id: "payroll",
        label: "Payroll",
        icon: <Wallet size={16} />,
      },
      {
        id: "expense-claims",
        label: "Expense Claims",
        icon: <Receipt size={16} />,
      },
      {
        id: "reimbursements",
        label: "Reimbursements",
        icon: <RefreshCcw size={16} />,
      },
      {
        id: "tax-compliance",
        label: "Tax & Compliance",
        icon: <Shield size={16} />,
      },
      {
        id: "financial-reports",
        label: "Financial Reports",
        icon: <FileBarChart size={16} />,
      },
    ],
  },
  {
    label: "Insights",
    items: [
      {
        id: "ai-finance",
        label: "AI-Finance",
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

/* ── Page Titles ── */
const pageTitles = {
  dashboard: "Finance Dashboard",
  payroll: "Payroll",
  "expense-claims": "Expense Claims",
  reimbursements: "Reimbursements",
  "tax-compliance": "Tax & Compliance",
  "financial-reports": "Financial Reports",
  "ai-finance": "AI-Finance",
};

const Finance = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const navigate = useNavigate();
  const { user: sessionUser } = getSession();
  const userName = sessionUser?.name || "Finance Manager";
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const user = { name: userName, role: "Finance", initials };

  /* ── Topbar Badge ── */
  const now = new Date();
  const monthName = now.toLocaleString("en-US", { month: "long" });
  const topbarExtra = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="fin-topbar__pill fin-topbar__pill--amber">
        <Calendar size={13} />
        Payroll Cycle: {monthName} {now.getFullYear()}
      </span>
      <CheckInOutWidget />
    </div>
  );

  /* ── Dynamic Page Rendering ── */
  const renderPage = () => {
    switch (activeNav) {
      case "dashboard":
        return <FinanceDashboardHome />;

      case "payroll":
        return <Payroll />;

      case "expense-claims":
        return <ExpenseClaims />;

      case "reimbursements":
        return <Reimbursements />;

      case "tax-compliance":
        return <TaxCompliance />;

      case "financial-reports":
        return <FinancialReports />;

      case "ai-finance":
        return <AIFinance />;

      default:
        return <FinanceDashboardHome />;
    }
  };

  if (activeNav === "chat") {
    return (
      <ChatLayout
        onBackToDashboard={() => setActiveNav("dashboard")}
        userRole="Finance"
      />
    );
  }

  return (
    <div className="fin-layout">
      <Sidebar
        navSections={navSections}
        activeNav={activeNav}
        onNavChange={setActiveNav}
        user={user}
      />
      <div className="fin-main">
        <Topbar
          pageTitle={pageTitles[activeNav]}
          user={{ initials: user.initials }}
          notifCount={0}
          extra={topbarExtra}
          onLogout={() => { clearSession(); navigate("/login"); }}
        />
        <main className="fin-content">{renderPage()}</main>
      </div>
    </div>
  );
};

export default Finance;