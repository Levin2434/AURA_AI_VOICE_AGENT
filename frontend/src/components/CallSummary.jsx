function CallSummary({ summary }) {
  if (!summary) {
    return null;
  }

  return (
    <section className="summary-panel">
      <div className="section-title">
        <h2>Call Summary</h2>
      </div>

      <div className="summary-content">

        {/* Customer Intent */}
        <div className="summary-item">
          <span>Customer Intent</span>
          <strong>
            {summary.customer_intent || "N/A"}
          </strong>
        </div>

        {/* Order ID */}
        <div className="summary-item">
          <span>Order ID</span>
          <strong>
            {summary.order_id || "N/A"}
          </strong>
        </div>

        {/* Resolution Status */}
        <div className="summary-item">
          <span>Resolution Status</span>
          <strong>
            {summary.resolution_status || "N/A"}
          </strong>
        </div>

        {/* Call Summary */}
        <div className="summary-description">
          <span>Call Summary</span>

          <p>
            {summary.call_summary ||
              "No summary available."}
          </p>
        </div>

        {/* Action Items */}
        <div className="summary-description">
          <span>Action Items</span>

          {Array.isArray(summary.action_items) &&
          summary.action_items.length > 0 ? (
            <ul>
              {summary.action_items.map(
                (item, index) => (
                  <li key={index}>{item}</li>
                )
              )}
            </ul>
          ) : (
            <p>No action items.</p>
          )}
        </div>

        {/* Structured JSON */}
        <details className="json-details">
          <summary>
            View Structured JSON
          </summary>

          <pre>
            {JSON.stringify(summary, null, 2)}
          </pre>
        </details>

      </div>
    </section>
  );
}

export default CallSummary;