import React, { useState, useEffect } from "react";
import "./Emp.css";
import { UserPlus, Building2, Mail, Briefcase } from "lucide-react";
import { api } from "../../../utils/api";

const DEPARTMENTS = ["TeamLead", "HR", "Finance", "Employee"];

const RegisterEmployee = () => {
  const [form, setForm] = useState({
    name: "", email: "", phone: "", department: "TeamLead",
    role: "", designation: "", salary: "", employmentType: "Full-Time", status: "active",
    reportingTo: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [recentList, setRecentList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [teamLeads, setTeamLeads] = useState([]);

  const fetchRecent = async () => {
    try {
      const data = await api.get("/employees?limit=5");
      setRecentList(data.employees || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchRecent();
    api.get("/employees?department=TeamLead&limit=50")
      .then(data => setTeamLeads(data.employees || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.id]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name || !form.email || !form.department) {
      setError("Name, email, and department are required.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/employees", {
        ...form,
        salary: form.salary ? Number(form.salary) : 0,
      });
      setSuccess(true);
      setForm({ name: "", email: "", phone: "", department: "TeamLead", role: "", designation: "", salary: "", employmentType: "Full-Time", status: "active", reportingTo: "" });
      fetchRecent();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to register employee.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Summary Cards */}
      <div className="ca-stats-grid">
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Registered This Month</span>
            <div className="ca-stat-icon blue"><UserPlus size={17} /></div>
          </div>
          <div className="ca-stat-value">{recentList.length}</div>
          <div className="ca-stat-meta">Recent employees</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Departments</span>
            <div className="ca-stat-icon green"><Building2 size={17} /></div>
          </div>
          <div className="ca-stat-value">{DEPARTMENTS.length}</div>
          <div className="ca-stat-meta">Active departments</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Default Password</span>
            <div className="ca-stat-icon amber"><Mail size={17} /></div>
          </div>
          <div className="ca-stat-value" style={{ fontSize: 16 }}>Welcome@123</div>
          <div className="ca-stat-meta">Employee must change on first login</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Employment Types</span>
            <div className="ca-stat-icon blue"><Briefcase size={17} /></div>
          </div>
          <div className="ca-stat-value">4</div>
          <div className="ca-stat-meta">Full-Time, Part-Time, Contract, Intern</div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="ca-card" style={{ marginBottom: "28px" }}>
        <div className="ca-card-header">
          <span className="ca-card-title">Register New Employee</span>
        </div>
        <div className="ca-card-body">
          {error && <div style={{ color: "red", marginBottom: 14, fontSize: 13 }}>{error}</div>}
          {success && <div style={{ color: "green", marginBottom: 14, fontSize: 13, fontWeight: 600 }}>Employee registered successfully! Default password: Welcome@123</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              <div>
                <label className="ca-emp-id">Full Name *</label>
                <input id="name" type="text" placeholder="Enter employee name" className="ca-input" value={form.name} onChange={handleChange} required />
              </div>
              <div>
                <label className="ca-emp-id">Email Address *</label>
                <input id="email" type="email" placeholder="employee@company.com" className="ca-input" value={form.email} onChange={handleChange} required />
              </div>
              <div>
                <label className="ca-emp-id">Phone Number</label>
                <input id="phone" type="text" placeholder="10-digit phone number" className="ca-input" value={form.phone} onChange={handleChange} maxLength={10} />
              </div>
              <div>
                <label className="ca-emp-id">Department *</label>
                <select id="department" className="ca-input" value={form.department} onChange={handleChange}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="ca-emp-id">Role / Job Title</label>
                <input id="role" type="text" placeholder="e.g. Frontend Developer" className="ca-input" value={form.role} onChange={handleChange} />
              </div>
              <div>
                <label className="ca-emp-id">Annual Salary (₹)</label>
                <input id="salary" type="number" placeholder="e.g. 900000" className="ca-input" value={form.salary} onChange={handleChange} />
              </div>
              <div>
                <label className="ca-emp-id">Employment Type</label>
                <select id="employmentType" className="ca-input" value={form.employmentType} onChange={handleChange}>
                  <option>Full-Time</option>
                  <option>Part-Time</option>
                  <option>Contract</option>
                  <option>Intern</option>
                </select>
              </div>
              <div>
                <label className="ca-emp-id">Employment Status</label>
                <select id="status" className="ca-input" value={form.status} onChange={handleChange}>
                  <option value="active">Active</option>
                  <option value="probation">Probation</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div>
                <label className="ca-emp-id">Reporting To (Team Lead)</label>
                <select id="reportingTo" className="ca-input" value={form.reportingTo} onChange={handleChange}>
                  <option value="">— No Reporting Manager —</option>
                  {teamLeads.map(tl => (
                    <option key={tl._id} value={tl._id}>{tl.name} ({tl.employeeCode})</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button type="submit" className="ca-btn-approve" disabled={submitting}>
                {submitting ? "Registering..." : "Register Employee"}
              </button>
              <button type="button" className="ca-btn-reject" onClick={() => setForm({ name: "", email: "", phone: "", department: "TeamLead", role: "", designation: "", salary: "", employmentType: "Full-Time", status: "active", reportingTo: "" })}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="ca-card">
        <div className="ca-card-header">
          <span className="ca-card-title">Recent Registrations</span>
        </div>
        <div className="ca-card-body" style={{ padding: "0 20px 20px" }}>
          {loadingList ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading...</p>
          ) : recentList.length === 0 ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No employees registered yet.</p>
          ) : (
            <table className="ca-table">
              <thead>
                <tr><th>Employee</th><th>Role</th><th>Email</th><th>Salary</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentList.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div className="ca-emp-name">{emp.name}</div>
                      <div className="ca-emp-id">{emp.employeeCode} · {emp.department}</div>
                    </td>
                    <td>{emp.role || emp.designation || "—"}</td>
                    <td>{emp.email}</td>
                    <td>{emp.salary ? `₹${(emp.salary / 100000).toFixed(1)}L` : "—"}</td>
                    <td>
                      <span className={`ca-tag ${emp.status}`}>
                        {emp.status?.charAt(0).toUpperCase() + emp.status?.slice(1)}
                      </span>
                    </td>
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

export default RegisterEmployee;
