import React, { useState, useEffect } from "react";
import "../Hrdash.css";
import { api } from "../../../utils/api";

const LeaveAttendance = () => {
  const [leaves,          setLeaves]          = useState([]);
  const [attendance,      setAttendance]      = useState([]);
  const [regularizations, setRegularizations] = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [processing,      setProcessing]      = useState({});
  const [view,            setView]            = useState("leaves");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [leaveData, attData, regData] = await Promise.all([
          api.get("/leaves/pending"),
          api.get(`/attendance/company?month=${month}&year=${year}`),
          api.get("/attendance/regularizations"),
        ]);
        setLeaves(leaveData.leaves || []);
        setAttendance(attData.records || []);
        setRegularizations(regData.records || []);
      } catch (err) { console.error(err.message); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [month, year]);

  const act = (setter, fn) => async (id) => {
    setter(p => ({ ...p, [id]: true }));
    try { await fn(id); } catch (err) { alert(err.message); }
    finally { setter(p => ({ ...p, [id]: false })); }
  };

  const approveLeave = act(setProcessing, async id => {
    await api.put(`/leaves/${id}/approve`);
    setLeaves(p => p.filter(l => l._id !== id));
  });

  const rejectLeave = act(setProcessing, async id => {
    await api.put(`/leaves/${id}/reject`, { reason: "Rejected by HR" });
    setLeaves(p => p.filter(l => l._id !== id));
  });

  const approveReg = act(setProcessing, async id => {
    await api.put(`/attendance/${id}/regularize/approve`);
    setRegularizations(p => p.filter(r => r._id !== id));
  });

  const rejectReg = act(setProcessing, async id => {
    await api.put(`/attendance/${id}/regularize/reject`);
    setRegularizations(p => p.filter(r => r._id !== id));
  });

  const deptSummary = attendance.reduce((acc, r) => {
    const dept = r.employeeId?.department || "Unknown";
    if (!acc[dept]) acc[dept] = { present: 0, wfh: 0, total: 0 };
    acc[dept].total++;
    if (r.status === "present") acc[dept].present++;
    if (r.status === "wfh")     acc[dept].wfh++;
    return acc;
  }, {});

  const btnStyle = (active) => ({
    padding: "8px 16px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600,
    background: active ? "var(--accent)" : "var(--surface)", color: active ? "#fff" : "var(--text-primary)"
  });

  return (
    <>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["leaves","Leave Requests"], ["attendance","Attendance Summary"], ["regularize","Regularizations"]].map(([v, l]) => (
          <button key={v} style={btnStyle(view === v)} onClick={() => setView(v)}>{l}</button>
        ))}
      </div>

      {loading ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading...</div> : (
        <>
          {view === "leaves" && (
            <div className="hr-card">
              <div className="hr-card-header"><span className="hr-card-title">Pending Leave Requests ({leaves.length})</span></div>
              <div className="hr-card-body">
                {leaves.length === 0
                  ? <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>No pending leave requests.</p>
                  : leaves.map(l => (
                    <div className="hr-leave-item" key={l._id}>
                      <div className="hr-leave-info">
                        <div className="hr-leave-name">{l.employeeId?.name || "Employee"}</div>
                        <div className="hr-leave-meta">
                          {l.employeeId?.employeeCode} · {l.type} · {new Date(l.fromDate).toLocaleDateString("en-IN")} → {new Date(l.toDate).toLocaleDateString("en-IN")} · {l.totalDays} day{l.totalDays > 1 ? "s" : ""}
                        </div>
                        <div className="hr-leave-meta" style={{ fontStyle: "italic" }}>"{l.reason}"</div>
                      </div>
                      <div className="hr-leave-actions">
                        <button className="hr-btn-approve" disabled={processing[l._id]} onClick={() => approveLeave(l._id)}>{processing[l._id] ? "..." : "Approve"}</button>
                        <button className="hr-btn-reject"  disabled={processing[l._id]} onClick={() => rejectLeave(l._id)}>{processing[l._id] ? "..." : "Reject"}</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {view === "attendance" && (
            <div className="hr-card">
              <div className="hr-card-header"><span className="hr-card-title">Attendance Summary — {now.toLocaleString("en-IN", { month: "long" })} {year}</span></div>
              <div className="hr-card-body" style={{ padding: "0 20px 20px" }}>
                {Object.keys(deptSummary).length === 0
                  ? <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No attendance records for this month.</p>
                  : (
                    <table className="hr-table">
                      <thead><tr><th>Department</th><th>Present</th><th>WFH</th><th>Records</th></tr></thead>
                      <tbody>
                        {Object.entries(deptSummary).map(([dept, d]) => (
                          <tr key={dept}><td>{dept}</td><td>{d.present}</td><td>{d.wfh}</td><td>{d.total}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            </div>
          )}

          {view === "regularize" && (
            <div className="hr-card">
              <div className="hr-card-header"><span className="hr-card-title">Regularization Requests ({regularizations.length})</span></div>
              <div className="hr-card-body">
                {regularizations.length === 0
                  ? <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>No pending regularization requests.</p>
                  : regularizations.map(r => (
                    <div className="hr-leave-item" key={r._id}>
                      <div className="hr-leave-info">
                        <div className="hr-leave-name">{r.employeeId?.name || "Employee"}</div>
                        <div className="hr-leave-meta">
                          {new Date(r.date).toLocaleDateString("en-IN")} · In: {r.checkIn || "—"} → Out: {r.checkOut || "—"}
                        </div>
                        <div className="hr-leave-meta" style={{ fontStyle: "italic" }}>"{r.regularizationReason}"</div>
                      </div>
                      <div className="hr-leave-actions">
                        <button className="hr-btn-approve" disabled={!!processing[r._id]} onClick={() => approveReg(r._id)}>{processing[r._id] ? "..." : "Approve"}</button>
                        <button className="hr-btn-reject"  disabled={!!processing[r._id]} onClick={() => rejectReg(r._id)}>{processing[r._id] ? "..." : "Reject"}</button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default LeaveAttendance;
