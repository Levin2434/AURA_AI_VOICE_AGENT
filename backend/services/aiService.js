const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

/* =========================================================
   AURA SKINCARE SYSTEM PROMPT
========================================================= */

const SYSTEM_PROMPT = `
You are Aria, the AI customer support specialist for Aura Skincare.

PERSONA:
- Friendly
- Professional
- Concise
- Natural Indian customer support style
- Never unnecessarily repeat yourself

BRAND:
Aura Skincare is a premium organic Indian skincare brand focused on
simple, effective skincare products made with thoughtfully selected ingredients.

SHIPPING POLICY:
- Free delivery on orders above ₹499.
- Orders below ₹499 have a ₹50 shipping fee.
- Standard delivery takes 3–5 business days.

RETURN & REFUND POLICY:
- Returns are accepted within 7 days of delivery.
- Products must be unopened and unused.
- Products must be in original packaging.
- Damaged or defective products must be reported within 48 hours of delivery.
- Photos are required for damaged/defective product replacement.

CANCELLATION POLICY:
- Orders can be cancelled only while their status is Processing.
- Shipped or Out for Delivery orders cannot be cancelled.
- Customers may refuse delivery at the doorstep.

CASH ON DELIVERY:
- COD is available for orders up to ₹2,500.
- Customers can pay by cash or UPI at the doorstep.

IMPORTANT RULES:
1. Never invent order information.
2. Never claim that an order was cancelled, refunded, returned, replaced, or modified.
3. Only explain whether an action is allowed according to the policy.
4. When the customer asks about a specific order, use ONLY the order information supplied by the application.
5. If the order ID is missing, ask the customer for it.
6. If the order does not exist, clearly explain that it could not be located.
7. Follow Aura Skincare policies exactly.
8. Do not promise actions that the system cannot actually perform.
9. If a request is unrelated to Aura Skincare, politely explain that you can only help with Aura Skincare queries.
10. Keep responses concise because this is a voice conversation.
`;

/* =========================================================
   LOCAL FALLBACK RESPONSE
   Used when Gemini is unavailable or quota is exhausted.
========================================================= */

function generateLocalFallback(message, orderData) {
  const text = String(message || "")
    .toLowerCase()
    .trim();

  /* =======================================================
     UNRELATED REQUEST
  ======================================================= */

  const unrelatedPatterns = [
    "phone",
    "mobile",
    "laptop",
    "computer",
    "iphone",
    "samsung",
    "android",
    "bike",
    "car",
    "movie",
    "game",
    "gaming",
    "football",
    "cricket",
    "weather",
    "politics",
    "stock market",
  ];

  const isUnrelated = unrelatedPatterns.some(
    (word) => text.includes(word)
  );

  if (isUnrelated) {
    return (
      "I can only assist with Aura Skincare products, orders, " +
      "delivery, returns, refunds, and related customer support. " +
      "How can I help you with your Aura Skincare order?"
    );
  }

  /* =======================================================
     INVALID / MISSING ORDER
  ======================================================= */

  if (!orderData) {

    /*
      IMPORTANT:
      Voice recognition can sometimes hear "order" as "border".
      We support both.
    */

    const orderMatch = text.match(
      /\b(?:order|border)(?:\s+number)?(?:\s+is)?\s+(\d{3})\b/i
    );

    const ordMatch = text.match(
      /\bord[\s-]?(\d{3})\b/i
    );

    /*
      Customer explicitly mentioned:
      order 999
      border 999
      ORD-999
      ORD 999
      ORD999
    */

    if (orderMatch) {
      const invalidOrderId =
        `ORD-${orderMatch[1]}`;

      return (
        `I couldn't locate an order with ID ${invalidOrderId} ` +
        `in our system. Could you please double-check and ` +
        `share the correct order number?`
      );
    }

    if (ordMatch) {
      const invalidOrderId =
        `ORD-${ordMatch[1]}`;

      return (
        `I couldn't locate an order with ID ${invalidOrderId} ` +
        `in our system. Could you please double-check and ` +
        `share the correct order number?`
      );
    }

    /*
      Customer is asking about an order but did not
      provide an order number.
    */

    if (
      text.includes("order") ||
      text.includes("border") ||
      text.includes("delivery") ||
      text.includes("tracking") ||
      text.includes("track") ||
      text.includes("cancel") ||
      text.includes("return") ||
      text.includes("refund")
    ) {
      return (
        "Sure, I can help with that. Could you please provide " +
        "your order ID?"
      );
    }

    /*
      General Aura support.
    */

    return (
      "I'm Aria from Aura Skincare. I can help with orders, " +
      "delivery, returns, refunds, cancellations, and product information."
    );
  }

  /* =======================================================
     ORDER CANCELLATION
  ======================================================= */

  if (
    text.includes("cancel") ||
    text.includes("cancellation")
  ) {

    if (
      orderData.status === "Processing" &&
      orderData.cancellation_eligible === true
    ) {
      return (
        `Yes. Order ${orderData.order_id} is currently processing, ` +
        `so it is eligible for cancellation.`
      );
    }

    return (
      `Order ${orderData.order_id} is currently ` +
      `${orderData.status}. Orders can only be cancelled ` +
      `while they are processing.`
    );
  }

  /* =======================================================
     RETURN / REFUND
  ======================================================= */

  if (
    text.includes("return") ||
    text.includes("refund")
  ) {

    if (orderData.status === "Delivered") {

      return (
        `Your order ${orderData.order_id} was delivered ` +
        `${orderData.delivered || "recently"}. ` +
        `Aura Skincare accepts returns within 7 days of delivery ` +
        `for unopened and unused products in their original packaging.`
      );
    }

    return (
      `Order ${orderData.order_id} is currently ` +
      `${orderData.status}. The return period begins after delivery.`
    );
  }

  /* =======================================================
     DAMAGED / DEFECTIVE PRODUCT
  ======================================================= */

  if (
    text.includes("damaged") ||
    text.includes("defective") ||
    text.includes("broken")
  ) {

    return (
      "If your Aura Skincare product is damaged or defective, " +
      "please report it within 48 hours of delivery. Photos are " +
      "required for a damaged or defective product replacement."
    );
  }

  /* =======================================================
     TRACKING / DELIVERY
  ======================================================= */

  if (
    text.includes("where") ||
    text.includes("track") ||
    text.includes("tracking") ||
    text.includes("delivery") ||
    text.includes("deliver") ||
    text.includes("status") ||
    text.includes("arrive")
  ) {

    let response =
      `Order ${orderData.order_id} for ${orderData.product} ` +
      `is currently ${orderData.status}.`;

    if (orderData.courier) {
      response +=
        ` It is being handled by ${orderData.courier}.`;
    }

    if (orderData.tracking_number) {
      response +=
        ` The tracking number is ${orderData.tracking_number}.`;
    }

    if (orderData.expected_delivery) {
      response +=
        ` The expected delivery is ${orderData.expected_delivery}.`;
    }

    if (orderData.delivered) {
      response +=
        ` It was delivered ${orderData.delivered}.`;
    }

    return response;
  }

  /* =======================================================
     PRODUCT INFORMATION
  ======================================================= */

  if (
    text.includes("product") ||
    text.includes("serum") ||
    text.includes("sunscreen") ||
    text.includes("face wash") ||
    text.includes("toner")
  ) {

    return (
      `Your order contains ${orderData.product}. ` +
      `The order value is ₹${orderData.value}.`
    );
  }

  /* =======================================================
     ORDER VALUE
  ======================================================= */

  if (
    text.includes("price") ||
    text.includes("cost") ||
    text.includes("value") ||
    text.includes("how much")
  ) {

    return (
      `The value of order ${orderData.order_id} is ` +
      `₹${orderData.value}.`
    );
  }

  /* =======================================================
     GENERIC ORDER RESPONSE
  ======================================================= */

  return (
    `I found order ${orderData.order_id} for ` +
    `${orderData.product}. Its current status is ` +
    `${orderData.status}.`
  );
}

/* =========================================================
   GEMINI RESPONSE
========================================================= */

async function generateResponse(
  message,
  orderData = null,
  history = []
) {

  /*
    If no API key exists, use local response.
  */

  if (!process.env.GEMINI_API_KEY) {

    console.log(
      "Gemini API key not available."
    );

    console.log(
      "Using local Aura response."
    );

    return generateLocalFallback(
      message,
      orderData
    );
  }

  const model =
    genAI.getGenerativeModel({
      model: "gemini-3.8-flash",
      systemInstruction:
        SYSTEM_PROMPT,
    });

  let context = "";

  if (orderData) {

    context = `
The application found the following order information.

Use ONLY this information when answering questions about the order.

${JSON.stringify(
  orderData,
  null,
  2
)}
`;
  }

  const chat =
    model.startChat({
      history,
    });

  try {

    console.log(
      "Gemini request attempt 1/1"
    );

    const result =
      await chat.sendMessage(`
${context}

Customer message:
${message}
`);

    return result.response.text();

  } catch (error) {

    console.error(
      "Gemini request failed:",
      error.message
    );

    console.log(
      "Using local Aura fallback response."
    );

    /*
      No retry.
      This prevents wasting free-tier quota.
    */

    return generateLocalFallback(
      message,
      orderData
    );
  }
}

/* =========================================================
   EXPORT
========================================================= */

module.exports = {
  generateResponse,
  generateLocalFallback,
};