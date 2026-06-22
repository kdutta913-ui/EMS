import React, { useState, useEffect } from "react";
import "../Finance.css";
import "./Payroll.css";
import { Wallet, Banknote, Calendar, AlertCircle, X, CheckCircle, Loader } from "lucide-react";
import { api } from "../../../utils/api";

const fmt = (n) => (n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0");
const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fullMonthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { success, payroll, message }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const fetchPayrolls = async () => {
    try {
      const data = await api.get("/payroll");
      setPayrolls(data.payrolls || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayrolls(); }, []);

  const openModal = () => {
    setResult(null);
    setShowModal(true);
  };

  const closeModal = () => {
    if (processing) return;
    setShowModal(false);
    setResult(null);
  };

  const handleProcess = async () => {
    setProcessing(true);
    setResult(null);
    try {
      const data = await api.post("/payroll/process", { month, year });
      setResult({ success: true, payroll: data.payroll });
      fetchPayrolls();
    } catch (err) {
      setResult({ success: false, message: err.message || "Failed to process payroll." });
    } finally {
      setProcessing(false);
    }
  };

  const currentPayroll = payrolls.find(
    (p) => p.month === month && p.year === year && p.department === "All"
  );
  const pending = payrolls.filter((p) => p.status === "pending").length;
  const alreadyProcessed =
    currentPayroll && (currentPayroll.status === "paid" || currentPayroll.status === "processing");

  return (
    <>
      {/* Summary Cards */}
      <div className="fin-stats-grid">
        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Net Payroll (Current)</span>
            <div className="fin-stat-icon blue"><Wallet size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{currentPayroll ? fmt(currentPayroll.netAmount) : "—"}</div>
          <div className="fin-stat-meta">{monthNames[month - 1]} {year} payout</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Total Employees</span>
            <div className="fin-stat-icon green"><Banknote size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{currentPayroll?.totalEmployees ?? "—"}</div>
          <div className="fin-stat-meta">Included in payroll</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Next Salary Date</span>
            <div className="fin-stat-icon amber"><Calendar size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">Last day</div>
          <div className="fin-stat-meta">Scheduled processing</div>
        </div>

        <div className="fin-stat-card">
          <div className="fin-stat-header">
            <span className="fin-stat-label">Pending Runs</span>
            <div className="fin-stat-icon red"><AlertCircle size={17} strokeWidth={1.8} /></div>
          </div>
          <div className="fin-stat-value">{pending}</div>
          <div className="fin-stat-meta"><span className="danger">Need processing</span></div>
        </div>
      </div>

      {/* Payroll History Table */}
      <div className="fin-card">
        <div className="fin-card-header">
          <span className="fin-card-title">Payroll Runs</span>
          <button className="fin-card-action" onClick={openModal}>
            Process Salary
          </button>
        </div>

        <div className="fin-card-body" style={{ padding: "0 20px 20px" }}>
          {loading ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
          ) : payrolls.length === 0 ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>
              No payroll runs yet. Click "Process Salary" to generate the first payroll.
            </p>
          ) : (
            <table className="fin-table">
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Gross</th>
                  <th>Net</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payrolls.map((p, i) => (
                  <tr key={p._id || i}>
                    <td>
                      <div className="fin-emp-name">{monthNames[p.month - 1]} {p.year}</div>
                      <div className="fin-emp-dept">
                        {p.processedAt ? new Date(p.processedAt).toLocaleDateString("en-IN") : "—"}
                      </div>
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

      {/* Process Salary Modal */}
      {showModal && (
        <div className="pr-overlay" onClick={closeModal}>
          <div className="pr-modal" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="pr-modal-header">
              <div>
                <h2 className="pr-modal-title">Process Salary</h2>
                <p className="pr-modal-sub">Generate payroll for all active employees</p>
              </div>
              {!processing && (
                <button className="pr-close" onClick={closeModal}>
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Body */}
            <div className="pr-modal-body">
              {!result ? (
                <>
                  <div className="pr-info-row">
                    <div className="pr-info-item">
                      <span className="pr-info-label">Payroll Period</span>
                      <span className="pr-info-value">{fullMonthNames[month - 1]} {year}</span>
                    </div>
                    <div className="pr-info-item">
                      <span className="pr-info-label">Department</span>
                      <span className="pr-info-value">All Departments</span>
                    </div>
                  </div>

                  {alreadyProcessed && (
                    <div className="pr-warning">
                      <AlertCircle size={16} />
                      <span>Payroll for {fullMonthNames[month - 1]} {year} has already been processed. Running again will update existing records.</span>
                    </div>
                  )}

                  <div className="pr-note">
                    <p>This will calculate and generate payslips for all active employees based on their annual salary, attendance records, and standard deductions (PF 12%, Professional Tax ₹200, TDS 10%).</p>
                  </div>
                </>
              ) : result.success ? (
                <div className="pr-result success">
                  <div className="pr-result-icon">
                    <CheckCircle size={40} color="#10b981" />
                  </div>
                  <h3 className="pr-result-title">Payroll Processed Successfully</h3>
                  <p className="pr-result-sub">{fullMonthNames[month - 1]} {year}</p>
                  <div className="pr-result-stats">
                    <div className="pr-result-stat">
                      <span className="pr-result-stat-label">Employees</span>
                      <span className="pr-result-stat-value">{result.payroll?.totalEmployees ?? 0}</span>
                    </div>
                    <div className="pr-result-stat">
                      <span className="pr-result-stat-label">Gross Amount</span>
                      <span className="pr-result-stat-value">{fmt(result.payroll?.grossAmount)}</span>
                    </div>
                    <div className="pr-result-stat">
                      <span className="pr-result-stat-label">Net Amount</span>
                      <span className="pr-result-stat-value highlight">{fmt(result.payroll?.netAmount)}</span>
                    </div>
                    <div className="pr-result-stat">
                      <span className="pr-result-stat-label">Total Deductions</span>
                      <span className="pr-result-stat-value red">{fmt(result.payroll?.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pr-result error">
                  <div className="pr-result-icon">
                    <AlertCircle size={40} color="#ef4444" />
                  </div>
                  <h3 className="pr-result-title">Processing Failed</h3>
                  <p className="pr-result-msg">{result.message}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pr-modal-footer">
              {!result ? (
                <>
                  <button className="pr-btn-cancel" onClick={closeModal} disabled={processing}>
                    Cancel
                  </button>
                  <button className="pr-btn-process" onClick={handleProcess} disabled={processing}>
                    {processing ? (
                      <>
                        <Loader size={15} className="pr-spinner" />
                        Processing...
                      </>
                    ) : (
                      "Confirm & Process"
                    )}
                  </button>
                </>
              ) : (
                <button className="pr-btn-process" onClick={closeModal}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Payroll;
