import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import "./Tl.css";
import { getSession, clearSession, api } from "../../utils/api";

import {
  LayoutDashboard, Users, ClipboardCheck,
  Calendar, Clock, BarChart2, Brain, MessageSquare,
} from "lucide-react";
import ChatLayout from "../../chatsys/Chatlayout";
import CheckInOutWidget from "../../components/CheckInOutWidget";

import MyTeam      from "./myteam/Myteam";
import TasksGoals  from "./task/Task";
import Schedule    from "./combine/schedule";
import Performance from "./combine/Performance";
import AIAnalysis  from "./combine/AI-Analysis";

const navSections = [
  {
    label: "Main",
    items: [
      { id: "dashboard", label: "Dashboard",  icon: <LayoutDashboard size={16} /> },
      { id: "team",      label: "My Team",    icon: <Users size={16} /> },
    ],
  },
  {
    label: "Work",
    items: [
      { id: "tasks",    label: "Tasks & Goals", icon: <ClipboardCheck size={16} /> },
      { id: "schedule", label: "Schedule",       icon: <Calendar size={16} /> },
    ],
  },
  {
    label: "People",
    items: [
      { id: "performance", label: "Performance",     icon: <BarChart2 size={16} />     },
      { id: "ai-analysis", label: "AI Analysis",     icon: <Brain size={16} />         },
      { id: "chat",        label: "Chat",            icon: <MessageSquare size={16} /> },
    ],
  },
];

const TeamLeadDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const navigate = useNavigate();
  const { user: sessionUser } = getSession();
  const userName = sessionUser?.name || "Team Lead";
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  const user = { name: userName, role: "Team Lead", initials };

  const [dashStats,    setDashStats]    = useState(null);
  const [teamAtt,      setTeamAtt]      = useState([]);
  const [tasks,        setTasks]        = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [aiData,       setAiData]       = useState(null);

  useEffect(() => {
    if (activeNav !== "dashboard") return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [dashData, attData, taskData, leaveData, aiAnalytics] = await Promise.all([
          api.get("/dashboard/teamlead"),
          api.get("/attendance/team"),
          api.get("/tasks"),
          api.get("/leaves/pending"),
          api.get("/ai/analytics").catch(() => null),
        ]);
        setDashStats(dashData.stats);
        setTeamAtt(attData.records || []);
        setTasks(taskData.tasks || []);
        setPendingLeaves(leaveData.leaves || []);
        setAiData(aiAnalytics);
      } catch (err) {
        console.error("TL dashboard error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [activeNav]);

  // Poll team attendance every 30 s while on dashboard so check-ins appear without a page reload
  useEffect(() => {
    if (activeNav !== "dashboard") return;
    const id = setInterval(async () => {
      try {
        const attData = await api.get("/attendance/team");
        setTeamAtt(attData.records || []);
      } catch {}
    }, 30000);
    return () => clearInterval(id);
  }, [activeNav]);

  const topbarExtra = (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="ems-topbar__pill ems-topbar__pill--blue">
        <Users size={13} />
        {dashStats ? `Team · ${dashStats.teamSize ?? 0} members` : "Team Lead"}
      </span>
      <CheckInOutWidget />
    </div>
  );

  const openTasks = tasks.filter(t => t.status !== "done").length;
  const inprogressTasks = tasks.filter(t => t.status === "inprogress").length;

  const renderDashboard = () => {
    const healthScore = aiData ? (() => {
      const p = Math.min(aiData.performance.avg_score / 5, 1) * 100;
      const a = Math.max(0, 100 - aiData.attrition.leaving_pct);
      const l = aiData.leave.total > 0
        ? Math.max(0, 100 - (aiData.leave.high_count / aiData.leave.total) * 100)
        : 100;
      return Math.round(p * 0.4 + a * 0.4 + l * 0.2);
    })() : null;
    const hsColor = healthScore == null ? "red" : healthScore >= 80 ? "green" : healthScore >= 60 ? "amber" : "red";
    const hsLabel = healthScore == null ? "AI powered" : healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Needs Attention";

    const perfPct      = aiData ? Math.round(aiData.performance.avg_score / 5 * 100) : 0;
    const topPct       = aiData && aiData.performance.total > 0
      ? Math.round(aiData.performance.top_performers / aiData.performance.total * 100) : 0;
    const retentionPct = aiData ? Math.round(100 - aiData.attrition.leaving_pct) : 0;
    const overallPerf  = aiData ? Math.round((perfPct + topPct + retentionPct) / 3) : 0;
    const overallColor = overallPerf >= 80 ? "#16a34a" : overallPerf >= 60 ? "#d97706" : "#dc2626";
    const overallLabel = overallPerf >= 80 ? "Excellent" : overallPerf >= 60 ? "Good" : overallPerf >= 40 ? "Fair" : "Needs Attention";

    if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading dashboard...</div>;

    return (
      <>
        {/* Stats */}
        <div className="tl-stats-grid">
          <div className="tl-stat-card">
            <div className="tl-stat-header">
              <span className="tl-stat-label">Team Size</span>
              <div className="tl-stat-icon blue"><Users size={17} /></div>
            </div>
            <div className="tl-stat-value">{dashStats?.teamSize ?? 0}</div>
            <div className="tl-stat-meta">{dashStats?.presentToday ?? 0} present today</div>
          </div>
          <div className="tl-stat-card">
            <div className="tl-stat-header">
              <span className="tl-stat-label">Present Today</span>
              <div className="tl-stat-icon green"><Clock size={17} /></div>
            </div>
            <div className="tl-stat-value">{dashStats?.presentToday ?? 0}</div>
            <div className="tl-stat-meta">Checked in so far</div>
          </div>
          <div className="tl-stat-card">
            <div className="tl-stat-header">
              <span className="tl-stat-label">Tasks Pending</span>
              <div className="tl-stat-icon amber"><ClipboardCheck size={17} /></div>
            </div>
            <div className="tl-stat-value">{openTasks}</div>
            <div className="tl-stat-meta">{inprogressTasks} in progress</div>
          </div>
          <div className="tl-stat-card">
            <div className="tl-stat-header">
              <span className="tl-stat-label">Health Score</span>
              <div className={`tl-stat-icon ${hsColor}`}><BarChart2 size={17} /></div>
            </div>
            <div className="tl-stat-value">{healthScore ?? "—"}</div>
            <div className="tl-stat-meta">{hsLabel}</div>
          </div>
        </div>

        {/* Team Attendance + Task Tracker */}
        <div className="tl-grid-2">
          <div className="tl-card">
            <div className="tl-card-header">
              <span className="tl-card-title">Team Attendance Today</span>
            </div>
            <div className="tl-card-body" style={{ padding: "0 20px" }}>
              {teamAtt.length === 0 ? (
                <p style={{ padding: "16px 0", color: "var(--text-muted)", fontSize: 13 }}>No active team members found.</p>
              ) : (
                <table className="tl-table">
                  <thead>
                    <tr><th>Member</th><th>Status</th><th>Check-In</th></tr>
                  </thead>
                  <tbody>
                    {teamAtt.map((a, i) => {
                      const statusLabel =
                        a.status === "pending"   ? "Not Checked In" :
                        a.status === "present"   ? "Present" :
                        a.status === "absent"    ? "Absent" :
                        a.status === "wfh"       ? "WFH" :
                        a.status === "half-day"  ? "Half Day" :
                        a.status === "leave"     ? "On Leave" :
                        a.status?.charAt(0).toUpperCase() + a.status?.slice(1);
                      return (
                        <tr key={i}>
                          <td>
                            <div className="tl-member-name">
                              {a.employeeId?.name || "—"}
                              {a.isSelf && (
                                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginLeft: 6, background: "var(--accent-light)", padding: "1px 6px", borderRadius: 8 }}>You</span>
                              )}
                            </div>
                            <div className="tl-member-role">{a.employeeId?.department}</div>
                          </td>
                          <td>
                            <span className={`tl-tag ${a.status === "pending" ? "pending" : a.status}`}>
                              {statusLabel}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            {a.checkIn || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="tl-card">
            <div className="tl-card-header">
              <span className="tl-card-title">Task Tracker</span>
              <button className="tl-card-action" onClick={() => setActiveNav("tasks")}>View All</button>
            </div>
            <div className="tl-card-body">
              {tasks.length === 0 ? (
                <p style={{ padding: "16px", color: "var(--text-muted)", fontSize: 13 }}>No tasks created yet.</p>
              ) : (
                tasks.slice(0, 5).map((t, i) => (
                  <div className="tl-task-item" key={i}>
                    <div className="tl-task-left">
                      <div className="tl-task-title">{t.title}</div>
                      <div className="tl-task-meta">
                        {t.assignedTo?.name || "—"} · {t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-IN") : "No due date"}
                      </div>
                    </div>
                    <div className="tl-task-right">
                      <span className={`tl-tag ${t.status}`}>
                        {t.status === "inprogress" ? "In Progress" : t.status?.charAt(0).toUpperCase() + t.status?.slice(1)}
                      </span>
                      <span className={`tl-tag ${t.priority}`}>
                        {t.priority?.charAt(0).toUpperCase() + t.priority?.slice(1)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Overall Team Performance — AI powered */}
        <div className="tl-card tl-perf-ai-card">
          <div className="tl-card-header">
            <span className="tl-card-title">Overall Team Performance</span>
            <span className="tl-ai-badge">
              <Brain size={13} />
              AI Powered
            </span>
          </div>
          <div className="tl-perf-ai-body">
            {aiData ? (
              <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
                <div style={{ textAlign: "center", flexShrink: 0, minWidth: 90 }}>
                  <div style={{ fontSize: 48, fontWeight: 700, color: overallColor, lineHeight: 1 }}>{overallPerf}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>/ 100</div>
                  <div style={{ fontSize: 11, fontWeight: 700, marginTop: 8, color: overallColor, background: overallColor + "18", padding: "3px 10px", borderRadius: 12, display: "inline-block" }}>{overallLabel}</div>
                </div>
                <div className="tl-perf-ai-metrics" style={{ flex: 1, maxWidth: "none" }}>
                  {[
                    { label: "Performance Score", pct: perfPct,      color: perfPct >= 80 ? "#16a34a" : perfPct >= 60 ? "#d97706" : "#dc2626" },
                    { label: "Top Performers",    pct: topPct,       color: "#3b82f6" },
                    { label: "Team Retention",    pct: retentionPct, color: retentionPct >= 80 ? "#16a34a" : retentionPct >= 60 ? "#d97706" : "#dc2626" },
                  ].map(({ label, pct, color }) => (
                    <div key={label} className="tl-perf-ai-metric">
                      <div className="tl-perf-ai-metric-label">{label}</div>
                      <div className="tl-perf-ai-metric-bar">
                        <div className="tl-perf-ai-bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 38, textAlign: "right" }}>{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="tl-perf-ai-placeholder">
                <div className="tl-perf-ai-icon-wrap"><Brain size={36} /></div>
                <div className="tl-perf-ai-headline">AI Performance Analysis</div>
                <div className="tl-perf-ai-sub">Start the AI service to see live team performance metrics.</div>
                <div className="tl-perf-ai-metrics">
                  {["Performance Score", "Top Performers", "Team Retention"].map(label => (
                    <div key={label} className="tl-perf-ai-metric">
                      <div className="tl-perf-ai-metric-label">{label}</div>
                      <div className="tl-perf-ai-metric-bar"><div className="tl-perf-ai-bar-fill tl-skeleton" /></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  if (activeNav === "chat") {
    return (
      <ChatLayout
        onBackToDashboard={() => setActiveNav("dashboard")}
        userRole="TeamLead"
      />
    );
  }

  return (
    <div className="tl-layout">
      <Sidebar navSections={navSections} activeNav={activeNav} onNavChange={setActiveNav} user={user} />
      <div className="tl-main">
        <Topbar
          pageTitle="Team Lead Dashboard"
          user={{ initials: user.initials }}
          notifCount={pendingLeaves.length}
          extra={topbarExtra}
          onLogout={() => { clearSession(); navigate("/login"); }}
        />
        <main className="tl-content">
          {activeNav === "dashboard"   && renderDashboard()}
          {activeNav === "team"        && <MyTeam />}
          {activeNav === "tasks"       && <TasksGoals />}
          {activeNav === "schedule"    && <Schedule />}
          {activeNav === "performance" && <Performance />}
          {activeNav === "ai-analysis" && <AIAnalysis />}
        </main>
      </div>
    </div>
  );
};

export default TeamLeadDashboard;
