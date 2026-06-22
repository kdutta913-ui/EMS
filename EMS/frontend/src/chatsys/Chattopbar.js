import React, { useState, useRef, useEffect } from "react";
import Tooltip from "@mui/material/Tooltip";
import {
  Hash, Users, Bell, Pin, Search, X,
  MoreHorizontal, VolumeX, Volume2, ChevronUp, ChevronDown,
  Mail, Phone, Calendar, MessageSquare,
  AtSign, FileText, UserPlus, Download, File, Trash2,
} from "lucide-react";
import "./Chattopbar.css";

const statusLabel = { online: "Online", away: "Away", offline: "Offline" };

const NotifIcon = ({ type }) => {
  const map = {
    mention: <AtSign size={15} />,
    message: <MessageSquare size={15} />,
    pin:     <Pin size={15} />,
    member:  <UserPlus size={15} />,
  };
  return <div className={`ct-notif-icon-wrap ${type}`}>{map[type] || <Bell size={15} />}</div>;
};

const MemberRow = ({ member }) => (
  <div className="ct-member-item">
    <div className="ct-member-avatar-wrap">
      <div className="ct-member-avatar" style={{ background: member.color }}>
        {member.initials}
      </div>
      <span className={`ct-member-status-dot ${member.status || "offline"}`} />
    </div>
    <div className="ct-member-info">
      <div className="ct-member-name">{member.name}</div>
      <div className="ct-member-role">{member.role}</div>
    </div>
    <span className={`ct-member-status-text ${member.status || "offline"}`}>
      {statusLabel[member.status] || "Offline"}
    </span>
  </div>
);

const ArrowUp   = () => <ChevronUp  size={12} />;
const ArrowDown = () => <ChevronDown size={12} />;

const triggerDownload = (url, name) => {
  const a = document.createElement("a");
  a.href = url;
  a.download = name || "download";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

/* ── Main Component ── */
const ChatTopbar = ({
  activeChat      = "general",
  activePanel     = null,
  onPanelChange   = () => {},
  allMeta         = {},
  members         = [],
  notifications   = [],
  onMoreAction    = () => {},
  pinnedMessages  = [],
  pinnedLoading   = false,
  sharedFiles     = [],
  filesLoading    = false,
}) => {
  const defaultMeta = { type: "channel", name: activeChat, desc: "", memberCount: 0, readOnly: false, muted: false };
  const meta = allMeta[activeChat] || defaultMeta;

  const [showMore,       setShowMore]       = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery,    setSearchQuery]    = useState("");
  const [memberSearch,   setMemberSearch]   = useState("");
  const searchRef = useRef(null);

  const unreadNotifCount = notifications.filter(n => n.unread).length;

  const togglePanel = (panel) => {
    onPanelChange(panel);
    setShowMore(false);
  };

  useEffect(() => {
    if (activePanel !== "members") setMemberSearch("");
  }, [activePanel]);

  useEffect(() => {
    if (searchExpanded && searchRef.current) searchRef.current.focus();
  }, [searchExpanded]);

  const q = memberSearch.toLowerCase();

  // For custom groups, show only the members that belong to that group
  const scopedMembers = (meta.type === "group" && !meta.isDept && meta.memberIds?.length > 0)
    ? members.filter(m => meta.memberIds.includes(String(m._id)))
    : members;

  const filteredMembers = scopedMembers.filter(m => m.name.toLowerCase().includes(q));
  const onlineMembers   = filteredMembers.filter(m => m.status === "online");
  const awayMembers     = filteredMembers.filter(m => m.status === "away");
  const offlineMembers  = filteredMembers.filter(m => m.status === "offline");

  /* ── Dynamic More menu based on chat type ── */
  const buildMoreItems = () => {
    const muteLabel = meta.muted
      ? { icon: <Volume2 size={14} />, label: "Unmute" }
      : { icon: <VolumeX size={14} />, label: meta.type === "channel" ? "Mute Channel" : meta.type === "group" ? "Mute Group" : "Mute Conversation" };

    if (meta.type === "channel") return [
      { ...muteLabel,                                                            action: "mute"       },
      { icon: <FileText size={14} />, label: "View Files",                      action: "files"      },
      { divider: true },
      { icon: <X size={14} />,        label: "Leave Channel",   danger: true,   action: "leave"      },
      ...(meta.isDeletable ? [
        { icon: <Trash2 size={14} />, label: "Delete Channel",  danger: true,   action: "delete"     },
      ] : []),
    ];
    if (meta.type === "dm") return [
      { ...muteLabel,                                                            action: "mute"       },
      { icon: <FileText size={14} />, label: "View Shared Files",               action: "files"      },
      { divider: true },
      { icon: <X size={14} />,        label: "Clear Chat",      danger: true,   action: "clear"      },
    ];
    /* group */
    return [
      { icon: <UserPlus size={14} />, label: "Add Members",                     action: "addMembers" },
      { icon: <FileText size={14} />, label: "View Shared Files",               action: "files"      },
      { ...muteLabel,                                                            action: "mute"       },
      { divider: true },
      { icon: <X size={14} />,        label: "Leave Group",     danger: true,   action: "leave"      },
    ];
  };

  const handleMoreItem = (action) => {
    setShowMore(false);
    if (action === "files") {
      togglePanel("files");
    } else {
      onMoreAction(action);
    }
  };

  /* ── Left section ── */
  const renderLeft = () => {
    if (meta.type === "channel") return (
      <div className="ct-left">
        <span className="ct-chat-icon"><Hash size={18} /></span>
        <div className="ct-chat-name-wrap">
          <span className="ct-chat-name">{meta.name}</span>
          {meta.muted && <span className="ct-muted-badge"><VolumeX size={11} /> Muted</span>}
        </div>
        <div className="ct-chat-meta">
          <span className="ct-meta-dot" />
          <span className="ct-meta-text">{meta.memberCount} members</span>
          <span className="ct-meta-dot" />
          <span className="ct-meta-text">{meta.desc}</span>
        </div>
      </div>
    );

    if (meta.type === "dm") return (
      <div className="ct-left">
        <span className={`ct-status-dot ${meta.status || "offline"}`} />
        <div className="ct-chat-name-wrap">
          <span className="ct-chat-name">{meta.name}</span>
          {meta.muted && <span className="ct-muted-badge"><VolumeX size={11} /> Muted</span>}
        </div>
        <div className="ct-chat-meta">
          <span className="ct-meta-dot" />
          <span className="ct-meta-text">{meta.role}</span>
          <span className="ct-meta-dot" />
          <span className="ct-meta-text">{statusLabel[meta.status] || "Offline"}</span>
        </div>
      </div>
    );

    if (meta.type === "group") return (
      <div className="ct-left">
        <span className="ct-chat-icon"><Users size={18} /></span>
        <div className="ct-chat-name-wrap">
          <span className="ct-chat-name">{meta.name}</span>
          {meta.muted && <span className="ct-muted-badge"><VolumeX size={11} /> Muted</span>}
        </div>
        <div className="ct-chat-meta">
          <span className="ct-meta-dot" />
          <span className="ct-meta-text">{meta.memberCount} members</span>
        </div>
      </div>
    );

    return (
      <div className="ct-left">
        <span className="ct-chat-icon"><Hash size={18} /></span>
        <div className="ct-chat-name-wrap">
          <span className="ct-chat-name">{meta.name || activeChat}</span>
        </div>
      </div>
    );
  };

  /* ── Right icons ── */
  const renderRight = () => (
    <div className="ct-right">
      <div className="ct-search-wrap">
        <div className={`ct-search-bar ${searchExpanded ? "expanded" : ""}`}
          onClick={() => !searchExpanded && setSearchExpanded(true)}>
          <span className="ct-search-icon"><Search size={14} /></span>
          <input
            ref={searchRef}
            className="ct-search-input"
            placeholder={`Search in ${meta.type === "dm" ? meta.name : `#${meta.name || activeChat}`}...`}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onBlur={() => { if (!searchQuery) setSearchExpanded(false); }}
          />
          {searchExpanded && (
            <div className="ct-search-nav">
              {searchQuery && <span className="ct-search-count">Results</span>}
              <button className="ct-search-nav-btn"><ArrowUp /></button>
              <button className="ct-search-nav-btn"><ArrowDown /></button>
              <button className="ct-search-nav-btn"
                onClick={() => { setSearchExpanded(false); setSearchQuery(""); }}>
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ct-icon-divider" />

      {meta.type !== "dm" && (
        <Tooltip title="Pinned messages" placement="bottom">
          <button
            className={`ct-icon-btn ${activePanel === "pinned" ? "active" : ""}`}
            onClick={() => togglePanel("pinned")}
            aria-label="Pinned messages"
          >
            <Pin size={17} />
            {pinnedMessages.length > 0 && (
              <span className="ct-notif-badge">{pinnedMessages.length}</span>
            )}
          </button>
        </Tooltip>
      )}

      {meta.type !== "dm" ? (
        <Tooltip title="Members" placement="bottom">
          <button
            className={`ct-icon-btn ${activePanel === "members" ? "active" : ""}`}
            onClick={() => togglePanel("members")}
            aria-label="Members"
          >
            <Users size={17} />
          </button>
        </Tooltip>
      ) : (
        <Tooltip title="View profile" placement="bottom">
          <button
            className={`ct-icon-btn ${activePanel === "profile" ? "active" : ""}`}
            onClick={() => togglePanel("profile")}
            aria-label="View profile"
          >
            <Users size={17} />
          </button>
        </Tooltip>
      )}

      <div style={{ position: "relative" }}>
        <Tooltip title="More" placement="bottom">
          <button
            className={`ct-icon-btn ${showMore ? "active" : ""}`}
            onClick={() => { setShowMore(prev => !prev); onPanelChange(null); }}
            aria-label="More options"
          >
            <MoreHorizontal size={17} />
          </button>
        </Tooltip>

        {showMore && (
          <>
            <div className="ct-panel-overlay" onClick={() => setShowMore(false)} />
            <div className="ct-more-dropdown">
              {buildMoreItems().map((item, i) =>
                item.divider ? (
                  <div className="ct-more-divider" key={i} />
                ) : (
                  <div
                    key={i}
                    className={`ct-more-item ${item.danger ? "danger" : ""}`}
                    onClick={() => handleMoreItem(item.action)}
                  >
                    {item.icon}
                    {item.label}
                  </div>
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  /* ── Panels ── */
  const renderPanel = () => {
    if (!activePanel) return null;

    /* Members panel */
    if (activePanel === "members") return (
      <div className="ct-panel">
        <div className="ct-panel-header">
          <div>
            <div className="ct-panel-title">Members</div>
            <div className="ct-panel-subtitle">{scopedMembers.length} member{scopedMembers.length !== 1 ? "s" : ""}{meta.name ? ` in ${meta.type === "group" ? meta.name : `#${meta.name}`}` : ""}</div>
          </div>
          <button className="ct-panel-close" onClick={() => onPanelChange(null)}><X size={16} /></button>
        </div>
        <div className="ct-members-search">
          <div className="ct-members-search-inner">
            <Search size={14} style={{ color: "var(--slack-text-muted)" }} />
            <input
              className="ct-members-search-input"
              placeholder="Search members..."
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="ct-panel-body">
          {onlineMembers.length > 0 && (
            <>
              <div className="ct-members-group-label">Online — {onlineMembers.length}</div>
              {onlineMembers.map((m, i) => <MemberRow key={i} member={m} />)}
            </>
          )}
          {awayMembers.length > 0 && (
            <>
              <div className="ct-members-group-label">Away — {awayMembers.length}</div>
              {awayMembers.map((m, i) => <MemberRow key={i} member={m} />)}
            </>
          )}
          {offlineMembers.length > 0 && (
            <>
              <div className="ct-members-group-label">Offline — {offlineMembers.length}</div>
              {offlineMembers.map((m, i) => <MemberRow key={i} member={m} />)}
            </>
          )}
          {filteredMembers.length === 0 && (
            <div className="ct-panel-empty">
              <div className="ct-panel-empty-icon">👥</div>
              <div className="ct-panel-empty-title">No members found</div>
              <div className="ct-panel-empty-sub">Try a different search term.</div>
            </div>
          )}
        </div>
      </div>
    );

    /* Pinned messages panel */
    if (activePanel === "pinned") return (
      <div className="ct-panel">
        <div className="ct-panel-header">
          <div>
            <div className="ct-panel-title">Pinned Messages</div>
            <div className="ct-panel-subtitle">{meta.name ? `in #${meta.name}` : ""}</div>
          </div>
          <button className="ct-panel-close" onClick={() => onPanelChange(null)}><X size={16} /></button>
        </div>
        <div className="ct-panel-body" style={{ padding: 0 }}>
          {pinnedLoading ? (
            <div className="ct-panel-empty">
              <div className="ct-panel-empty-sub">Loading pinned messages...</div>
            </div>
          ) : pinnedMessages.length === 0 ? (
            <div className="ct-panel-empty">
              <div className="ct-panel-empty-icon">📌</div>
              <div className="ct-panel-empty-title">No pinned messages yet</div>
              <div className="ct-panel-empty-sub">Pin important messages so the team can find them fast.</div>
            </div>
          ) : (
            pinnedMessages.map((msg, i) => (
              <div key={msg.id || i} className="ct-pinned-item">
                <div className="ct-pinned-item-header">
                  <div className="ct-pinned-avatar" style={{ background: msg.color }}>
                    {msg.initials}
                  </div>
                  <span className="ct-pinned-sender">{msg.sender}</span>
                  <span className="ct-pinned-date">{msg.date}</span>
                  <Pin size={12} style={{ color: "#f59e0b", marginLeft: "auto", flexShrink: 0 }} />
                </div>
                <div className="ct-pinned-text">{msg.text}</div>
              </div>
            ))
          )}
        </div>
      </div>
    );

    /* Notifications panel */
    if (activePanel === "notifications") return (
      <div className="ct-panel">
        <div className="ct-panel-header">
          <div>
            <div className="ct-panel-title">Notifications</div>
            <div className="ct-panel-subtitle">{unreadNotifCount} unread</div>
          </div>
          <button className="ct-panel-close" onClick={() => onPanelChange(null)}><X size={16} /></button>
        </div>
        <div className="ct-panel-body" style={{ padding: 0 }}>
          {notifications.length === 0 ? (
            <div className="ct-panel-empty">
              <div className="ct-panel-empty-icon">🔔</div>
              <div className="ct-panel-empty-title">No notifications</div>
              <div className="ct-panel-empty-sub">You're all caught up!</div>
            </div>
          ) : (
            notifications.map((n, i) => (
              <div className={`ct-notif-item ${n.unread ? "unread" : ""}`} key={i}>
                <NotifIcon type={n.type} />
                <div className="ct-notif-body">
                  <div className="ct-notif-top">
                    <span className="ct-notif-source">{n.source}</span>
                    <span className="ct-notif-time">{n.time}</span>
                  </div>
                  <div className="ct-notif-text">{n.text}</div>
                </div>
                {n.unread && <div className="ct-notif-unread-dot" />}
              </div>
            ))
          )}
          {notifications.length > 0 && (
            <button className="ct-notif-mark-all">Mark all as read</button>
          )}
        </div>
      </div>
    );

    /* Profile panel (DM) */
    if (activePanel === "profile" && meta.type === "dm") return (
      <div className="ct-panel">
        <div className="ct-panel-header">
          <div className="ct-panel-title">Profile</div>
          <button className="ct-panel-close" onClick={() => onPanelChange(null)}><X size={16} /></button>
        </div>
        <div className="ct-panel-body" style={{ padding: 0 }}>
          <div className="ct-profile-hero">
            <div className="ct-profile-avatar" style={{ background: meta.color || "#2563eb" }}>
              {meta.initials || "?"}
              <span className={`ct-profile-avatar-dot ${meta.status || "offline"}`} />
            </div>
            <div className="ct-profile-name">{meta.name}</div>
            <div className="ct-profile-role">{meta.role}{meta.dept ? ` · ${meta.dept}` : ""}</div>
            <div className={`ct-profile-status ${meta.status || "offline"}`}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "currentColor", display: "inline-block" }} />
              {statusLabel[meta.status] || "Offline"}
            </div>
            <button className="ct-profile-msg-btn">
              <MessageSquare size={15} /> Send Message
            </button>
          </div>
          {[
            meta.email  && { icon: <Mail size={14} />,     label: "Email",  value: meta.email  },
            meta.phone  && { icon: <Phone size={14} />,    label: "Phone",  value: meta.phone  },
            meta.joined && { icon: <Calendar size={14} />, label: "Joined", value: meta.joined },
          ].filter(Boolean).map((r, i) => (
            <div className="ct-profile-info-row" key={i}>
              <span className="ct-profile-info-icon">{r.icon}</span>
              <div>
                <div className="ct-profile-info-label">{r.label}</div>
                <div className="ct-profile-info-value">{r.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );

    /* Shared files panel */
    if (activePanel === "files") return (
      <div className="ct-panel">
        <div className="ct-panel-header">
          <div>
            <div className="ct-panel-title">Shared Files</div>
            <div className="ct-panel-subtitle">
              {filesLoading ? "Loading..." : `${sharedFiles.length} file${sharedFiles.length !== 1 ? "s" : ""}`}
            </div>
          </div>
          <button className="ct-panel-close" onClick={() => onPanelChange(null)}><X size={16} /></button>
        </div>
        <div className="ct-panel-body" style={{ padding: 0 }}>
          {filesLoading ? (
            <div className="ct-panel-empty">
              <div className="ct-panel-empty-sub">Loading files...</div>
            </div>
          ) : sharedFiles.length === 0 ? (
            <div className="ct-panel-empty">
              <div className="ct-panel-empty-icon">📁</div>
              <div className="ct-panel-empty-title">No files shared yet</div>
              <div className="ct-panel-empty-sub">Files shared in this conversation will appear here.</div>
            </div>
          ) : (
            sharedFiles.map((file, i) => (
              <div key={file.id || i} className="ct-file-item">
                <div className="ct-file-icon"><File size={18} /></div>
                <div className="ct-file-info">
                  <div className="ct-file-name">{file.name}</div>
                  <div className="ct-file-meta">{file.sender} · {file.date}</div>
                </div>
                <Tooltip title={file.url ? "Download" : "No download URL available"} placement="left">
                  <button
                    className={`ct-file-dl-btn ${!file.url ? "disabled" : ""}`}
                    onClick={() => file.url && triggerDownload(file.url, file.name)}
                    disabled={!file.url}
                  >
                    <Download size={14} />
                  </button>
                </Tooltip>
              </div>
            ))
          )}
        </div>
      </div>
    );

    return null;
  };

  return (
    <>
      <div className="ct-topbar">
        {renderLeft()}
        {renderRight()}
      </div>
      {activePanel && (
        <div className="ct-panel-overlay" onClick={() => onPanelChange(null)} />
      )}
      {renderPanel()}
    </>
  );
};

export default ChatTopbar;
