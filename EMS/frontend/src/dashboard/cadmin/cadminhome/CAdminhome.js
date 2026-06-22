import React, { useState, useEffect } from "react";
import "../CAdmin.css";
import { Users, Building2, CheckSquare, UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../../utils/api";

const CAdminDashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [presentEmployees, setPresentEmployees] = useState([]);
  const [onLeaveEmployees, setOnLeaveEmployees] = useState([]);
  const [attendanceExpanded, setAttendanceExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashData, deptData, leaveData] = await Promise.all([
          api.get("/dashboard/admin"),
          api.get("/departments"),
          api.get("/leaves/pending"),
        ]);
        setStats(dashData.stats);
        setRecentEmployees(dashData.recentJoinees || []);
        setPresentEmployees(dashData.presentEmployees || []);
        setOnLeaveEmployees(dashData.onLeaveEmployees || []);
        setDepartments(deptData.departments || []);
        setPendingLeaves((leaveData.leaves || []).slice(0, 3));
      } catch (err) {
        console.error("Dashboard fetch error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleApprove = async (leaveId) => {
    try {
      await api.put(`/leaves/${leaveId}/approve`);
      setPendingLeaves(prev => prev.filter(l => l._id !== leaveId));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReject = async (leaveId) => {
    try {
      await api.put(`/leaves/${leaveId}/reject`, { reason: "Rejected by admin" });
      setPendingLeaves(prev => prev.filter(l => l._id !== leaveId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading dashboard...</div>;

  return (
    <>
      {/* Stats */}
      <div className="ca-stats-grid">
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Total Employees</span>
            <div className="ca-stat-icon blue"><Users size={17} /></div>
          </div>
          <div className="ca-stat-value">{stats?.totalEmployees ?? 0}</div>
          <div className="ca-stat-meta">{stats?.activeEmployees ?? 0} active</div>
        </div>

        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Departments</span>
            <div className="ca-stat-icon green"><Building2 size={17} /></div>
          </div>
          <div className="ca-stat-value">{departments.length}</div>
          <div className="ca-stat-meta">Active departments</div>
        </div>

        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Pending Approvals</span>
            <div className="ca-stat-icon amber"><CheckSquare size={17} /></div>
          </div>
          <div className="ca-stat-value">{stats?.pendingLeaves ?? 0}</div>
          <div className="ca-stat-meta">Needs your attention</div>
        </div>

        <div
          className="ca-stat-card"
          style={{ cursor: "pointer" }}
          onClick={() => setAttendanceExpanded(prev => !prev)}
        >
          <div className="ca-stat-header">
            <span className="ca-stat-label">Present Today</span>
            <div className="ca-stat-icon green"><UserPlus size={17} /></div>
          </div>
          <div className="ca-stat-value">{stats?.presentToday ?? 0}</div>
          <div className="ca-stat-meta" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span>{stats?.onLeaveToday ?? 0} on leave</span>
            {attendanceExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </div>
        </div>
      </div>

      {/* Attendance Overview — expandable panel */}
      {attendanceExpanded && (
        <div className="ca-grid-2">
          <div className="ca-card">
            <div className="ca-card-header">
              <span className="ca-card-title">Present Today ({presentEmployees.length})</span>
            </div>
            <div className="ca-card-body" style={{ padding: "0 20px" }}>
              {presentEmployees.length === 0 ? (
                <p style={{ padding: "16px 0", color: "var(--text-muted)", fontSize: 13 }}>No check-ins yet today.</p>
              ) : (
                <table className="ca-table">
                  <thead>
                    <tr><th>Employee</th><th>Department</th><th>Check In</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {presentEmployees.map((e, i) => (
                      <tr key={i}>
                        <td>
                          <div className="ca-emp-name">{e.name}</div>
                          <div className="ca-emp-id">{e.designation}</div>
                        </td>
                        <td><span className="ca-emp-dept">{e.department}</span></td>
                        <td style={{ fontSize: 13, fontWeight: 600 }}>{e.checkIn || "—"}</td>
                        <td>
                          <span className={`ca-tag ${e.status}`}>
                            {e.status === "wfh" ? "WFH" : "Present"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="ca-card">
            <div className="ca-card-header">
              <span className="ca-card-title">On Leave Today ({onLeaveEmployees.length})</span>
            </div>
            <div className="ca-card-body" style={{ padding: "0 20px" }}>
              {onLeaveEmployees.length === 0 ? (
                <p style={{ padding: "16px 0", color: "var(--text-muted)", fontSize: 13 }}>No approved leaves today.</p>
              ) : (
                <table className="ca-table">
                  <thead>
                    <tr><th>Employee</th><th>Department</th><th>Leave Type</th></tr>
                  </thead>
                  <tbody>
                    {onLeaveEmployees.map((e, i) => (
                      <tr key={i}>
                        <td>
                          <div className="ca-emp-name">{e.name}</div>
                          <div className="ca-emp-id">{e.designation}</div>
                        </td>
                        <td><span className="ca-emp-dept">{e.department}</span></td>
                        <td><span className="ca-tag on-leave">{e.leaveType}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Employees + Departments */}
      <div className="ca-grid-2">
        <div className="ca-card">
          <div className="ca-card-header">
            <span className="ca-card-title">Recent Employees</span>
          </div>
          <div className="ca-card-body" style={{ padding: "0 20px" }}>
            {recentEmployees.length === 0 ? (
              <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No employees yet.</p>
            ) : (
              <table className="ca-table">
                <thead>
                  <tr><th>Employee</th><th>Department</th><th>Role</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {recentEmployees.map(e => (
                    <tr key={e._id}>
                      <td>
                        <div className="ca-emp-name">{e.name}</div>
                        <div className="ca-emp-id">{e.employeeCode}</div>
                      </td>
                      <td><span className="ca-emp-dept">{e.department}</span></td>
                      <td>{e.designation || e.role}</td>
                      <td>
                        <span className={`ca-tag ${e.status}`}>
                          {e.status?.charAt(0).toUpperCase() + e.status?.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="ca-card">
          <div className="ca-card-header">
            <span className="ca-card-title">Departments & Teams</span>
          </div>
          <div className="ca-card-body">
            {departments.length === 0 ? (
              <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>No departments created yet.</p>
            ) : (
              departments.map((d, i) => (
                <div className="ca-dept-item" key={i}>
                  <div>
                    <div className="ca-dept-name">{d.name}</div>
                    <div className="ca-dept-lead">Lead: {d.managerId?.name || "—"}</div>
                  </div>
                  <div className="ca-dept-right">
                    <div className="ca-dept-count">{d.employeeCount ?? 0}</div>
                    <div className="ca-dept-label">members</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="ca-card">
        <div className="ca-card-header">
          <span className="ca-card-title">Pending Approvals</span>
        </div>
        <div className="ca-card-body">
          {pendingLeaves.length === 0 ? (
            <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>No pending approvals.</p>
          ) : (
            pendingLeaves.map(l => (
              <div className="ca-approval-item" key={l._id}>
                <div className="ca-approval-info">
                  <div className="ca-approval-name">{l.employeeId?.name || "Employee"}</div>
                  <div className="ca-approval-meta">{l.type} · {l.totalDays} day{l.totalDays > 1 ? "s" : ""} · {l.reason}</div>
                </div>
                <div className="ca-approval-actions">
                  <button className="ca-btn-approve" onClick={() => handleApprove(l._id)}>Approve</button>
                  <button className="ca-btn-reject" onClick={() => handleReject(l._id)}>Reject</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default CAdminDashboardHome;
