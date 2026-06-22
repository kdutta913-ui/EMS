import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import "./Super.css";
import { LayoutDashboard, Building2, Users, Activity, Shield, CreditCard, Settings, MessageSquare } from "lucide-react";
import ChatLayout from "../../chatsys/Chatlayout";
import { api, getSession, clearSession } from "../../utils/api";

const navSections = [
  {
    label: "Main",
    items: [
      { id: "dashboard",  label: "Dashboard",     icon: <LayoutDashboard size={16} strokeWidth={1.8} /> },
      { id: "companies",  label: "Companies",      icon: <Building2 size={16} strokeWidth={1.8} /> },
      { id: "users",      label: "All Users",      icon: <Users size={16} strokeWidth={1.8} /> },
      { id: "health",     label: "System Health",  icon: <Activity size={16} strokeWidth={1.8} /> },
    ],
  },
  {
    label: "Management",
    items: [
      { id: "audit",    label: "Audit Logs", icon: <Shield size={16} strokeWidth={1.8} />       },
      { id: "billing",  label: "Billing",    icon: <CreditCard size={16} strokeWidth={1.8} />   },
      { id: "settings", label: "Settings",   icon: <Settings size={16} strokeWidth={1.8} />     },
      { id: "chat",     label: "Chat",       icon: <MessageSquare size={16} strokeWidth={1.8} /> },
    ],
  },
];

const SuperAdminDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [stats, setStats]         = useState(null);
  const [companies, setCompanies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const navigate = useNavigate();

  const { user: sessionUser } = getSession();
  const userName = sessionUser?.name || "Super Admin";
  const initials = userName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsData, companiesData, logsData] = await Promise.all([
          api.get("/superadmin/stats"),
          api.get("/superadmin/companies?limit=10"),
          api.get("/superadmin/audit-logs?limit=5"),
        ]);
        setStats(statsData.stats);
        setCompanies(companiesData.companies || []);
        setAuditLogs(logsData.logs || []);
      } catch (err) {
        console.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (activeNav === "users") {
      api.get("/superadmin/users?limit=20").then(d => setUsers(d.users || [])).catch(() => {});
    }
  }, [activeNav]);

  const handleToggleCompany = async (companyId) => {
    try {
      await api.put(`/superadmin/companies/${companyId}/toggle`);
      setCompanies(prev => prev.map(c => c._id === companyId ? { ...c, isActive: !c.isActive } : c));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLogout = () => { clearSession(); navigate("/login"); };

  const topbarExtra = (
    <span className="ems-topbar__pill ems-topbar__pill--green">
      <span className="ems-topbar__pulse-dot" />
      System Online
    </span>
  );

  if (activeNav === "chat") {
    return (
      <ChatLayout
        onBackToDashboard={() => setActiveNav("dashboard")}
        userRole="SuperAdmin"
      />
    );
  }

  return (
    <div className="sa-layout">
      <Sidebar navSections={navSections} activeNav={activeNav} onNavChange={setActiveNav} user={{ name: userName, role: "Super Admin", initials }} />
      <div className="sa-main">
        <Topbar pageTitle="Super Admin Dashboard" user={{ initials }} notifCount={0} extra={topbarExtra} onLogout={handleLogout} />
        <main className="sa-content">

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div>
          ) : (
            <>
              {/* Stats */}
              <div className="sa-stats-grid">
                <div className="sa-stat-card">
                  <div className="sa-stat-header">
                    <span className="sa-stat-label">Total Companies</span>
                    <div className="sa-stat-icon blue"><Building2 size={17} strokeWidth={1.8} /></div>
                  </div>
                  <div className="sa-stat-value">{stats?.totalCompanies ?? 0}</div>
                  <div className="sa-stat-meta">{stats?.companiesThisMonth ?? 0} added this month</div>
                </div>
                <div className="sa-stat-card">
                  <div className="sa-stat-header">
                    <span className="sa-stat-label">Total Users</span>
                    <div className="sa-stat-icon green"><Users size={17} strokeWidth={1.8} /></div>
                  </div>
                  <div className="sa-stat-value">{stats?.totalUsers ?? 0}</div>
                  <div className="sa-stat-meta">Registered accounts</div>
                </div>
                <div className="sa-stat-card">
                  <div className="sa-stat-header">
                    <span className="sa-stat-label">Active Companies</span>
                    <div className="sa-stat-icon amber"><CreditCard size={17} strokeWidth={1.8} /></div>
                  </div>
                  <div className="sa-stat-value">{stats?.activeCompanies ?? 0}</div>
                  <div className="sa-stat-meta">{stats?.inactiveCompanies ?? 0} inactive</div>
                </div>
                <div className="sa-stat-card">
                  <div className="sa-stat-header">
                    <span className="sa-stat-label">Total Employees</span>
                    <div className="sa-stat-icon green"><Activity size={17} strokeWidth={1.8} /></div>
                  </div>
                  <div className="sa-stat-value">{stats?.totalEmployees ?? 0}</div>
                  <div className="sa-stat-meta">Across all companies</div>
                </div>
              </div>

              {/* Companies View */}
              {(activeNav === "dashboard" || activeNav === "companies") && (
                <div className="sa-card">
                  <div className="sa-card-header">
                    <span className="sa-card-title">Registered Companies</span>
                  </div>
                  <div className="sa-card-body" style={{ padding: "0 20px" }}>
                    {companies.length === 0 ? (
                      <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No companies registered yet.</p>
                    ) : (
                      <table className="sa-table">
                        <thead>
                          <tr><th>Company</th><th>Admin</th><th>Employees</th><th>Status</th><th>Action</th></tr>
                        </thead>
                        <tbody>
                          {companies.map(c => (
                            <tr key={c._id}>
                              <td>
                                <div className="sa-company-name">{c.name}</div>
                                <div className="sa-company-id">{c._id?.slice(-6)}</div>
                              </td>
                              <td>{c.adminId?.name || "—"}</td>
                              <td>{c.employeeCount ?? 0}</td>
                              <td>
                                <span className={`sa-tag ${c.isActive ? "active" : "inactive"}`}>
                                  {c.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td>
                                <button className="sa-card-action" onClick={() => handleToggleCompany(c._id)}>
                                  {c.isActive ? "Deactivate" : "Activate"}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}

              {/* Users View */}
              {activeNav === "users" && (
                <div className="sa-card">
                  <div className="sa-card-header">
                    <span className="sa-card-title">All Users</span>
                  </div>
                  <div className="sa-card-body" style={{ padding: "0 20px" }}>
                    <table className="sa-table">
                      <thead>
                        <tr><th>User</th><th>Role</th><th>Company</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id}>
                            <td>
                              <div className="sa-company-name">{u.name}</div>
                              <div className="sa-company-id">{u.email}</div>
                            </td>
                            <td>{u.role}</td>
                            <td>{u.companyId?.name || "—"}</td>
                            <td><span className={`sa-tag ${u.isActive ? "active" : "inactive"}`}>{u.isActive ? "Active" : "Inactive"}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Audit Logs */}
              {(activeNav === "dashboard" || activeNav === "audit") && (
                <div className="sa-card">
                  <div className="sa-card-header">
                    <span className="sa-card-title">Recent Audit Logs</span>
                  </div>
                  <div className="sa-card-body">
                    {auditLogs.length === 0 ? (
                      <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>No audit logs yet.</p>
                    ) : (
                      <ul className="sa-audit-list">
                        {auditLogs.map((log, i) => (
                          <li className="sa-audit-item" key={i}>
                            <span className="sa-audit-dot" />
                            <div>
                              <div className="sa-audit-text">{log.action} — {log.resource}</div>
                              <div className="sa-audit-meta">
                                {log.performedBy?.name || "System"} · {new Date(log.createdAt).toLocaleString("en-IN")}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

        </main>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
