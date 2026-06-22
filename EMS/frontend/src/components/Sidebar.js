import React from "react";
import "./Sidebar.css";

/**
 * Reusable Sidebar Component
 *
 * Props:
 * ─────────────────────────────────────────────
 * navSections  {Array}   Array of sections, each with:
 *                          - label {string}    Section heading
 *                          - items {Array}     Nav items:
 *                              - id     {string}
 *                              - label  {string}
 *                              - icon   {ReactNode}  SVG/icon element
 *
 * activeNav    {string}  Currently active nav item id
 * onNavChange  {func}    Callback: (id) => void
 *
 * user         {Object}  User info:
 *                          - name     {string}
 *                          - role     {string}
 *                          - initials {string}
 *
 * appName      {string}  App name shown next to logo (default: "EMS Platform")
 * ─────────────────────────────────────────────
 *
 * Usage Example:
 * ─────────────────────────────────────────────
 * const navSections = [
 *   {
 *     label: "Main",
 *     items: [
 *       { id: "dashboard", label: "Dashboard", icon: <DashboardIcon /> },
 *       { id: "companies", label: "Companies",  icon: <BuildingIcon />  },
 *     ]
 *   },
 *   {
 *     label: "Management",
 *     items: [
 *       { id: "settings", label: "Settings", icon: <SettingsIcon /> },
 *     ]
 *   }
 * ];
 *
 * <Sidebar
 *   navSections={navSections}
 *   activeNav={activeNav}
 *   onNavChange={setActiveNav}
 *   user={{ name: "Rajiv Sharma", role: "Super Admin", initials: "RS" }}
 * />
 */

const Sidebar = ({
  navSections = [],
  activeNav,
  onNavChange,
  user = { name: "User", role: "Role", initials: "U" },
  appName = "Daily Brief",
}) => {
  return (
    <aside className="ems-sidebar">

      {/* ── Logo Area ── */}
      <div className="ems-sidebar__logo">
        <div className="ems-sidebar__logo-mark">DB</div>
        <span className="ems-sidebar__logo-text">{appName}</span>
      </div>

      {/* ── Nav Area ── */}
      <nav className="ems-sidebar__nav">
        {navSections.map((section, sIdx) => (
          <div key={sIdx}>
            {/* Section Label */}
            <span className="ems-sidebar__section-label">
              {section.label}
            </span>

            {/* Nav Items */}
            {section.items.map((item) => (
              <button
                key={item.id}
                className={`ems-sidebar__nav-item ${
                  activeNav === item.id ? "is-active" : ""
                }`}
                onClick={() => onNavChange && onNavChange(item.id)}
                title={item.label}
              >
                <span className="ems-sidebar__nav-icon">
                  {item.icon}
                </span>
                <span className="ems-sidebar__nav-label">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* ── User Card ── */}
      <div className="ems-sidebar__footer">
        <div className="ems-sidebar__user-card">
          <div className="ems-sidebar__user-avatar">
            {user.initials}
          </div>
          <div className="ems-sidebar__user-info">
            <div className="ems-sidebar__user-name">{user.name}</div>
            <div className="ems-sidebar__user-role">{user.role}</div>
          </div>
        </div>
      </div>

    </aside>
  );
};

export default Sidebar;