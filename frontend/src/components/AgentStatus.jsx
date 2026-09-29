function AgentStatus({ status }) {
  const statusText = {
    idle: "Ready",
    listening: "Listening",
    thinking: "Thinking",
    speaking: "Speaking",
  };

  return (
    <div className={`agent-status ${status}`}>
      <div className="status-circle"></div>

      <div>
        <span className="status-label">Agent Status</span>
        <strong>{statusText[status] || "Ready"}</strong>
      </div>
    </div>
  );
}

export default AgentStatus;