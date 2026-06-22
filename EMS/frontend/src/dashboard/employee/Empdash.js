import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import "./Empdash.css";
import { getSession, clearSession, api } from "../../utils/api";

import {
  LayoutDashboard, User, Users, Clock, FileText,
  BarChart2, Award, Bot, Ticket, ClipboardList,
  CheckCircle, XCircle, Download, Calendar, MessageSquare,
} from "lucide-react";
import ChatLayout from "../../chatsys/Chatlayout";

import MyProfile   from "./myprof/Myprof";
import Leave       from "./leave/Leave";
import Attendance  from "./attendance/Attendance";
import Payslip     from "./pay/Pay";
import EmpTask     from "./tasks/EmpTask";
import Performance from "./comb/Performance";
import Training    from "./comb/Training";
import AIAssistant from "./comb/Ai";
import RaiseTicket from "./comb/Raise";

const navSections = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard",  icon: <LayoutDashboard size={16} /> },
      { id: "profile",   label: "My Profile", icon: <User size={16} />            },
    ],
  },
  {
    label: "Self Service",
    items: [
      { id: "leave",      label: "Leave",      icon: <Users size={16} />         },
      { id: "attendance", label: "Attendance", icon: <Clock size={16} />         },
      { id: "payslip",    label: "Payslip",    icon: <FileText size={16} />      },
      { id: "tasks",      label: "Tasks",      icon: <ClipboardList size={16} /> },
    ],
  },
  {
    label: "Growth",
    items: [
      { id: "performance", label: "Performance", icon: <BarChart2 size={16} /> },
      { id: "training",    label: "Training",    icon: <Award size={16} />     },
    ],
  },
  {
    label: "Support",
    items: [
      { id: "ai",     label: "AI Assistant", icon: <Bot size={16} />           },
      { id: "ticket", label: "Raise Ticket", icon: <Ticket size={16} />        },
      { id: "chat",   label: "Chat",         icon: <MessageSquare size={16} /> },
    ],
  },
];

/* ── SVG wave chart for performance metrics ── */
const PerformanceWaveChart = ({ data }) => {
  const [hovered, setHovered] = React.useState(null);
  const W = 460, H = 180;
  const padL = 36, padR = 16, padT = 20, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const minVal = 0, maxVal = 100;
  const xOf = (i) => padL + (i / Math.max(data.length - 1, 1)) * chartW;
  const yOf = (v) => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;
  const points = data.map((d, i) => [xOf(i), yOf(d.pct)]);
  const catmullRom = (pts) => {
    if (pts.length < 2) return "";
    let path = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];
      const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
      const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
      const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
      const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
    }
    return path;
  };
  const linePath = catmullRom(points);
  const areaPath = points.length > 1
    ? `${linePath} L ${points[points.length - 1][0]},${padT + chartH} L ${points[0][0]},${padT + chartH} Z`
    : "";
  const gridLines = [25, 50, 75, 100];
  return (
    <div className="emp-wave-chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" style={{ overflow: "visible" }}>
        <defs>
          <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {gridLines.map(v => (
          <g key={v}>
            <line x1={padL} y1={yOf(v)} x2={W - padR} y2={yOf(v)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
            <text x={padL - 4} y={yOf(v) + 4} textAnchor="end" fontSize="10" fill="#64748b" fontFamily="Inter, sans-serif">{v}</text>
          </g>
        ))}
        {areaPath && <path d={areaPath} fill="url(#perfGrad)" />}
        {linePath && <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
        {data.map((d, i) => (
          <text key={i} x={xOf(i)} y={H - 4} textAnchor="middle" fontSize="10" fill="#64748b" fontFamily="Inter, sans-serif">
            {d.label?.slice(0, 5)}
          </text>
        ))}
        {points.map(([x, y], i) => (
          <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} style={{ cursor: "pointer" }}>
            <circle cx={x} cy={y} r={hovered === i ? 7 : 5} fill="#fff" stroke="#3b82f6" strokeWidth={hovered === i ? 2.5 : 2} style={{ transition: "r 0.15s ease" }} />
            {hovered === i && (
              <>
                <rect x={x - 42} y={y - 38} width={84} height={26} rx={6} fill="#0f172a" />
                <text x={x} y={y - 20} textAnchor="middle" fontSize="12" fill="#fff" fontFamily="Inter, sans-serif" fontWeight="600">{data[i].label}: {data[i].pct}%</text>
              </>
            )}
          </g>
        ))}
      </svg>
      <div className="emp-wave-legend">
        {data.map((d, i) => (
          <div key={i} className="emp-wave-legend-item">
            <span className="emp-wave-legend-dot" />
            <span className="emp-wave-legend-label">{d.label}</span>
            <span className="emp-wave-legend-val">{d.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const pageTitles = {
  dashboard:   "Dashboard",
  profile:     "My Profile",
  leave:       "Leave",
  attendance:  "Attendance",
  payslip:     "Payslip",
  tasks:       "My Tasks",
  performance: "Performance",
  training:    "Training",
  ai:          "AI Assistant",
  ticket:      "Raise Ticket",
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user: sessionUser } = getSession();
  const userName = sessionUser?.name || "Employee";
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const user = { name: userName, role: "Employee", initials };

  const [activeNav, setActiveNav] = useState("dashboard");

  // Dashboard home state
  const [dashStats,    setDashStats]    = useState(null);
  const [todayAtt,     setTodayAtt]     = useState(null);
  const [recentAtt,    setRecentAtt]    = useState([]);
  const [recentPay,    setRecentPay]    = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [balance,      setBalance]      = useState(null);
  const [perfReviews,  setPerfReviews]  = useState([]);
  const [checkingIn,   setCheckingIn]   = useState(false);
  const [checkingOut,  setCheckingOut]  = useState(false);

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const fetchHome = React.useCallback(async () => {
    try {
      const [dashData, todayData, attData, payData, taskData, balData, perfData] = await Promise.all([
        api.get("/dashboard/employee"),
        api.get("/attendance/today"),
        api.get(`/attendance/my?month=${month}&year=${year}`),
        api.get("/payroll/payslips/my"),
        api.get("/tasks"),
        api.get("/leaves/balance"),
        api.get("/performance/my"),
      ]);
      setDashStats(dashData.stats);
      setTodayAtt(todayData.record);
      setRecentAtt((attData.records || []).slice(-5).reverse());
      setRecentPay((payData.payslips || []).slice(0, 3));
      setPendingTasks((taskData.tasks || []).filter(t => t.status !== "done").slice(0, 4));
      setBalance(balData.balance);
      const reviews = perfData.reviews || [];
      if (reviews.length > 0 && reviews[0].metrics) {
        setPerfReviews(reviews[0].metrics.map(m => ({ label: m.label, pct: m.score || 0 })));
      }
    } catch (err) {
      console.error("Employee home fetch error:", err.message);
    }
  }, [month, year]);

  useEffect(() => {
    if (activeNav === "dashboard") fetchHome();
  }, [activeNav, fetchHome]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post("/attendance/checkin", {});
      const d = await api.get("/attendance/today");
      setTodayAtt(d.record);
    } catch (err) { alert(err.message); }
    finally { setCheckingIn(false); }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await api.post("/attendance/checkout", {});
      const d = await api.get("/attendance/today");
      setTodayAtt(d.record);
    } catch (err) { alert(err.message); }
    finally { setCheckingOut(false); }
  };

  const isCheckedIn  = todayAtt?.checkIn && !todayAtt?.checkOut;
  const isCheckedOut = todayAtt?.checkIn && todayAtt?.checkOut;

  const topbarExtra = (
    <>
      {isCheckedOut ? (
        <span className="ems-topbar__pill ems-topbar__pill--green">
          <CheckCircle size={13} /> {todayAtt.checkIn} → {todayAtt.checkOut}
        </span>
      ) : isCheckedIn ? (
        <button className="ems-topbar__action-btn ems-topbar__action-btn--checkout" onClick={handleCheckOut} disabled={checkingOut}>
          <XCircle size={14} /> {checkingOut ? "Checking Out..." : "Check Out"}
        </button>
      ) : (
        <button className="ems-topbar__action-btn ems-topbar__action-btn--checkin" onClick={handleCheckIn} disabled={checkingIn}>
          <CheckCircle size={14} /> {checkingIn ? "Checking In..." : "Check In"}
        </button>
      )}
    </>
  );

  const renderPage = () => {
    switch (activeNav) {
      case "profile":     return <MyProfile />;
      case "leave":       return <Leave />;
      case "attendance":  return <Attendance />;
      case "payslip":     return <Payslip />;
      case "tasks":       return <EmpTask />;
      case "performance": return <Performance />;
      case "training":    return <Training />;
      case "ai":          return <AIAssistant />;
      case "ticket":      return <RaiseTicket />;
      default:            return renderDashboard();
    }
  };

  const balanceCards = balance ? [
    { type: "Earned Leave",  total: balance.earnedLeave?.total ?? 18, used: balance.earnedLeave?.used ?? 0 },
    { type: "Sick Leave",    total: balance.sickLeave?.total ?? 12,   used: balance.sickLeave?.used ?? 0   },
    { type: "Casual Leave",  total: balance.casualLeave?.total ?? 6,  used: balance.casualLeave?.used ?? 0 },
  ] : [];

  const totalLeaveRemaining = balanceCards.reduce((s, b) => s + (b.total - b.used), 0);

  const renderDashboard = () => (
    <main className="emp-content">
      {/* Welcome Banner */}
      <div className="emp-welcome">
        <div className="emp-welcome-left">
          <div className="emp-welcome-greeting">
            {now.getHours() < 12 ? "Good Morning" : now.getHours() < 17 ? "Good Afternoon" : "Good Evening"}, {userName.split(" ")[0]} 👋
          </div>
          <div className="emp-welcome-sub">
            {isCheckedOut
              ? `Completed · ${todayAtt.checkIn} → ${todayAtt.checkOut}`
              : isCheckedIn
              ? `Checked in at ${todayAtt.checkIn} · Have a productive day!`
              : "You haven't checked in yet today."}
          </div>
        </div>
        <div className="emp-welcome-right">
          {isCheckedOut ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.15)", padding: "12px 24px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontWeight: 700, fontSize: 15 }}>
                <CheckCircle size={16} /> Day Complete
              </div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
                {todayAtt.checkIn} → {todayAtt.checkOut}
              </div>
            </div>
          ) : isCheckedIn ? (
            <button className="emp-checkin-btn checkout" onClick={handleCheckOut} disabled={checkingOut}>
              <XCircle size={15} /> {checkingOut ? "Checking Out..." : "Check Out"}
            </button>
          ) : (
            <button className="emp-checkin-btn checkin" onClick={handleCheckIn} disabled={checkingIn}>
              <CheckCircle size={15} /> {checkingIn ? "Checking In..." : "Check In"}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="emp-stats-grid">
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">Days Present</span>
            <div className="emp-stat-icon green"><CheckCircle size={17} /></div>
          </div>
          <div className="emp-stat-value">{dashStats?.presentThisMonth ?? recentAtt.filter(a => a.status === "present" || a.status === "wfh").length}</div>
          <div className="emp-stat-meta">This month</div>
        </div>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">Leave Balance</span>
            <div className="emp-stat-icon blue"><Calendar size={17} /></div>
          </div>
          <div className="emp-stat-value">{totalLeaveRemaining}</div>
          <div className="emp-stat-meta">Days remaining across all types</div>
        </div>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">Tasks Pending</span>
            <div className="emp-stat-icon amber"><Ticket size={17} /></div>
          </div>
          <div className="emp-stat-value">{dashStats?.pendingTasks ?? pendingTasks.length}</div>
          <div className="emp-stat-meta">Assigned to you</div>
        </div>
        <div className="emp-stat-card">
          <div className="emp-stat-header">
            <span className="emp-stat-label">Performance</span>
            <div className="emp-stat-icon green"><BarChart2 size={17} /></div>
          </div>
          <div className="emp-stat-value">
            {perfReviews.length > 0
              ? `${Math.round(perfReviews.reduce((s, m) => s + m.pct, 0) / perfReviews.length)}%`
              : "—"}
          </div>
          <div className="emp-stat-meta">Latest review score</div>
        </div>
      </div>

      {/* Leave Balance + Recent Attendance */}
      <div className="emp-grid-2">
        <div className="emp-card">
          <div className="emp-card-header">
            <span className="emp-card-title">Leave Balance</span>
            <button className="emp-card-action" onClick={() => setActiveNav("leave")}>Apply Leave</button>
          </div>
          <div className="emp-card-body">
            {balanceCards.length === 0 ? (
              <p style={{ padding: "16px", color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
            ) : (
              <div className="emp-leave-grid">
                {balanceCards.map((l, i) => {
                  const remaining = l.total - l.used;
                  const pct = l.total ? Math.round((l.used / l.total) * 100) : 0;
                  return (
                    <div className="emp-leave-item" key={i}>
                      <div className="emp-leave-count">{remaining}</div>
                      <div className="emp-leave-type">{l.type}</div>
                      <div className="emp-leave-used">{l.used} used of {l.total}</div>
                      <div className="emp-leave-bar">
                        <div className="emp-leave-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="emp-card">
          <div className="emp-card-header">
            <span className="emp-card-title">Recent Attendance</span>
            <button className="emp-card-action" onClick={() => setActiveNav("attendance")}>View All</button>
          </div>
          <div className="emp-card-body" style={{ padding: "0 24px" }}>
            {recentAtt.length === 0 ? (
              <p style={{ padding: "16px 0", color: "var(--text-muted)", fontSize: 13 }}>No attendance records yet.</p>
            ) : (
              recentAtt.map((a, i) => (
                <div className="emp-attendance-row" key={i}>
                  <span className="emp-att-date">{new Date(a.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                  <span className="emp-att-time">{a.checkIn || "—"} — {a.checkOut || "—"}</span>
                  <span className="emp-att-hours">{a.totalHours ? `${a.totalHours}h` : "—"}</span>
                  <span className={`emp-tag ${a.status}`}>{a.status?.charAt(0).toUpperCase() + a.status?.slice(1)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Payslips + Pending Tasks */}
      <div className="emp-grid-2">
        <div className="emp-card">
          <div className="emp-card-header">
            <span className="emp-card-title">Recent Payslips</span>
            <button className="emp-card-action" onClick={() => setActiveNav("payslip")}>View All</button>
          </div>
          <div className="emp-card-body">
            {recentPay.length === 0 ? (
              <p style={{ padding: "16px", color: "var(--text-muted)", fontSize: 13 }}>No payslips yet.</p>
            ) : (
              recentPay.map((p, i) => {
                const mnths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
                return (
                  <div className="emp-payslip-row" key={i}>
                    <div>
                      <div className="emp-payslip-month">{mnths[p.month - 1]} {p.year}</div>
                      <div className="emp-payslip-meta">{p.status}</div>
                    </div>
                    <div className="emp-payslip-amount">₹{Number(p.netPay).toLocaleString("en-IN")}</div>
                    <button className="emp-download-btn"><Download size={13} /> Download</button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="emp-card">
          <div className="emp-card-header">
            <span className="emp-card-title">Pending Tasks</span>
            <button className="emp-card-action" onClick={() => setActiveNav("tasks")}>View All</button>
          </div>
          <div className="emp-card-body">
            {pendingTasks.length === 0 ? (
              <p style={{ padding: "16px", color: "var(--text-muted)", fontSize: 13 }}>No pending tasks.</p>
            ) : (
              pendingTasks.map((t, i) => (
                <div className="emp-task-item" key={i}>
                  <span className={`emp-task-dot ${t.priority}`} />
                  <div>
                    <div className="emp-task-text">{t.title}</div>
                    <div className="emp-task-due">
                      {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN") : "No due date"} · {t.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Performance Overview */}
      {perfReviews.length > 0 && (
        <div className="emp-card">
          <div className="emp-card-header">
            <span className="emp-card-title">Performance Overview</span>
            <button className="emp-card-action" onClick={() => setActiveNav("performance")}>Full Report</button>
          </div>
          <div className="emp-card-body">
            <PerformanceWaveChart data={perfReviews} />
          </div>
        </div>
      )}
    </main>
  );

  if (activeNav === "chat") {
    return (
      <ChatLayout
        onBackToDashboard={() => setActiveNav("dashboard")}
        userRole="Employee"
      />
    );
  }

  return (
    <div className="emp-layout">
      <Sidebar navSections={navSections} activeNav={activeNav} onNavChange={setActiveNav} user={user} />
      <div className="emp-main">
        <Topbar
          pageTitle={pageTitles[activeNav]}
          user={{ initials: user.initials }}
          notifCount={dashStats?.myLeavesPending ?? 0}
          extra={topbarExtra}
          onLogout={() => { clearSession(); navigate("/login"); }}
        />
        {renderPage()}
      </div>
    </div>
  );
};

export default EmployeeDashboard;
