import React, { useState, useEffect } from "react";
import { api } from "../../../utils/api";

const statusLabel = { present: "Present", wfh: "WFH", absent: "Absent", "half-day": "Half Day", "on-leave": "On Leave" };

const TlAttendance = () => {
  const [todayRec, setTodayRec] = useState([]);
  const [monthRec, setMonthRec] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("today");

  const now = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [todayData, monthData] = await Promise.all([
          api.get("/attendance/team"),
          api.get(`/attendance/company?month=${month}&year=${year}`),
        ]);
        setTodayRec(todayData.records || []);
        setMonthRec(monthData.records || []);
      } catch (err) { console.error(err.message); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [month, year]);

  const btnStyle = a => ({
    padding: "8px 16px", borderRadius: 6, border: "1px solid var(--border)", cursor: "pointer", fontWeight: 600,
    background: a ? "var(--accent)" : "var(--surface)", color: a ? "#fff" : "var(--text-primary)"
  });

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading attendance...</div>;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button style={btnStyle(view === "today")}   onClick={() => setView("today")}>Today's Log</button>
        <button style={btnStyle(view === "monthly")} onClick={() => setView("monthly")}>Monthly Summary</button>
      </div>

      {view === "today" && (
        <div className="tl-card">
          <div className="tl-card-header"><span className="tl-card-title">Today's Attendance Log</span></div>
          <div className="tl-card-body" style={{ padding: "0 20px" }}>
            {todayRec.length === 0
              ? <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No attendance records for today.</p>
              : (
                <table className="tl-table">
                  <thead><tr><th>Member</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                  <tbody>
                    {todayRec.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <div className="tl-member-name">{r.employeeId?.name || "—"}</div>
                          <div className="tl-member-role">{r.employeeId?.department}</div>
                        </td>
                        <td>{r.checkIn || "—"}</td>
                        <td>{r.checkOut || "—"}</td>
                        <td>{r.totalHours ? `${r.totalHours}h` : "—"}</td>
                        <td><span className={`tl-tag ${r.status}`}>{statusLabel[r.status] || r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </div>
      )}

      {view === "monthly" && (
        <div className="tl-card">
          <div className="tl-card-header"><span className="tl-card-title">Monthly Summary — {now.toLocaleString("en-IN", { month: "long" })} {year}</span></div>
          <div className="tl-card-body" style={{ padding: "0 20px" }}>
            {monthRec.length === 0
              ? <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No records for this month.</p>
              : (
                <table className="tl-table">
                  <thead><tr><th>Date</th><th>Member</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
                  <tbody>
                    {monthRec.map((r, i) => (
                      <tr key={i}>
                        <td>{new Date(r.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
                        <td>{r.employeeId?.name || "—"}</td>
                        <td>{r.checkIn || "—"}</td>
                        <td>{r.checkOut || "—"}</td>
                        <td><span className={`tl-tag ${r.status}`}>{statusLabel[r.status] || r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TlAttendance;
