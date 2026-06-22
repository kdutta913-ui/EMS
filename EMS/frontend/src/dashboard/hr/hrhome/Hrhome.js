import React, { useState, useEffect } from "react";
import "../Hrdash.css";
import { Users, Calendar, UserPlus, AlertTriangle } from "lucide-react";
import { api } from "../../../utils/api";

const HRDashboardHome = () => {
  const [stats, setStats]       = useState(null);
  const [leaves, setLeaves]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [deptBreakdown, setDeptBreakdown] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashData, leaveData, empData] = await Promise.all([
          api.get("/dashboard/hr"),
          api.get("/leaves/pending"),
          api.get("/employees?limit=5&status=active"),
        ]);
        setStats(dashData.stats);
        setDeptBreakdown(dashData.statusBreakdown || []);
        setLeaves(leaveData.leaves || []);
        setEmployees(empData.employees || []);
      } catch (err) {
        console.error("HR dashboard error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleApprove = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await api.put(`/leaves/${id}/approve`);
      setLeaves(prev => prev.filter(l => l._id !== id));
    } catch (err) { alert(err.message); }
    finally { setProcessing(p => ({ ...p, [id]: false })); }
  };

  const handleReject = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await api.put(`/leaves/${id}/reject`, { reason: "Rejected by HR" });
      setLeaves(prev => prev.filter(l => l._id !== id));
    } catch (err) { alert(err.message); }
    finally { setProcessing(p => ({ ...p, [id]: false })); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading dashboard...</div>;

  return (
    <>
      {/* Stats */}
      <div className="hr-stats-grid">
        <div className="hr-stat-card">
          <div className="hr-stat-header">
            <span className="hr-stat-label">Total Headcount</span>
            <div className="hr-stat-icon blue"><Users size={17} /></div>
          </div>
          <div className="hr-stat-value">{stats?.totalEmployees ?? 0}</div>
          <div className="hr-stat-meta">{stats?.newHires ?? 0} joined this month</div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-header">
            <span className="hr-stat-label">On Leave Today</span>
            <div className="hr-stat-icon amber"><Calendar size={17} /></div>
          </div>
          <div className="hr-stat-value">{stats?.onLeave ?? 0}</div>
          <div className="hr-stat-meta">{stats?.pendingLeaves ?? 0} pending approval</div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-header">
            <span className="hr-stat-label">Present Today</span>
            <div className="hr-stat-icon green"><UserPlus size={17} /></div>
          </div>
          <div className="hr-stat-value">{stats?.presentToday ?? 0}</div>
          <div className="hr-stat-meta">Checked in so far</div>
        </div>
        <div className="hr-stat-card">
          <div className="hr-stat-header">
            <span className="hr-stat-label">Pending Approvals</span>
            <div className="hr-stat-icon red"><AlertTriangle size={17} /></div>
          </div>
          <div className="hr-stat-value">{leaves.length}</div>
          <div className="hr-stat-meta"><span className="warn">Needs attention</span></div>
        </div>
      </div>

      {/* Leave Requests + Employee Status */}
      <div className="hr-grid-wide">
        <div className="hr-card">
          <div className="hr-card-header">
            <span className="hr-card-title">Pending Leave Requests</span>
          </div>
          <div className="hr-card-body">
            {leaves.length === 0 ? (
              <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>No pending leave requests.</p>
            ) : (
              leaves.slice(0, 5).map(l => (
                <div className="hr-leave-item" key={l._id}>
                  <div className="hr-leave-info">
                    <div className="hr-leave-name">{l.employeeId?.name || "Employee"}</div>
                    <div className="hr-leave-meta">
                      {l.type} · {new Date(l.fromDate).toLocaleDateString("en-IN")} → {new Date(l.toDate).toLocaleDateString("en-IN")} · {l.employeeId?.department}
                    </div>
                  </div>
                  <div className="hr-leave-actions">
                    <button className="hr-btn-approve" disabled={processing[l._id]} onClick={() => handleApprove(l._id)}>
                      {processing[l._id] ? "..." : "Approve"}
                    </button>
                    <button className="hr-btn-reject" disabled={processing[l._id]} onClick={() => handleReject(l._id)}>
                      {processing[l._id] ? "..." : "Reject"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="hr-card">
          <div className="hr-card-header">
            <span className="hr-card-title">Employee Status Breakdown</span>
          </div>
          <div className="hr-card-body" style={{ padding: "0 20px" }}>
            {deptBreakdown.length === 0 ? (
              <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No data yet.</p>
            ) : (
              <table className="hr-table">
                <thead><tr><th>Status</th><th>Count</th></tr></thead>
                <tbody>
                  {deptBreakdown.map((d, i) => (
                    <tr key={i}>
                      <td><span className={`hr-tag ${d._id}`}>{d._id?.charAt(0).toUpperCase() + d._id?.slice(1)}</span></td>
                      <td>{d.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Recent Employees */}
      <div className="hr-card">
        <div className="hr-card-header">
          <span className="hr-card-title">Recent Employees</span>
        </div>
        <div className="hr-card-body" style={{ padding: "0 20px" }}>
          {employees.length === 0 ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No employees yet.</p>
          ) : (
            <table className="hr-table">
              <thead><tr><th>Name</th><th>Department</th><th>Role</th><th>Status</th></tr></thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e._id}>
                    <td>
                      <div className="hr-leave-name">{e.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.employeeCode}</div>
                    </td>
                    <td>{e.department}</td>
                    <td>{e.role || e.designation || "—"}</td>
                    <td><span className={`hr-tag ${e.status}`}>{e.status?.charAt(0).toUpperCase() + e.status?.slice(1)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default HRDashboardHome;
