import React, { useState, useEffect, useRef, useCallback } from "react";
import "./Topbar.css";
import { Link } from "react-router-dom";
import { Bell, LogOut, MessageSquare, AtSign, X } from "lucide-react";
import { chatApi, getSession } from "../utils/api";

const DISMISSED_KEY = "topbar_notif_dismissed_at";

const getTodayString = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const Topbar = ({
  pageTitle    = "Daily Brief",
  pageSubtitle,
  user         = { initials: "U" },
  onNotifClick,
  onAvatarClick,
  onLogout,
  extra,
}) => {
  const subtitle = pageSubtitle || getTodayString();

  const [notifOpen,   setNotifOpen]   = useState(false);
  const [allNotifs,   setAllNotifs]   = useState([]);
  const [dismissedAt, setDismissedAt] = useState(
    () => localStorage.getItem(DISMISSED_KEY) || new Date(0).toISOString()
  );

  const dropdownRef = useRef(null);
  const { token } = getSession();

  const fetchNotifs = useCallback(async () => {
    if (!token) return;
    try {
      const data = await chatApi.getNotifications();
      setAllNotifs(data.notifications || []);
    } catch {}
  }, [token]);

  // Initial fetch + poll every 30 s
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = allNotifs.filter(
    (n) => new Date(n.createdAt) > new Date(dismissedAt)
  ).length;

  const handleBellClick = () => {
    setNotifOpen((prev) => !prev);
    if (onNotifClick) onNotifClick();
  };

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem(DISMISSED_KEY, now);
    setDismissedAt(now);
  };

  return (
    <header className="ems-topbar">

      {/* ── Left: Title ── */}
      <div className="ems-topbar__left">
        <span className="ems-topbar__title">{pageTitle}</span>
        <span className="ems-topbar__subtitle">{subtitle}</span>
      </div>

      {/* ── Right: Extra + Actions ── */}
      <div className="ems-topbar__right">

        {extra && (
          <>
            <div className="ems-topbar__extra">{extra}</div>
            <div className="ems-topbar__divider" />
          </>
        )}

        {/* Notification Bell + Dropdown */}
        <div ref={dropdownRef} className="ems-topbar__notif-wrap">
          <button
            className={`ems-topbar__icon-btn ${notifOpen ? "active" : ""}`}
            onClick={handleBellClick}
            title="Notifications"
          >
            <Bell size={17} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="ems-topbar__badge">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="ems-topbar__notif-dropdown">
              <div className="ems-topbar__notif-header">
                <span className="ems-topbar__notif-title">Notifications</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {unreadCount > 0 && (
                    <button
                      className="ems-topbar__notif-mark-all"
                      onClick={markAllRead}
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    className="ems-topbar__notif-close"
                    onClick={() => setNotifOpen(false)}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {allNotifs.length === 0 ? (
                <div className="ems-topbar__notif-empty">
                  <span className="ems-topbar__notif-empty-icon">🔔</span>
                  <span>You're all caught up!</span>
                  <span className="ems-topbar__notif-empty-sub">
                    No new messages in the last 24 hours.
                  </span>
                </div>
              ) : (
                <div className="ems-topbar__notif-list">
                  {allNotifs.map((n, i) => {
                    const isUnread = new Date(n.createdAt) > new Date(dismissedAt);
                    return (
                      <div
                        key={n.id || i}
                        className={`ems-topbar__notif-item ${isUnread ? "unread" : ""}`}
                      >
                        <div className={`ems-topbar__notif-icon-wrap ${n.type}`}>
                          {n.type === "dm"
                            ? <AtSign size={14} />
                            : <MessageSquare size={14} />}
                        </div>
                        <div className="ems-topbar__notif-body">
                          <div className="ems-topbar__notif-source">{n.source}</div>
                          <div className="ems-topbar__notif-text">{n.text}</div>
                          <div className="ems-topbar__notif-time">{n.time}</div>
                        </div>
                        {isUnread && <div className="ems-topbar__notif-dot" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar */}
        <div
          className="ems-topbar__avatar"
          onClick={onAvatarClick}
          title="Profile"
        >
          {user.initials}
        </div>

        {/* Logout */}
        <button className="ems-topbar__logout" onClick={onLogout}>
          <LogOut size={15} strokeWidth={1.8} />
          <Link to="/login">Logout</Link>
        </button>

      </div>
    </header>
  );
};

export default Topbar;
