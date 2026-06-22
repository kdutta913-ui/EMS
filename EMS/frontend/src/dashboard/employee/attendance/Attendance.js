import React, { useState, useEffect, useCallback } from "react";
// import { Download } from "lucide-react";
import "../comb/EmpPages.css";
import { api } from "../../../utils/api";

const statusLabel = { present: "Present", wfh: "WFH", absent: "Absent", "half-day": "Half Day", "on-leave": "On Leave" };

const Attendance = () => {
  const [view, setView]         = useState("log");
  const [todayRecord, setTodayRecord] = useState(null);
  const [log, setLog]           = useState([]);
  const [loading, setLoading]   = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [regForm, setRegForm]   = useState({ date: "", checkIn: "", checkOut: "", reason: "" });
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [error, setError]       = useState("");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const fetchData = useCallback(async () => {
    try {
      const [todayData, logData] = await Promise.all([
        api.get("/attendance/today"),
        api.get(`/attendance/my?month=${month}&year=${year}`),
      ]);
      setTodayRecord(todayData.record);
      setLog(logData.records || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      await api.post("/attendance/checkin", {});
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      await api.post("/attendance/checkout", {});
      fetchData();
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleReg = async () => {
    setError("");
    if (!regForm.date || !regForm.checkIn || !regForm.checkOut || !regForm.reason) {
      setError("All fields are required.");
      return;
    }
    setRegLoading(true);
    try {
      await api.post("/attendance/regularize", regForm);
      setRegForm({ date: "", checkIn: "", checkOut: "", reason: "" });
      await fetchData();
      setRegSuccess(true);
      setTimeout(() => setRegSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setRegLoading(false);
    }
  };

  const presentDays = log.filter(r => r.status === "present" || r.status === "wfh").length;
  const wfhDays     = log.filter(r => r.status === "wfh").length;
  const halfDays    = log.filter(r => r.status === "half-day").length;
  const absentDays  = log.filter(r => r.status === "absent").length;

  return (
    <div className="at-page">
      <div className="at-page-header">
        <div>
          <div className="at-page-title">Attendance</div>
          <div className="at-page-sub">Your attendance log and regularization requests</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {!todayRecord?.checkIn && (
            <button className="shared-btn primary" onClick={handleCheckIn} disabled={checkingIn}>
              {checkingIn ? "..." : "Check In"}
            </button>
          )}
          {todayRecord?.checkIn && !todayRecord?.checkOut && (
            <button className="shared-btn" onClick={handleCheckOut} disabled={checkingOut}>
              {checkingOut ? "..." : "Check Out"}
            </button>
          )}
          {todayRecord?.checkIn && todayRecord?.checkOut && (
            <span style={{ fontSize: 13, color: "var(--success)", fontWeight: 600, alignSelf: "center" }}>
              ✓ Checked out — {todayRecord.checkIn} → {todayRecord.checkOut}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="shared-grid-4">
        {[
          { label: "Present Days",  value: presentDays, color: "var(--success)"  },
          { label: "WFH Days",      value: wfhDays,     color: "var(--accent)"   },
          { label: "Half Days",     value: halfDays,     color: "var(--warning)"  },
          { label: "Absent Days",   value: absentDays,   color: "var(--danger)"   },
        ].map((s, i) => (
          <div className="shared-stat" key={i} style={{ borderLeftColor: s.color }}>
            <div className="shared-stat-label">{s.label}</div>
            <div className="shared-stat-value">{s.value}</div>
            <div className="shared-stat-meta">This month</div>
          </div>
        ))}
      </div>

      {/* Toggle */}
      <div className="shared-toggle">
        {[["log","Attendance Log"], ["regularize","Regularization"]].map(([v, l]) => (
          <button key={v} className={`shared-toggle-btn ${view === v ? "active" : ""}`} onClick={() => setView(v)}>{l}</button>
        ))}
      </div>

      {/* Attendance Log */}
      {view === "log" && (
        <div className="shared-card">
          <div className="shared-card-header">
            <span className="shared-card-title">Attendance Log — {now.toLocaleString("en-IN", { month: "long" })} {year}</span>
          </div>
          {loading ? (
            <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
          ) : log.length === 0 ? (
            <p style={{ padding: "20px", color: "var(--text-muted)", fontSize: 13 }}>No attendance records yet.</p>
          ) : (
            <table className="shared-table">
              <thead>
                <tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr>
              </thead>
              <tbody>
                {log.slice().reverse().map((a, i) => (
                  <tr key={i}>
                    <td><span className="shared-table-name">{new Date(a.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span></td>
                    <td>{a.checkIn || "—"}</td>
                    <td>{a.checkOut || "—"}</td>
                    <td style={{ fontWeight: 600 }}>{a.totalHours ? `${a.totalHours}h` : "—"}</td>
                    <td><span className={`shared-tag ${a.status}`}>{statusLabel[a.status] || a.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Regularization */}
      {view === "regularize" && (
        <div className="shared-card" style={{ maxWidth: 520 }}>
          <div className="shared-card-header">
            <span className="shared-card-title">Regularization Request</span>
          </div>
          <div className="shared-card-body">
            {regSuccess ? (
              <div style={{ textAlign: "center", padding: "32px 0", color: "var(--success)" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 17, fontWeight: 700 }}>Request submitted!</div>
                <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>Your manager will review shortly.</div>
              </div>
            ) : (
              <>
                {error && <div style={{ color: "red", fontSize: 13, marginBottom: 12 }}>{error}</div>}
                <div className="at-form-group">
                  <label className="at-label">Date</label>
                  <input type="date" className="at-input" value={regForm.date} onChange={e => setRegForm({ ...regForm, date: e.target.value })} />
                </div>
                <div className="at-form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div>
                    <label className="at-label">Check In Time</label>
                    <input type="time" className="at-input" value={regForm.checkIn} onChange={e => setRegForm({ ...regForm, checkIn: e.target.value })} />
                  </div>
                  <div>
                    <label className="at-label">Check Out Time</label>
                    <input type="time" className="at-input" value={regForm.checkOut} onChange={e => setRegForm({ ...regForm, checkOut: e.target.value })} />
                  </div>
                </div>
                <div className="at-form-group">
                  <label className="at-label">Reason</label>
                  <textarea className="at-textarea" placeholder="Reason for regularization..."
                    value={regForm.reason} onChange={e => setRegForm({ ...regForm, reason: e.target.value })} />
                </div>
                <button className="shared-btn primary" style={{ width: "100%", justifyContent: "center", padding: "13px" }} onClick={handleReg} disabled={regLoading}>
                  {regLoading ? "Submitting..." : "Submit Request"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
