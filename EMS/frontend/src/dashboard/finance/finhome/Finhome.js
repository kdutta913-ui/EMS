import React, { useState, useEffect } from "react";
import "../Finance.css";
import { Wallet, Receipt, BarChart, AlertCircle } from "lucide-react";
import { api } from "../../../utils/api";

const fmt = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const FinanceDashboardHome = () => {
  const [stats, setStats]       = useState(null);
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading]   = useState(true);

  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [dashData, payrollData] = await Promise.all([
          api.get("/dashboard/finance"),
          api.get("/payroll"),
        ]);
        setStats(dashData.stats);
        setPayrolls(payrollData.payrolls || []);
      } catch (err) {
        console.error("Finance dashboard error:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading dashboard...</div>;

  const currentPayroll = stats?.currentPayroll;
  const pendingPayrolls = stats?.pendingPayrolls ?? 0;
  const totalEmployees  = stats?.totalEmployees ?? 0;

  const totalGross = payrolls.reduce((s, p) => s + (p.grossAmount || 0), 0);
  const totalNet   = payrolls.reduce((s, p) => s + (p.netAmount || 0), 0);

  return (
    <>
      {/* Stats */}
      <div className="fin-stats-grid">
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Total Payroll</span>
            <div className="fin-stat-icon blue"><Wallet size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{currentPayroll ? fmt(currentPayroll.netAmount) : "—"}</div>
          <div className="fin-stat-meta">Net payout · {monthNames[month - 1]} {year}</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Total Employees</span>
            <div className="fin-stat-icon amber"><Receipt size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{totalEmployees}</div>
          <div className="fin-stat-meta">Active employees on payroll</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Total Payrolls Run</span>
            <div className="fin-stat-icon green"><BarChart size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{payrolls.length}</div>
          <div className="fin-stat-meta">Across all months</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Pending Runs</span>
            <div className="fin-stat-icon red"><AlertCircle size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{pendingPayrolls}</div>
          <div className="fin-stat-meta"><span className="danger">Need processing</span></div>
        </div>
      </div>

      {/* Payroll History */}
      <div className="fin-card">
        <div className="fin-card-header">
          <span className="fin-card-title">Payroll History</span>
        </div>
        <div className="fin-card-body" style={{ padding: "0 20px 20px" }}>
          {payrolls.length === 0 ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
              No payroll runs yet. Go to Payroll → Process Salary to generate the first payroll.
            </p>
          ) : (
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Gross</th>
                  <th>Net Payout</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p, i) => (
                  <tr key={p._id || i}>
                    <td>
                      <div className="fin-emp-name">{monthNames[p.month - 1]} {p.year}</div>
                      <div className="fin-emp-dept">{p.processedAt ? new Date(p.processedAt).toLocaleDateString("en-IN") : "—"}</div>
                    </td>
                    <td>{p.department}</td>
                    <td>{p.totalEmployees}</td>
                    <td><span className="fin-amount">{fmt(p.grossAmount)}</span></td>
                    <td><span className="fin-amount">{fmt(p.netAmount)}</span></td>
                    <td>
                      <span className={`fin-tag ${p.status}`}>
                        {p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary totals */}
      {payrolls.length > 0 && (
        <div className="fin-grid-2">
          <div className="fin-card">
            <div className="fin-card-header">
              <span className="fin-card-title">All-Time Gross Payroll</span>
            </div>
            <div className="fin-card-body" style={{ padding: "24px 20px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>{fmt(totalGross)}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>Across {payrolls.length} payroll run{payrolls.length > 1 ? "s" : ""}</div>
            </div>
          </div>
          <div className="fin-card">
            <div className="fin-card-header">
              <span className="fin-card-title">All-Time Net Payroll</span>
            </div>
            <div className="fin-card-body" style={{ padding: "24px 20px" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: "var(--success)" }}>{fmt(totalNet)}</div>
              <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 6 }}>After deductions (PF, TDS, ESI)</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinanceDashboardHome;
