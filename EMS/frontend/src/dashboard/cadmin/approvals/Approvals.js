import React, { useState, useEffect } from "react";
import "../CAdmin.css";
import { CheckSquare, Clock3, CheckCircle2, AlertTriangle, Plane } from "lucide-react";
import { api } from "../../../utils/api";

const Approvals = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const fetchLeaves = async () => {
    try {
      const data = await api.get("/leaves/pending");
      setLeaves(data.leaves || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleApprove = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await api.put(`/leaves/${id}/approve`);
      setLeaves(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  };

  const handleReject = async (id) => {
    const reason = prompt("Reason for rejection (optional):") || "Rejected by admin";
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await api.put(`/leaves/${id}/reject`, { reason });
      setLeaves(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  };

  const pending = leaves.filter(l => l.status === "pending").length;

  return (
    <>
      {/* Summary Cards */}
      <div className="ca-stats-grid">
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Pending Approvals</span>
            <div className="ca-stat-icon amber"><Clock3 size={17} /></div>
          </div>
          <div className="ca-stat-value">{pending}</div>
          <div className="ca-stat-meta"><span className="warn">Require action</span></div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Leave Requests</span>
            <div className="ca-stat-icon green"><CheckCircle2 size={17} /></div>
          </div>
          <div className="ca-stat-value">{leaves.filter(l => l.type !== "Work From Home").length}</div>
          <div className="ca-stat-meta">Leave applications</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">WFH Requests</span>
            <div className="ca-stat-icon blue"><AlertTriangle size={17} /></div>
          </div>
          <div className="ca-stat-value">{leaves.filter(l => l.type === "Work From Home").length}</div>
          <div className="ca-stat-meta">Work from home</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Total Pending</span>
            <div className="ca-stat-icon blue"><CheckSquare size={17} /></div>
          </div>
          <div className="ca-stat-value">{leaves.length}</div>
          <div className="ca-stat-meta">All pending requests</div>
        </div>
      </div>

      {/* Approval Queue */}
      <div className="ca-card">
        <div className="ca-card-header">
          <span className="ca-card-title">Pending Approval Queue</span>
        </div>
        <div className="ca-card-body">
          {loading ? (
            <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
          ) : leaves.length === 0 ? (
            <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>No pending approvals.</p>
          ) : (
            leaves.map(request => (
              <div className="ca-tax-item" key={request._id}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", flex: 1 }}>
                  <div className="ca-stat-icon blue"><Plane size={16} /></div>
                  <div>
                    <div className="ca-tax-name">
                      {request.employeeId?.name || "Employee"} · {request.type}
                    </div>
                    <div className="ca-tax-meta">
                      {request.employeeId?.employeeCode} · {request.employeeId?.department}
                    </div>
                    <div className="ca-tax-meta" style={{ marginTop: "4px" }}>
                      {request.totalDays} day{request.totalDays > 1 ? "s" : ""} · {request.reason}
                    </div>
                    <div className="ca-tax-meta" style={{ marginTop: "2px" }}>
                      {new Date(request.fromDate).toLocaleDateString("en-IN")} → {new Date(request.toDate).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button
                    className="ca-btn-approve"
                    disabled={processing[request._id]}
                    onClick={() => handleApprove(request._id)}
                  >
                    {processing[request._id] ? "..." : "Approve"}
                  </button>
                  <button
                    className="ca-btn-reject"
                    disabled={processing[request._id]}
                    onClick={() => handleReject(request._id)}
                  >
                    {processing[request._id] ? "..." : "Reject"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default Approvals;
