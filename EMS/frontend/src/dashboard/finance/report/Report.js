import React, { useState, useEffect } from "react";
import "../Finance.css";
import { api } from "../../../utils/api";

const fmt = n => n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FinancialReports = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get("/payroll").then(d => setPayrolls(d.payrolls || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading reports...</div>;

  const totalGross = payrolls.reduce((s, p) => s + (p.grossAmount || 0), 0);
  const totalNet   = payrolls.reduce((s, p) => s + (p.netAmount || 0), 0);
  const totalDed   = payrolls.reduce((s, p) => s + (p.totalDeductions || 0), 0);

  return (
    <>
      {payrolls.length > 0 && (
        <div className="fin-stats-grid" style={{ marginBottom: 24 }}>
          <div className="fin-stat-card">
            <div className="fin-stat-header"><span className="fin-stat-label">Total Gross (All Time)</span></div>
            <div className="fin-stat-value" style={{ fontSize: 22 }}>{fmt(totalGross)}</div>
            <div className="fin-stat-meta">Across {payrolls.length} payroll runs</div>
          </div>
          <div className="fin-stat-card">
            <div className="fin-stat-header"><span className="fin-stat-label">Total Net (All Time)</span></div>
            <div className="fin-stat-value" style={{ fontSize: 22 }}>{fmt(totalNet)}</div>
            <div className="fin-stat-meta">After all deductions</div>
          </div>
          <div className="fin-stat-card">
            <div className="fin-stat-header"><span className="fin-stat-label">Total Deductions</span></div>
            <div className="fin-stat-value" style={{ fontSize: 22 }}>{fmt(totalDed)}</div>
            <div className="fin-stat-meta">PF + TDS + ESI</div>
          </div>
        </div>
      )}

      <div className="fin-card">
        <div className="fin-card-header"><span className="fin-card-title">Payroll Reports</span></div>
        <div className="fin-card-body" style={{ padding: "0 20px 20px" }}>
          {payrolls.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📄</div>
              <div style={{ fontWeight: 600 }}>No payroll data yet</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Process your first payroll to generate reports.</div>
            </div>
          ) : (
            <table className="fin-table">
              <thead>
                <tr><th>Period</th><th>Employees</th><th>Gross</th><th>Deductions</th><th>Net</th><th>Status</th></tr>
              </thead>
              <tbody>
                {payrolls.map((p, i) => (
                  <tr key={p._id || i}>
                    <td><div className="fin-emp-name">{monthNames[p.month - 1]} {p.year}</div><div className="fin-emp-dept">{p.department}</div></td>
                    <td>{p.totalEmployees}</td>
                    <td><span className="fin-amount">{fmt(p.grossAmount)}</span></td>
                    <td><span className="fin-amount" style={{ color: "var(--danger)" }}>{fmt(p.totalDeductions)}</span></td>
                    <td><span className="fin-amount">{fmt(p.netAmount)}</span></td>
                    <td><span className={`fin-tag ${p.status}`}>{p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}</span></td>
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

export default FinancialReports;
