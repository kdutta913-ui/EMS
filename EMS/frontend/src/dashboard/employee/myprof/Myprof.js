import React, { useState, useEffect } from "react";
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Building, FileText, Download, Shield, CreditCard } from "lucide-react";
import "./Myprof.css";
import { api } from "../../../utils/api";

const InfoRow = ({ icon, label, children }) => (
  <div className="mp-info-row">
    <span className="mp-info-label">{icon} {label}</span>
    <span className="mp-info-value">{children}</span>
  </div>
);

const MyProfile = () => {
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/employees/profile/me")
      .then(data => setEmp(data.employee))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading profile...</div>;
  if (error)   return <div style={{ padding: 40, textAlign: "center", color: "red" }}>{error}</div>;
  if (!emp)    return <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Profile not found.</div>;

  const initials = emp.name?.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "??";
  const joined = emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—";

  return (
    <div className="mp-page">
      {/* Header */}
      <div className="mp-page-header">
        <div>
          <div className="mp-page-title">My Profile</div>
          <div className="mp-page-sub">View and manage your personal information</div>
        </div>
      </div>

      {/* Hero */}
      <div className="mp-hero">
        <div className="mp-avatar-lg">{initials}</div>
        <div>
          <div className="mp-hero-name">{emp.name}</div>
          <div className="mp-hero-role">{emp.designation || emp.role || "—"}</div>
          <div className="mp-hero-dept">{emp.department}</div>
          <div className="mp-hero-badges">
            <span className="mp-hero-badge"><Shield size={12} /> {emp.employeeCode}</span>
            <span className="mp-hero-badge"><Briefcase size={12} /> {emp.employmentType}</span>
            <span className="mp-hero-badge"><Calendar size={12} /> Joined {joined}</span>
          </div>
        </div>
      </div>

      {/* Personal + Job Info */}
      <div className="mp-grid-2">
        <div className="mp-card">
          <div className="mp-card-header">
            <span className="mp-card-title">Personal Information</span>
          </div>
          <div className="mp-card-body">
            <InfoRow icon={<User size={14} />}    label="Full Name">{emp.name}</InfoRow>
            <InfoRow icon={<Mail size={14} />}    label="Email">{emp.email}</InfoRow>
            <InfoRow icon={<Phone size={14} />}   label="Phone">{emp.phone || "—"}</InfoRow>
            <InfoRow icon={<MapPin size={14} />}  label="Location">{emp.location || "—"}</InfoRow>
            <InfoRow icon={<Calendar size={14} />}label="Date of Birth">{emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString("en-IN") : "—"}</InfoRow>
          </div>
        </div>

        <div className="mp-card">
          <div className="mp-card-header">
            <span className="mp-card-title">Job Details</span>
          </div>
          <div className="mp-card-body">
            <InfoRow icon={<Shield size={14} />}    label="Employee ID">{emp.employeeCode}</InfoRow>
            <InfoRow icon={<Briefcase size={14} />} label="Designation">{emp.designation || emp.role || "—"}</InfoRow>
            <InfoRow icon={<Building size={14} />}  label="Department">{emp.department}</InfoRow>
            <InfoRow icon={<Calendar size={14} />}  label="Date of Join">{emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString("en-IN") : "—"}</InfoRow>
            <InfoRow icon={<User size={14} />}      label="Reports To">{emp.reportingTo?.name || "—"}</InfoRow>
            <InfoRow icon={<Briefcase size={14} />} label="Employment"><span className="mp-tag fulltime">{emp.employmentType}</span></InfoRow>
            <InfoRow icon={<Shield size={14} />}    label="Status"><span className="mp-tag active">{emp.status}</span></InfoRow>
          </div>
        </div>
      </div>

      {/* Emergency + Bank */}
      <div className="mp-grid-2">
        <div className="mp-card">
          <div className="mp-card-header">
            <span className="mp-card-title">Emergency Contact</span>
          </div>
          <div className="mp-card-body">
            <InfoRow icon={<User size={14} />}  label="Name">{emp.emergencyContact?.name || "—"}</InfoRow>
            <InfoRow icon={<User size={14} />}  label="Relationship">{emp.emergencyContact?.relationship || "—"}</InfoRow>
            <InfoRow icon={<Phone size={14} />} label="Phone">{emp.emergencyContact?.phone || "—"}</InfoRow>
          </div>
        </div>

        <div className="mp-card">
          <div className="mp-card-header">
            <span className="mp-card-title">Bank Details</span>
          </div>
          <div className="mp-card-body">
            <InfoRow icon={<User size={14} />}       label="Account Name">{emp.bankDetails?.accountName || "—"}</InfoRow>
            <InfoRow icon={<Building size={14} />}   label="Bank">{emp.bankDetails?.bankName || "—"}</InfoRow>
            <InfoRow icon={<CreditCard size={14} />} label="Account No.">{emp.bankDetails?.accountNumber ? `XXXX ${emp.bankDetails.accountNumber.slice(-4)}` : "—"}</InfoRow>
            <InfoRow icon={<Shield size={14} />}     label="IFSC Code">{emp.bankDetails?.ifscCode || "—"}</InfoRow>
          </div>
        </div>
      </div>

      {/* Documents */}
      {emp.documents?.length > 0 && (
        <div className="mp-card">
          <div className="mp-card-header">
            <span className="mp-card-title">My Documents</span>
          </div>
          <div className="mp-card-body">
            {emp.documents.map((d, i) => (
              <div className="mp-doc-item" key={i}>
                <div className="mp-doc-icon"><FileText size={18} /></div>
                <div className="mp-doc-info">
                  <div className="mp-doc-name">{d.name}</div>
                  <div className="mp-doc-meta">Uploaded</div>
                </div>
                {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="mp-doc-btn"><Download size={13} /> Download</a>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
