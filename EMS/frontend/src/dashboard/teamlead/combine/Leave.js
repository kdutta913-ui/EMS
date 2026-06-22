import React, { useState, useEffect } from "react";
import "./TlPages.css";
import { api } from "../../../utils/api";

const LeaveRequests = () => {
  const [pending, setPending]   = useState([]);
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [processing, setProcessing] = useState({});

  const fetchLeaves = async () => {
    try {
      const [pendingData, allData] = await Promise.all([
        api.get("/leaves/pending"),
        api.get("/leaves?status=approved&limit=10"),
      ]);
      setPending(pendingData.leaves || []);
      setHistory(allData.leaves || []);
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
      setPending(prev => prev.filter(r => r._id !== id));
      fetchLeaves();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  };

  const handleReject = async (id) => {
    setProcessing(p => ({ ...p, [id]: true }));
    try {
      await api.put(`/leaves/${id}/reject`, { reason: "Rejected by team lead" });
      setPending(prev => prev.filter(r => r._id !== id));
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(p => ({ ...p, [id]: false }));
    }
  };

  const totalDays = history.reduce((a, l) => a + (l.totalDays || 0), 0);

  return (
    <div className="lr-page">
      <div className="lr-page-header">
        <div>
          <div className="lr-page-title">Leave Requests</div>
          <div className="lr-page-sub">Your team's leave requests</div>
        </div>
      </div>

      {/* Stats */}
      <div className="lr-stats">
        {[
          { label: "Pending Approval", value: pending.length,   meta: "Awaiting your action" },
          { label: "Approved",         value: history.length,   meta: "This month"           },
          { label: "Total Leave Days", value: totalDays,        meta: "Across team this month"},
        ].map((s, i) => (
          <div className="lr-stat" key={i}>
            <div className="lr-stat-label">{s.label}</div>
            <div className="lr-stat-value">{s.value}</div>
            <div className="lr-stat-meta">{s.meta}</div>
          </div>
        ))}
      </div>

      <div className="lr-layout">
        {/* Pending Requests */}
        <div className="lr-card">
          <div className="lr-card-header">
            <span className="lr-card-title">Pending Requests</span>
            <span className="lr-tag pending">{pending.length} pending</span>
          </div>
          {loading ? (
            <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>Loading...</div>
          ) : pending.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No pending leave requests 🎉
            </div>
          ) : (
            pending.map(r => (
              <div className="lr-item" key={r._id}>
                <div className="lr-info">
                  <div className="lr-name">{r.employeeId?.name || "Employee"}</div>
                  <div className="lr-meta">{r.type} · {new Date(r.fromDate).toLocaleDateString("en-IN")} → {new Date(r.toDate).toLocaleDateString("en-IN")} · {r.totalDays} day{r.totalDays > 1 ? "s" : ""}</div>
                  <div className="lr-meta" style={{ marginTop: 2, fontStyle: "italic" }}>"{r.reason}"</div>
                </div>
                <div className="lr-actions">
                  <button className="lr-btn approve" disabled={processing[r._id]} onClick={() => handleApprove(r._id)}>
                    {processing[r._id] ? "..." : "Approve"}
                  </button>
                  <button className="lr-btn reject" disabled={processing[r._id]} onClick={() => handleReject(r._id)}>
                    {processing[r._id] ? "..." : "Reject"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Leave History */}
        <div className="lr-card">
          <div className="lr-card-header">
            <span className="lr-card-title">Recent History</span>
          </div>
          {history.length === 0 ? (
            <div style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>No leave history yet.</div>
          ) : (
            <table className="lr-table">
              <thead>
                <tr><th>Member</th><th>Type</th><th>Days</th><th>Status</th></tr>
              </thead>
              <tbody>
                {history.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <div className="lr-emp-name">{l.employeeId?.name || "—"}</div>
                      <div className="lr-emp-sub">{new Date(l.fromDate).toLocaleDateString("en-IN")}</div>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-secondary)" }}>{l.type}</td>
                    <td style={{ fontWeight: 500 }}>{l.totalDays}</td>
                    <td>
                      <span className={`lr-tag ${l.status}`}>
                        {l.status?.charAt(0).toUpperCase() + l.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequests;
