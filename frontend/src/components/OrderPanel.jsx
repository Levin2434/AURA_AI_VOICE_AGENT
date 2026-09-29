const orders = [
  {
    id: "ORD-101",
    customer: "Priya Sharma",
    product: "Vitamin C Serum (30ml)",
    value: "₹699",
    status: "Out for Delivery",
    details: "BlueDart — BD-982103. Expected by 6 PM today",
  },
  {
    id: "ORD-102",
    customer: "Rahul Verma",
    product: "Hydrating Sunscreen SPF 50",
    value: "₹499",
    status: "Delivered",
    details: "Delhivery — DL-441029. Delivered 14 days ago",
  },
  {
    id: "ORD-103",
    customer: "Ananya Patel",
    product: "Green Tea Face Wash + Toner",
    value: "₹850",
    status: "Processing",
    details: "Ordered 3 hours ago. Eligible for cancellation",
  },
];

function OrderPanel() {
  return (
    <section className="order-panel">
      <div className="section-title">
        <h2>Test Orders</h2>
        <span>3</span>
      </div>

      <p className="section-description">
        Use these order IDs to test Aria's order lookup.
      </p>

      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-card" key={order.id}>
            <div className="order-top">
              <strong>{order.id}</strong>

              <span
                className={`order-status ${
                  order.status === "Delivered"
                    ? "delivered"
                    : order.status === "Processing"
                    ? "processing"
                    : "out-delivery"
                }`}
              >
                {order.status}
              </span>
            </div>

            <p className="customer-name">{order.customer}</p>

            <p className="product-name">{order.product}</p>

            <p className="order-value">{order.value}</p>

            <p className="order-details">{order.details}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default OrderPanel;