function CallControls({ isCallActive, onStartCall, onEndCall }) {
  return (
    <div className="call-controls">
      {!isCallActive ? (
        <button className="start-button" onClick={onStartCall}>
          🎙️ Start Call
        </button>
      ) : (
        <button className="end-button" onClick={onEndCall}>
          ⏹ End Call
        </button>
      )}
    </div>
  );
}

export default CallControls;