import React, { useState, useEffect, useMemo, useCallback } from "react";
import ChatSidebar     from "./Chatsidebar";
import ChatTopbar      from "./Chattopbar";
import ChatMessageArea from "./Message";
import "./Chatlayout.css";
import { chatApi, getSession, getAvatarColor, getInitials } from "../utils/api";

/* ── Helpers ── */
const loadSet = (key) => {
  try { return new Set(JSON.parse(localStorage.getItem(key) || "[]")); }
  catch { return new Set(); }
};
const saveSet = (key, set) => localStorage.setItem(key, JSON.stringify([...set]));

// Canonical DM chatId: sort both user IDs so Admin↔Employee and Employee↔Admin share one thread
const getDMChatId = (userId1, userId2) => {
  const ids = [String(userId1), String(userId2)].sort();
  return `dm-${ids[0]}-${ids[1]}`;
};

const isMongoId = (str) => /^[0-9a-f]{24}$/i.test(str);

/* ── Modal Component ── */
const ChatModal = ({ title, onClose, children }) => (
  <div className="chat-modal-overlay" onClick={onClose}>
    <div className="chat-modal" onClick={e => e.stopPropagation()}>
      <div className="chat-modal-header">
        <h3 className="chat-modal-title">{title}</h3>
        <button className="chat-modal-close" onClick={onClose}>✕</button>
      </div>
      <div className="chat-modal-body">{children}</div>
    </div>
  </div>
);

/* ── MemberPicker ── */
const MemberPicker = ({ members, selected, onToggle, search, onSearch }) => (
  <>
    <input
      className="chat-modal-input"
      placeholder="Search members..."
      value={search}
      onChange={e => onSearch(e.target.value)}
      autoFocus
    />
    <div className="chat-modal-member-list">
      {members
        .filter(m => m.name.toLowerCase().includes(search.toLowerCase()))
        .map(m => {
          const isSelected = selected.includes(String(m._id));
          return (
            <div
              key={m._id}
              className={`chat-modal-member-item ${isSelected ? "selected" : ""}`}
              onClick={() => onToggle(String(m._id))}
            >
              <div className="chat-modal-member-avatar" style={{ background: m.color }}>
                {m.initials}
              </div>
              <div>
                <div className="chat-modal-member-name">{m.name}</div>
                <div className="chat-modal-member-role">{m.role}</div>
              </div>
              <div className={`chat-modal-check ${isSelected ? "checked" : ""}`}>
                {isSelected && "✓"}
              </div>
            </div>
          );
        })}
    </div>
  </>
);

/* ── Main Layout ── */
const ChatLayout = ({
  onBackToDashboard = () => {},
  initialChat       = "general",
  userRole          = "employee",
}) => {
  const [activeChat,  setActiveChat]  = useState(initialChat);
  const [activePanel, setActivePanel] = useState(null);

  const [channels,      setChannels]      = useState([]);
  const [dms,           setDms]           = useState([]);
  const [groups,        setGroups]        = useState([]);
  const [members,       setMembers]       = useState([]);
  const [notifications, setNotifications] = useState([]);

  /* ── Persisted client-side state ── */
  const [mutedChats, setMutedChats] = useState(() => loadSet("chat_mutedChats"));
  const [leftChats,  setLeftChats]  = useState(() => loadSet("chat_leftChats"));

  /* ── Server-fetched panel data ── */
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [pinnedLoading,  setPinnedLoading]  = useState(false);
  const [sharedFiles,    setSharedFiles]    = useState([]);
  const [filesLoading,   setFilesLoading]   = useState(false);

  /* ── Message refresh trigger (for clear chat) ── */
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  /* ── Modal state ── */
  const [modal, setModal] = useState(null); // null | "channel" | "dm" | "group" | "addMembers"
  const [deleteError,   setDeleteError]   = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Add Channel modal state ── */
  const [channelName, setChannelName] = useState("");
  const [channelDesc, setChannelDesc] = useState("");
  const [channelSubmitting, setChannelSubmitting] = useState(false);

  /* ── New DM modal state ── */
  const [dmSearch, setDmSearch] = useState("");

  /* ── New Group modal state ── */
  const [groupName,        setGroupName]        = useState("");
  const [groupMembers,     setGroupMembers]      = useState([]);
  const [groupMemberSearch,setGroupMemberSearch] = useState("");
  const [groupSubmitting,  setGroupSubmitting]   = useState(false);

  /* ── Add Members modal state ── */
  const [addMembersSelected, setAddMembersSelected] = useState([]);
  const [addMembersSearch,   setAddMembersSearch]   = useState("");
  const [addMembersSubmitting, setAddMembersSubmitting] = useState(false);

  const { user: sessionUser } = getSession();
  const currentUser = {
    name:     sessionUser?.name     || "User",
    role:     sessionUser?.role     || userRole,
    initials: getInitials(sessionUser?.name || ""),
    color:    getAvatarColor(sessionUser?._id || sessionUser?.email || sessionUser?.name || ""),
    id:       sessionUser?._id || sessionUser?.id,
  };
  const workspace = sessionUser?.companyName || sessionUser?.company || "CompanyChat";

  /* ── Initial data fetch ── */
  useEffect(() => {
    const fetchChatData = async () => {
      const [chRes, dmRes, grpRes, memRes, notifRes] = await Promise.allSettled([
        chatApi.getChannels(),
        chatApi.getDMs(),
        chatApi.getGroups(),
        chatApi.getMembers(),
        chatApi.getNotifications(),
      ]);
      if (chRes.status    === "fulfilled") setChannels(chRes.value.channels || []);
      if (dmRes.status    === "fulfilled") {
        const myId = currentUser.id;
        const rawDms = dmRes.value.dms || [];
        // Replace the per-recipient id with a canonical pair-based id so each
        // sender/receiver pair gets its own private thread.
        const mappedDms = rawDms.map(dm => ({
          ...dm,
          id: myId && dm.userId ? getDMChatId(myId, dm.userId) : (dm.id || `dm-${dm._id}`),
        }));
        setDms(mappedDms);
      }
      if (grpRes.status   === "fulfilled") setGroups(grpRes.value.groups             || []);
      if (memRes.status   === "fulfilled") setMembers(memRes.value.members           || []);
      if (notifRes.status === "fulfilled") setNotifications(notifRes.value.notifications || []);
    };
    fetchChatData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Load panel data when panel opens ── */
  useEffect(() => {
    if (activePanel === "pinned") {
      setPinnedLoading(true);
      chatApi.getPinned(activeChat)
        .then(d => setPinnedMessages(d.pinned || []))
        .catch(() => setPinnedMessages([]))
        .finally(() => setPinnedLoading(false));
    } else if (activePanel === "files") {
      setFilesLoading(true);
      chatApi.getFiles(activeChat)
        .then(d => setSharedFiles(d.files || []))
        .catch(() => setSharedFiles([]))
        .finally(() => setFilesLoading(false));
    }
  }, [activePanel, activeChat]);

  /* ── allMeta ── */
  const allMeta = useMemo(() => {
    const map = {};
    channels.forEach(ch => {
      const id = ch.id || String(ch._id);
      map[id] = {
        type:        "channel",
        name:        ch.name,
        desc:        ch.description || `Company-wide ${ch.name} channel`,
        memberCount: ch.memberCount || 0,
        readOnly:    ch.readOnly    || false,
        muted:       mutedChats.has(id),
        isDeletable: !!ch._id, // only custom channels have a MongoDB _id
      };
    });
    dms.forEach(dm => {
      const id = dm.id || `dm-${dm._id}`;
      map[id] = {
        type:           "dm",
        name:           dm.name,
        initials:       getInitials(dm.name),
        role:           dm.role       || "",
        dept:           dm.department || "",
        status:         dm.status     || "offline",
        email:          dm.email      || "",
        phone:          dm.phone      || "",
        joined:         dm.joined     || "",
        color:          getAvatarColor(String(dm._id || dm.id || dm.name)),
        muted:          mutedChats.has(id),
      };
    });
    groups.forEach(grp => {
      const id = grp.id || `grp-${grp._id}`;
      map[id] = {
        type:        "group",
        name:        grp.name,
        memberCount: grp.memberCount || 0,
        memberIds:   grp.memberIds   || [],   // employee _id strings for custom groups
        muted:       mutedChats.has(id),
        isDept:      grp.isDept || false,
      };
    });
    return map;
  }, [channels, dms, groups, mutedChats]);

  /* ── Navigation ── */
  const handleChatChange = (chatId) => {
    setActiveChat(chatId);
    setActivePanel(null);
  };

  const handlePanelChange = (panel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  /* ── Mute / Leave ── */
  const handleMuteChat = useCallback((chatId) => {
    setMutedChats(prev => {
      const next = new Set(prev);
      if (next.has(chatId)) next.delete(chatId); else next.add(chatId);
      saveSet("chat_mutedChats", next);
      return next;
    });
  }, []);

  const handleLeaveChat = useCallback((chatId) => {
    setLeftChats(prev => {
      const next = new Set(prev);
      next.add(chatId);
      saveSet("chat_leftChats", next);
      return next;
    });
    setActiveChat("general");
    setActivePanel(null);
  }, []);

  /* ── Clear chat ── */
  const handleClearChat = useCallback(async (chatId) => {
    try {
      await chatApi.clearChat(chatId);
      setRefreshTrigger(t => t + 1);
    } catch (err) {
      console.error("Clear chat failed:", err.message);
    }
  }, []);

  /* ── Delete channel / group ── */
  const handleDeleteChat = useCallback(async (chatId) => {
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const meta = allMeta[chatId];
      if (!meta?.isDeletable) { setDeleteLoading(false); return; }

      if (meta.type === "channel") {
        await chatApi.deleteChannel(chatId);
        setChannels(prev => prev.filter(ch => (ch.id || String(ch._id)) !== chatId));
      }

      setActiveChat("general");
      setActivePanel(null);
      setModal(null);
    } catch (err) {
      setDeleteError(err.message || "Failed to delete. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  }, [allMeta]);

  /* ── More menu dispatcher ── */
  const handleMoreAction = useCallback((action) => {
    switch (action) {
      case "mute":       handleMuteChat(activeChat); break;
      case "leave":      handleLeaveChat(activeChat); break;
      case "clear":      handleClearChat(activeChat); break;
      case "addMembers": setModal("addMembers"); break;
      case "delete":     setDeleteError(null); setModal("deleteConfirm"); break;
      default: break;
    }
  }, [activeChat, handleMuteChat, handleLeaveChat, handleClearChat]);

  /* ── Pin message (called by MessageArea) ── */
  const handlePinMessage = useCallback(async (chatId, msgId) => {
    const data = await chatApi.pinMessage(chatId, msgId);
    if (activePanel === "pinned") {
      chatApi.getPinned(chatId)
        .then(d => setPinnedMessages(d.pinned || []))
        .catch(() => {});
    }
    return data;
  }, [activePanel]);

  /* ── Create channel modal ── */
  const openChannelModal = () => { setChannelName(""); setChannelDesc(""); setModal("channel"); };

  const submitChannel = async () => {
    if (!channelName.trim()) return;
    setChannelSubmitting(true);
    try {
      const data = await chatApi.createChannel({ name: channelName, description: channelDesc });
      setChannels(prev => [...prev, data.channel]);
      setActiveChat(data.channel.id);
      setModal(null);
    } catch (err) {
      console.error(err.message);
    } finally {
      setChannelSubmitting(false);
    }
  };

  /* ── New DM modal ── */
  const openDMModal = () => { setDmSearch(""); setModal("dm"); };

  const selectDM = (dmId) => {
    setActiveChat(dmId);
    setModal(null);
  };

  /* ── Create group modal ── */
  const openGroupModal = () => {
    setGroupName(""); setGroupMembers([]); setGroupMemberSearch(""); setModal("group");
  };

  const toggleGroupMember = (id) => {
    setGroupMembers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const submitGroup = async () => {
    if (!groupName.trim()) return;
    setGroupSubmitting(true);
    try {
      const data = await chatApi.createGroup({ name: groupName, members: groupMembers });
      setGroups(prev => [...prev, data.group]);
      setActiveChat(data.group.id);
      setModal(null);
    } catch (err) {
      console.error(err.message);
    } finally {
      setGroupSubmitting(false);
    }
  };

  /* ── Add members modal ── */
  const toggleAddMember = (id) => {
    setAddMembersSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const submitAddMembers = async () => {
    if (addMembersSelected.length === 0) return;
    const groupIdPart = activeChat.replace("grp-", "");
    if (!isMongoId(groupIdPart)) return;
    setAddMembersSubmitting(true);
    try {
      const data = await chatApi.addGroupMembers(groupIdPart, addMembersSelected);
      setGroups(prev => prev.map(g =>
        g.id === activeChat ? { ...g, memberCount: data.memberCount } : g
      ));
      setModal(null);
    } catch (err) {
      console.error(err.message);
    } finally {
      setAddMembersSubmitting(false);
    }
  };

  /* ── Filtered lists (exclude left chats, apply muted flag) ── */
  const visibleChannels = channels
    .filter(ch => !leftChats.has(ch.id || String(ch._id)))
    .map(ch => ({ ...ch, muted: mutedChats.has(ch.id || String(ch._id)) }));

  const visibleDms = dms.map(dm => ({
    ...dm,
    muted: mutedChats.has(dm.id || `dm-${dm._id}`),
  }));

  const visibleGroups = groups
    .filter(grp => !leftChats.has(grp.id || `grp-${grp._id}`))
    .map(grp => ({ ...grp, muted: mutedChats.has(grp.id || `grp-${grp._id}`) }));

  return (
    <div className="cl-root">
      <ChatSidebar
        activeChat={activeChat}
        onChatChange={handleChatChange}
        onBackToDashboard={onBackToDashboard}
        channels={visibleChannels}
        dms={visibleDms}
        groups={visibleGroups}
        currentUser={currentUser}
        workspace={workspace}
        onAddChannel={openChannelModal}
        onNewDM={openDMModal}
        onNewGroup={openGroupModal}
      />
      <ChatTopbar
        activeChat={activeChat}
        activePanel={activePanel}
        onPanelChange={handlePanelChange}
        allMeta={allMeta}
        members={members}
        notifications={notifications}
        onMoreAction={handleMoreAction}
        pinnedMessages={pinnedMessages}
        pinnedLoading={pinnedLoading}
        sharedFiles={sharedFiles}
        filesLoading={filesLoading}
      />
      <ChatMessageArea
        activeChat={activeChat}
        userRole={userRole}
        panelOpen={!!activePanel}
        currentUser={currentUser}
        allMeta={allMeta}
        onPinMessage={handlePinMessage}
        refreshTrigger={refreshTrigger}
      />

      {/* ── Add Channel Modal ── */}
      {modal === "channel" && (
        <ChatModal title="Add a Channel" onClose={() => setModal(null)}>
          <label className="chat-modal-label">Channel Name *</label>
          <input
            className="chat-modal-input"
            placeholder="e.g. design-team"
            value={channelName}
            onChange={e => setChannelName(e.target.value)}
            autoFocus
          />
          <label className="chat-modal-label">Description</label>
          <input
            className="chat-modal-input"
            placeholder="What is this channel about?"
            value={channelDesc}
            onChange={e => setChannelDesc(e.target.value)}
          />
          <button
            className="chat-modal-submit"
            onClick={submitChannel}
            disabled={!channelName.trim() || channelSubmitting}
          >
            {channelSubmitting ? "Creating..." : "Create Channel"}
          </button>
        </ChatModal>
      )}

      {/* ── New DM Modal ── */}
      {modal === "dm" && (
        <ChatModal title="New Message" onClose={() => setModal(null)}>
          <input
            className="chat-modal-input"
            placeholder="Search employees..."
            value={dmSearch}
            onChange={e => setDmSearch(e.target.value)}
            autoFocus
          />
          <div className="chat-modal-member-list">
            {dms
              .filter(dm => dm.name.toLowerCase().includes(dmSearch.toLowerCase()))
              .map(dm => (
                <div
                  key={dm._id}
                  className="chat-modal-member-item"
                  onClick={() => selectDM(dm.id || `dm-${dm._id}`)}
                >
                  <div className="chat-modal-member-avatar" style={{ background: dm.color }}>
                    {dm.initials}
                  </div>
                  <div>
                    <div className="chat-modal-member-name">{dm.name}</div>
                    <div className="chat-modal-member-role">{dm.role || dm.department}</div>
                  </div>
                </div>
              ))}
            {dms.filter(dm => dm.name.toLowerCase().includes(dmSearch.toLowerCase())).length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "#868686", fontSize: 13 }}>
                No employees found
              </div>
            )}
          </div>
        </ChatModal>
      )}

      {/* ── New Group Modal ── */}
      {modal === "group" && (
        <ChatModal title="Create a Group" onClose={() => setModal(null)}>
          <label className="chat-modal-label">Group Name *</label>
          <input
            className="chat-modal-input"
            placeholder="e.g. Project Alpha"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            autoFocus
          />
          <label className="chat-modal-label">Add Members</label>
          <MemberPicker
            members={members}
            selected={groupMembers}
            onToggle={toggleGroupMember}
            search={groupMemberSearch}
            onSearch={setGroupMemberSearch}
          />
          {groupMembers.length > 0 && (
            <div style={{ fontSize: 12, color: "#2563eb", marginBottom: 4 }}>
              {groupMembers.length} member{groupMembers.length !== 1 ? "s" : ""} selected
            </div>
          )}
          <button
            className="chat-modal-submit"
            onClick={submitGroup}
            disabled={!groupName.trim() || groupSubmitting}
          >
            {groupSubmitting ? "Creating..." : "Create Group"}
          </button>
        </ChatModal>
      )}

      {/* ── Add Members Modal ── */}
      {modal === "addMembers" && (
        <ChatModal title="Add Members" onClose={() => setModal(null)}>
          <MemberPicker
            members={members}
            selected={addMembersSelected}
            onToggle={toggleAddMember}
            search={addMembersSearch}
            onSearch={setAddMembersSearch}
          />
          {addMembersSelected.length > 0 && (
            <div style={{ fontSize: 12, color: "#2563eb", marginBottom: 4 }}>
              {addMembersSelected.length} member{addMembersSelected.length !== 1 ? "s" : ""} selected
            </div>
          )}
          <button
            className="chat-modal-submit"
            onClick={submitAddMembers}
            disabled={addMembersSelected.length === 0 || addMembersSubmitting}
          >
            {addMembersSubmitting ? "Adding..." : "Add Members"}
          </button>
        </ChatModal>
      )}

      {/* ── Delete Confirm Modal ── */}
      {modal === "deleteConfirm" && (() => {
        const meta  = allMeta[activeChat] || {};
        const label = meta.type === "channel" ? `#${meta.name}` : meta.name;
        const kind  = meta.type === "channel" ? "Channel" : "Group";
        const closeModal = () => { setModal(null); setDeleteError(null); };
        return (
          <ChatModal title={`Delete ${kind}`} onClose={closeModal}>
            <p className="chat-modal-warn-text">
              Are you sure you want to permanently delete <strong>{label}</strong>?
              This will delete all messages and cannot be undone.
            </p>
            {deleteError && (
              <p style={{ color: "#dc2626", fontSize: 13, marginTop: 0, marginBottom: 8 }}>
                {deleteError}
              </p>
            )}
            <div className="chat-modal-row">
              <button
                className="chat-modal-submit chat-modal-submit--danger"
                onClick={() => handleDeleteChat(activeChat)}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting…" : `Delete ${kind}`}
              </button>
              <button
                className="chat-modal-cancel"
                onClick={closeModal}
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
          </ChatModal>
        );
      })()}
    </div>
  );
};

export default ChatLayout;
