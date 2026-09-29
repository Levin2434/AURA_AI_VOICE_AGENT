const orders = {
  "ORD-101": {
    order_id: "ORD-101",
    customer: "Priya Sharma",
    product: "Vitamin C Serum (30ml)",
    value: 699,
    currency: "INR",
    status: "Out for Delivery",
    courier: "BlueDart",
    tracking_number: "BD-982103",
    expected_delivery: "6 PM today",
  },

  "ORD-102": {
    order_id: "ORD-102",
    customer: "Rahul Verma",
    product: "Hydrating Sunscreen SPF 50",
    value: 499,
    currency: "INR",
    status: "Delivered",
    courier: "Delhivery",
    tracking_number: "DL-441029",
    delivered: "14 days ago",
  },

  "ORD-103": {
    order_id: "ORD-103",
    customer: "Ananya Patel",
    product: "Green Tea Face Wash + Toner",
    value: 850,
    currency: "INR",
    status: "Processing",
    ordered: "3 hours ago",
    cancellation_eligible: true,
  },
};

function getOrderDetails(orderId) {
  const normalizedId = orderId.trim().toUpperCase();

  return orders[normalizedId] || null;
}

module.exports = {
  orders,
  getOrderDetails,
};