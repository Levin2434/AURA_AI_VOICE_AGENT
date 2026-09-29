const express = require("express");
const cors = require("cors");
require("dotenv").config();

const {
  generateResponse,
} = require("./services/aiService");

const app = express();

const PORT =
  process.env.PORT || 5000;

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(
  express.json()
);

/* =========================================================
   TEST ORDERS
========================================================= */

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

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {

  res.json({
    success: true,
    message:
      "Aura Skincare AI backend is running",
  });

});

/* =========================================================
   ORDER LOOKUP API
========================================================= */

app.get(
  "/api/orders/:orderId",
  (req, res) => {

    const orderId =
      req.params.orderId
        .trim()
        .toUpperCase();

    const order =
      orders[orderId];

    if (!order) {

      return res.status(404).json({
        success: false,
        message:
          `Order ${orderId} was not found.`,
      });

    }

    res.json({
      success: true,
      order,
    });

  }
);

/* =========================================================
   ORDER ID EXTRACTION
========================================================= */

function extractOrderId(message) {

  if (
    !message ||
    typeof message !== "string"
  ) {
    return null;
  }

  const text =
    message.trim();

  /* -------------------------------------------------------
     ORD-101
     ORD 101
     ORD101
  ------------------------------------------------------- */

  const standardOrderMatch =
    text.match(
      /\bORD[\s-]?(\d{3})\b/i
    );

  if (standardOrderMatch) {

    return (
      `ORD-${standardOrderMatch[1]}`
    );

  }

  /* -------------------------------------------------------
     order 101
     order number 101
     order is 101
     border 101

     "border" is included because browser speech
     recognition can sometimes mishear "order".
  ------------------------------------------------------- */

  const spokenOrderMatch =
    text.match(
      /\b(?:order|border)(?:\s+number)?(?:\s+is)?\s+(\d{3})\b/i
    );

  if (spokenOrderMatch) {

    return (
      `ORD-${spokenOrderMatch[1]}`
    );

  }

  /* -------------------------------------------------------
     Standalone number

     Example:
     Customer first says:

     "where is my order"

     Aria asks for ID.

     Customer says:

     "101"
  ------------------------------------------------------- */

  const standaloneNumberMatch =
    text.match(
      /^\s*(\d{3})\s*$/
    );

  if (standaloneNumberMatch) {

    return (
      `ORD-${standaloneNumberMatch[1]}`
    );

  }

  return null;
}

/* =========================================================
   INTENT DETECTION
========================================================= */

function detectIntent(message) {

  const text =
    String(message || "")
      .toLowerCase()
      .trim();

  /* -------------------------------------------------------
     Cancellation
  ------------------------------------------------------- */

  if (
    text.includes("cancel") ||
    text.includes("cancellation")
  ) {

    return "Order cancellation";

  }

  /* -------------------------------------------------------
     Return / Refund
  ------------------------------------------------------- */

  if (
    text.includes("return") ||
    text.includes("refund")
  ) {

    return "Return or refund request";

  }

  /* -------------------------------------------------------
     Delivery / Tracking
  ------------------------------------------------------- */

  if (
    text.includes("where") ||
    text.includes("track") ||
    text.includes("tracking") ||
    text.includes("delivery") ||
    text.includes("deliver") ||
    text.includes("status") ||
    text.includes("arrive")
  ) {

    return "Order delivery status";

  }

  /* -------------------------------------------------------
     Product
  ------------------------------------------------------- */

  if (
    text.includes("product") ||
    text.includes("serum") ||
    text.includes("sunscreen") ||
    text.includes("face wash") ||
    text.includes("toner")
  ) {

    return "Product information";

  }

  /* -------------------------------------------------------
     Damaged
  ------------------------------------------------------- */

  if (
    text.includes("damaged") ||
    text.includes("defective") ||
    text.includes("broken")
  ) {

    return "Damaged or defective product";

  }

  return "Customer support request";
}

/* =========================================================
   LOCAL CALL SUMMARY
   Does NOT consume Gemini quota.
========================================================= */

function generateLocalSummary(messages) {

  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {

    return {
      customer_intent: "Unknown",
      order_id: null,
      resolution_status: "Unresolved",
      call_summary:
        "No conversation was recorded.",
      action_items: [],
    };

  }

  /* -------------------------------------------------------
     Customer messages
  ------------------------------------------------------- */

  const customerMessages =
    messages
      .filter(
        (message) =>
          message &&
          message.role === "user"
      )
      .map(
        (message) =>
          String(
            message.content || ""
          )
      );

  /* -------------------------------------------------------
     Agent messages
  ------------------------------------------------------- */

  const agentMessages =
    messages
      .filter(
        (message) =>
          message &&
          message.role === "agent"
      )
      .map(
        (message) =>
          String(
            message.content || ""
          )
      );

  /* -------------------------------------------------------
     Complete customer text
  ------------------------------------------------------- */

  const customerText =
    customerMessages
      .join(" ")
      .toLowerCase();

  /* -------------------------------------------------------
     Find order ID
  ------------------------------------------------------- */

  let orderId = null;

  for (
    const message of customerMessages
  ) {

    const detected =
      extractOrderId(message);

    if (detected) {

      orderId =
        detected;

      break;

    }

  }

  /* -------------------------------------------------------
     Detect first meaningful intent
  ------------------------------------------------------- */

  let finalIntent =
    "Customer support request";

  for (
    const message of customerMessages
  ) {

    const detected =
      detectIntent(message);

    if (
      detected !==
      "Customer support request"
    ) {

      finalIntent =
        detected;

      break;

    }

  }

  /* -------------------------------------------------------
     Resolution status
  ------------------------------------------------------- */

  let resolutionStatus =
    "Information Provided";

  if (
    agentMessages.length === 0
  ) {

    resolutionStatus =
      "Unresolved";

  }

  const lastAgentMessage =
    agentMessages.length > 0
      ? agentMessages[
          agentMessages.length - 1
        ].toLowerCase()
      : "";

  /* -------------------------------------------------------
     Unresolved cases
  ------------------------------------------------------- */

  if (
    lastAgentMessage.includes(
      "please provide your order id"
    ) ||
    lastAgentMessage.includes(
      "please provide your order"
    ) ||
    lastAgentMessage.includes(
      "couldn't locate"
    ) ||
    lastAgentMessage.includes(
      "could not locate"
    )
  ) {

    resolutionStatus =
      "Unresolved";

  }

  /* -------------------------------------------------------
     Guardrail response
  ------------------------------------------------------- */

  if (
    lastAgentMessage.includes(
      "can only assist"
    )
  ) {

    resolutionStatus =
      "Information Provided";

  }

  /* -------------------------------------------------------
     Call summary
  ------------------------------------------------------- */

  let callSummary =
    "The customer contacted Aura Skincare for support.";

  if (orderId) {

    const order =
      orders[orderId];

    if (order) {

      callSummary =
        `The customer asked about ` +
        `${finalIntent.toLowerCase()} ` +
        `for order ${orderId}. ` +
        `Aria provided information based on ` +
        `the order details and Aura Skincare policy.`;

    } else {

      callSummary =
        `The customer asked about ` +
        `${finalIntent.toLowerCase()} ` +
        `for order ${orderId}, but the order ` +
        `could not be located.`;

    }

  } else if (
    customerText.includes("order") ||
    customerText.includes("border")
  ) {

    callSummary =
      "The customer asked about an Aura Skincare " +
      "order, but no valid order ID was provided.";

  } else {

    callSummary =
      "The customer contacted Aura Skincare " +
      "for general support.";

  }

  /* -------------------------------------------------------
     Action items
  ------------------------------------------------------- */

  const actionItems = [];

  if (
    lastAgentMessage.includes(
      "please provide your order id"
    ) ||
    lastAgentMessage.includes(
      "please provide your order"
    )
  ) {

    actionItems.push(
      "Customer needs to provide a valid order ID."
    );

  }

  if (
    lastAgentMessage.includes(
      "double-check"
    ) ||
    lastAgentMessage.includes(
      "couldn't locate"
    ) ||
    lastAgentMessage.includes(
      "could not locate"
    )
  ) {

    actionItems.push(
      "Customer should verify the order ID."
    );

  }

  return {

    customer_intent:
      finalIntent,

    order_id:
      orderId,

    resolution_status:
      resolutionStatus,

    call_summary:
      callSummary,

    action_items:
      actionItems,

  };
}

/* =========================================================
   CHAT API
========================================================= */

app.post(
  "/api/chat",
  async (req, res) => {

    try {

      const {
        message,
        history = [],
      } = req.body;

      /* ---------------------------------------------------
         Validate request
      --------------------------------------------------- */

      if (
        !message ||
        typeof message !== "string"
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Message is required.",
        });

      }

      console.log("");
      console.log(
        "========================================"
      );
      console.log(
        "          NEW AI CHAT REQUEST"
      );
      console.log(
        "========================================"
      );

      console.log(
        "Customer:",
        message
      );

      /* ---------------------------------------------------
         Extract order ID
      --------------------------------------------------- */

      const orderId =
        extractOrderId(message);

      let orderData =
        null;

      if (orderId) {

        console.log(
          "Order ID detected:",
          orderId
        );

        orderData =
          orders[orderId] ||
          null;

        if (orderData) {

          console.log(
            "Order found:",
            orderId
          );

        } else {

          console.log(
            "Order not found:",
            orderId
          );

        }

      } else {

        console.log(
          "No order ID detected."
        );

      }

      /* ---------------------------------------------------
         Generate AI / fallback response
      --------------------------------------------------- */

      const reply =
        await generateResponse(
          message,
          orderData,
          history
        );

      console.log(
        "AI reply:",
        reply
      );

      console.log(
        "========================================"
      );

      console.log("");

      res.json({

        success: true,

        reply,

        order:
          orderData,

      });

    } catch (error) {

      console.error("");

      console.error(
        "========================================"
      );

      console.error(
        "             CHAT ERROR"
      );

      console.error(
        "========================================"
      );

      console.error(
        "Message:",
        error.message
      );

      console.error(
        "Name:",
        error.name
      );

      console.error(
        "========================================"
      );

      console.error("");

      res.status(500).json({

        success: false,

        message:
          error.message ||
          "AI service failed.",

      });

    }

  }
);

/* =========================================================
   CALL SUMMARY API
========================================================= */

app.post(
  "/api/summary",
  (req, res) => {

    try {

      const {
        messages,
      } = req.body;

      if (
        !Array.isArray(messages) ||
        messages.length === 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Conversation messages are required.",

        });

      }

      console.log("");

      console.log(
        "========================================"
      );

      console.log(
        "        GENERATING CALL SUMMARY"
      );

      console.log(
        "========================================"
      );

      console.log(
        "Messages received:",
        messages.length
      );

      /* ---------------------------------------------------
         Generate local summary
      --------------------------------------------------- */

      const summary =
        generateLocalSummary(
          messages
        );

      console.log(
        "Structured summary:"
      );

      console.log(
        JSON.stringify(
          summary,
          null,
          2
        )
      );

      console.log(
        "========================================"
      );

      console.log("");

      res.json({

        success: true,

        summary,

      });

    } catch (error) {

      console.error(
        "Summary error:",
        error.message
      );

      res.status(500).json({

        success: false,

        message:
          error.message ||
          "Failed to generate call summary.",

      });

    }

  }
);

/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  () => {

    console.log("");

    console.log(
      "========================================"
    );

    console.log(
      "      AURA SKINCARE AI BACKEND"
    );

    console.log(
      "========================================"
    );

    console.log(
      `Server: http://localhost:${PORT}`
    );

    console.log(
      "Gemini API key loaded:",
      Boolean(
        process.env.GEMINI_API_KEY
      )
    );

    console.log(
      "========================================"
    );

    console.log("");

  }
);