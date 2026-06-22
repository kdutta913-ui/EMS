import React, { useState, useEffect, useCallback } from "react";
import "../CAdmin.css";
import { Users, UserCheck, UserX, Filter } from "lucide-react";
import { api } from "../../../utils/api";

const DEPARTMENTS = ["All Departments", "Engineering", "Design", "HR", "Finance", "Marketing", "Operations", "Sales"];

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (department && department !== "All Departments") params.set("department", department);
      if (status && status !== "All Status") params.set("status", status.toLowerCase());
      params.set("limit", "20");

      const data = await api.get(`/employees?${params.toString()}`);
      setEmployees(data.employees || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, department, status]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleStatusChange = async (empId, newStatus) => {
    try {
      await api.put(`/employees/${empId}/status`, { status: newStatus });
      fetchEmployees();
    } catch (err) {
      alert(err.message);
    }
  };

  const activeCount = employees.filter(e => e.status === "active").length;
  const pendingCount = employees.filter(e => e.status === "pending").length;
  const inactiveCount = employees.filter(e => e.status === "inactive").length;

  return (
    <>
      {/* Summary Cards */}
      <div className="ca-stats-grid">
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Total Employees</span>
            <div className="ca-stat-icon blue"><Users size={17} /></div>
          </div>
          <div className="ca-stat-value">{total}</div>
          <div className="ca-stat-meta">Across all departments</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Active</span>
            <div className="ca-stat-icon green"><UserCheck size={17} /></div>
          </div>
          <div className="ca-stat-value">{activeCount}</div>
          <div className="ca-stat-meta">Currently working</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Pending</span>
            <div className="ca-stat-icon amber"><Filter size={17} /></div>
          </div>
          <div className="ca-stat-value">{pendingCount}</div>
          <div className="ca-stat-meta">Awaiting onboarding</div>
        </div>
        <div className="ca-stat-card">
          <div className="ca-stat-header">
            <span className="ca-stat-label">Inactive</span>
            <div className="ca-stat-icon red"><UserX size={17} /></div>
          </div>
          <div className="ca-stat-value">{inactiveCount}</div>
          <div className="ca-stat-meta">Deactivated records</div>
        </div>
      </div>

      {/* Filters */}
      <div className="ca-card" style={{ marginBottom: "28px" }}>
        <div className="ca-card-header">
          <span className="ca-card-title">Employee Directory</span>
        </div>
        <div className="ca-card-body">
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px" }}>
            <input
              type="text"
              placeholder="Search by name, ID, or email"
              className="ca-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="ca-input" value={department} onChange={e => setDepartment(e.target.value)}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <select className="ca-input" value={status} onChange={e => setStatus(e.target.value)}>
              <option>All Status</option>
              <option>Active</option>
              <option>Pending</option>
              <option>Inactive</option>
              <option>Probation</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="ca-card">
        <div className="ca-card-header">
          <span className="ca-card-title">Employees</span>
        </div>
        <div className="ca-card-body" style={{ padding: "0 20px 20px" }}>
          {loading ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>Loading employees...</p>
          ) : employees.length === 0 ? (
            <p style={{ padding: "20px 0", color: "var(--text-muted)", fontSize: 13 }}>No employees found.</p>
          ) : (
            <table className="ca-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Email</th>
                  <th>Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div className="ca-emp-name">{emp.name}</div>
                      <div className="ca-emp-id">{emp.employeeCode}</div>
                    </td>
                    <td><span className="ca-emp-dept">{emp.department}</span></td>
                    <td>{emp.role || emp.designation || "—"}</td>
                    <td>{emp.email}</td>
                    <td>{emp.salary ? `₹${(emp.salary / 100000).toFixed(1)}L` : "—"}</td>
                    <td>
                      <span className={`ca-tag ${emp.status}`}>
                        {emp.status?.charAt(0).toUpperCase() + emp.status?.slice(1)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {emp.status === "active" ? (
                          <button className="ca-card-action" onClick={() => handleStatusChange(emp._id, "inactive")}>Deactivate</button>
                        ) : (
                          <button className="ca-card-action" onClick={() => handleStatusChange(emp._id, "active")}>Activate</button>
                        )}
                      </div>
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

export default Employees;
