const express = require("express");
const cors = require("cors");
require("dotenv").config();

const {
  generateResponse,
} = require("./services/aiService");


/* =========================================================
   APP SETUP
========================================================= */

const app = express();

const PORT =
  process.env.PORT || 5000;

app.use(cors());

app.use(express.json());


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
   HOME / HEALTH CHECK
========================================================= */

app.get("/", (req, res) => {

  res.json({

    success: true,

    message:
      "Aura Skincare AI backend is running",

  });

});


/* =========================================================
   NORMALIZE ORDER ID
========================================================= */

function normalizeOrderId(value) {

  if (
    value === null ||
    value === undefined
  ) {

    return null;

  }


  let text =
    String(value)
      .trim()
      .toUpperCase();


  /*
    Remove common spoken prefixes.
  */

  text = text
    .replace(/^ORDER\s+NUMBER\s*/i, "")
    .replace(/^ORDER\s*/i, "")
    .replace(/^ORD[\s-]*/i, "")
    .trim();


  /*
    101 -> ORD-101
  */

  if (/^\d{3}$/.test(text)) {

    return `ORD-${text}`;

  }


  /*
    ORD101 -> ORD-101
  */

  const standardMatch =
    text.match(/^(\d{3})$/);

  if (standardMatch) {

    return `ORD-${standardMatch[1]}`;

  }


  /*
    ORD-101
    ORD 101
    ORD101
  */

  const ordMatch =
    text.match(/^ORD[-\s]?(\d{3})$/i);

  if (ordMatch) {

    return `ORD-${ordMatch[1]}`;

  }


  return null;

}


/* =========================================================
   GET ORDER DETAILS TOOL
========================================================= */

function get_order_details(order_id) {

  const orderId =
    normalizeOrderId(order_id);


  if (!orderId) {

    return null;

  }


  return orders[orderId] || null;

}


/* =========================================================
   GET ORDER DETAILS API
========================================================= */

app.get(
  "/api/orders/:orderId",
  (req, res) => {

    try {

      const orderId =
        normalizeOrderId(
          req.params.orderId
        );


      const order =
        get_order_details(orderId);


      if (!order) {

        return res.status(404).json({

          success: false,

          message:
            `Order ${orderId || req.params.orderId} was not found.`,

          order_id:
            orderId,

        });

      }


      res.json({

        success: true,

        order,

      });

    } catch (error) {

      console.error(
        "Order lookup error:",
        error
      );


      res.status(500).json({

        success: false,

        message:
          "Unable to retrieve order details.",

      });

    }

  }
);


/* =========================================================
   EXTRACT ORDER ID FROM CUSTOMER MESSAGE
========================================================= */

function extractOrderId(
  message,
  history = []
) {

  if (
    !message ||
    typeof message !== "string"
  ) {

    return null;

  }


  const text =
    message.trim();


  /* -------------------------------------------------------
     1. Standard formats

     ORD-101
     ORD 101
     ORD101
  ------------------------------------------------------- */

  const standardMatch =
    text.match(
      /\bORD[\s-]?(\d{3})\b/i
    );


  if (standardMatch) {

    return `ORD-${standardMatch[1]}`;

  }


  /* -------------------------------------------------------
     2. Spoken formats

     order 101
     order number 101
     order is 101
     my order 101
     my order is 101
  ------------------------------------------------------- */

  const spokenOrderMatch =
    text.match(
      /\b(?:my\s+)?order(?:\s+number)?(?:\s+is)?\s+(\d{3})\b/i
    );


  if (spokenOrderMatch) {

    return `ORD-${spokenOrderMatch[1]}`;

  }


  /* -------------------------------------------------------
     3. Speech recognition may hear "border"

     Example:
     "where is my border 101"

     Treat it as order 101.
  ------------------------------------------------------- */

  const spokenBorderMatch =
    text.match(
      /\bborder(?:\s+number)?(?:\s+is)?\s+(\d{3})\b/i
    );


  if (spokenBorderMatch) {

    return `ORD-${spokenBorderMatch[1]}`;

  }


  /* -------------------------------------------------------
     4. Message is ONLY a number

     Example:

     Aria:
     "Could you provide your order ID?"

     User:
     "101"

     -> ORD-101
  ------------------------------------------------------- */

  const onlyNumberMatch =
    text.match(
      /^(\d{3})$/
    );


  if (onlyNumberMatch) {

    return `ORD-${onlyNumberMatch[1]}`;

  }


  /* -------------------------------------------------------
     5. Search recent history

     Helps when the conversation is:

     User:
     "Where is my order?"

     Aria:
     "Please provide your order ID."

     User:
     "101"
  ------------------------------------------------------- */

  if (Array.isArray(history)) {

    const recentMessages =
      history.slice(-6);


    const lastAgentAskedForOrder =
      recentMessages.some(
        (item) => {

          if (
            !item ||
            item.role !== "model" ||
            !Array.isArray(item.parts)
          ) {

            return false;

          }


          const content =
            item.parts
              .map(
                (part) =>
                  part?.text || ""
              )
              .join(" ")
              .toLowerCase();


          return (
            content.includes(
              "order id"
            ) ||
            content.includes(
              "order number"
            ) ||
            content.includes(
              "provide your order"
            ) ||
            content.includes(
              "order number"
            )
          );

        }
      );


    if (
      lastAgentAskedForOrder
    ) {

      const historyNumber =
        text.match(
          /^(\d{3})$/
        );


      if (historyNumber) {

        return `ORD-${historyNumber[1]}`;

      }

    }

  }


  return null;

}


/* =========================================================
   INTENT DETECTION
========================================================= */

function detectIntent(
  messages
) {

  const customerText =
    messages
      .filter(
        (message) =>
          message.role === "user"
      )
      .map(
        (message) =>
          message.content || ""
      )
      .join(" ")
      .toLowerCase();


  if (
    customerText.includes("cancel") ||
    customerText.includes("cancellation")
  ) {

    return "Cancellation Request";

  }


  if (
    customerText.includes("return") ||
    customerText.includes("refund")
  ) {

    return "Return / Refund Request";

  }


  if (
    customerText.includes("where") ||
    customerText.includes("track") ||
    customerText.includes("tracking") ||
    customerText.includes("delivery") ||
    customerText.includes("deliver") ||
    customerText.includes("status")
  ) {

    return "Order delivery status";

  }


  if (
    customerText.includes("product") ||
    customerText.includes("serum") ||
    customerText.includes("sunscreen") ||
    customerText.includes("face wash") ||
    customerText.includes("toner")
  ) {

    return "Product information";

  }


  return "Customer Support";

}


/* =========================================================
   EXTRACT ORDER ID FROM CONVERSATION
========================================================= */

function extractOrderFromConversation(
  messages
) {

  if (
    !Array.isArray(messages)
  ) {

    return null;

  }


  /*
    Search newest user messages first.
  */

  for (
    let i = messages.length - 1;
    i >= 0;
    i--
  ) {

    const message =
      messages[i];


    if (
      message.role !== "user"
    ) {

      continue;

    }


    const orderId =
      extractOrderId(
        message.content,
        []
      );


    if (orderId) {

      return orderId;

    }

  }


  return null;

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
         Find order ID
      --------------------------------------------------- */

      const orderId =
        extractOrderId(
          message,
          history
        );


      let orderData =
        null;


      if (orderId) {

        console.log(
          "Order ID detected:",
          orderId
        );


        /*
          IMPORTANT:

          Always use the required
          get_order_details(order_id) tool.
        */

        orderData =
          get_order_details(
            orderId
          );


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


      console.log(
        "Gemini API key loaded:",
        Boolean(
          process.env.GEMINI_API_KEY
        )
      );


      /* ===================================================
         INVALID ORDER HANDLING

         IMPORTANT:

         If an order ID was detected but the order
         does not exist, DO NOT send undefined order
         data to the AI.

         Return a deterministic response instead.
      =================================================== */

      if (
        orderId &&
        !orderData
      ) {

        const invalidOrderReply =
          `I'm sorry, I couldn't find order ${orderId}. ` +
          `Please verify the order ID and try again.`;


        console.log(
          "Invalid order response:",
          invalidOrderReply
        );


        console.log(
          "========================================"
        );

        console.log("");


        return res.json({

          success: true,

          reply:
            invalidOrderReply,

          response:
            invalidOrderReply,

          order_id:
            orderId,

          order:
            null,

        });

      }


      /* ---------------------------------------------------
         Generate AI response
      --------------------------------------------------- */

      const reply =
        await generateResponse(
          message,
          orderData,
          history
        );


      /*
        Protect against an empty AI response.
      */

      const safeReply =
        reply ||
        "I'm sorry, I wasn't able to generate a response. Please try again.";


      console.log(
        "AI reply:",
        safeReply
      );


      console.log(
        "========================================"
      );

      console.log("");


      res.json({

        success: true,

        /*
          Keep reply for current frontend.
        */

        reply:
          safeReply,

        /*
          Also return response so the frontend
          can support both formats.
        */

        response:
          safeReply,

        order_id:
          orderId,

        order:
          orderData,

      });


    } catch (error) {

      console.error("");

      console.error(
        "========================================"
      );

      console.error(
        "          CHAT ERROR"
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
   LOCAL CALL SUMMARY
   Does NOT use Gemini.
========================================================= */

app.post(
  "/api/summary",
  async (req, res) => {

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
        "        GENERATING LOCAL SUMMARY"
      );

      console.log(
        "========================================"
      );


      console.log(
        "Messages received:",
        messages.length
      );


      /* ---------------------------------------------------
         Intent
      --------------------------------------------------- */

      const customerIntent =
        detectIntent(
          messages
        );


      /* ---------------------------------------------------
         Order ID
      --------------------------------------------------- */

      const orderId =
        extractOrderFromConversation(
          messages
        );


      /* ---------------------------------------------------
         Find order using tool
      --------------------------------------------------- */

      const orderData =
        orderId
          ? get_order_details(
              orderId
            )
          : null;


      /* ---------------------------------------------------
         Get last agent response
      --------------------------------------------------- */

      const agentMessages =
        messages.filter(
          (message) =>
            message.role === "agent"
        );


      const lastAgentMessage =
        agentMessages.length > 0
          ? (
              agentMessages[
                agentMessages.length - 1
              ].content || ""
            )
          : "";


      /* ---------------------------------------------------
         Resolution status
      --------------------------------------------------- */

      let resolutionStatus =
        "Information Provided";


      const lowerAgentMessage =
        lastAgentMessage.toLowerCase();


      if (
        !lastAgentMessage
      ) {

        resolutionStatus =
          "Unresolved";

      }

      else if (
        lowerAgentMessage.includes(
          "couldn't find order"
        ) ||
        lowerAgentMessage.includes(
          "could not find order"
        ) ||
        lowerAgentMessage.includes(
          "couldn't locate"
        ) ||
        lowerAgentMessage.includes(
          "could not locate"
        ) ||
        lowerAgentMessage.includes(
          "unable to"
        ) ||
        lowerAgentMessage.includes(
          "trouble connecting"
        )
      ) {

        resolutionStatus =
          "Unresolved";

      }

      else if (
        customerIntent ===
          "Cancellation Request"
      ) {

        if (
          !orderData
        ) {

          resolutionStatus =
            "Order Not Found";

        }

        else if (
          orderData.cancellation_eligible
        ) {

          resolutionStatus =
            "Cancellation Eligible";

        }

        else {

          resolutionStatus =
            "Cancellation Not Allowed";

        }

      }

      else if (
        customerIntent ===
          "Return / Refund Request"
      ) {

        if (
          !orderData
        ) {

          resolutionStatus =
            "Order Not Found";

        }

        else {

          resolutionStatus =
            "Return Policy Explained";

        }

      }

      else if (
        orderData
      ) {

        resolutionStatus =
          "Information Provided";

      }

      else {

        resolutionStatus =
          "Information Provided";

      }


      /* ---------------------------------------------------
         Summary text
      --------------------------------------------------- */

      let callSummary;


      if (
        orderData
      ) {

        callSummary =
          `The customer asked about ${orderId}. ` +
          `Aria provided information based on ` +
          `the available order details and Aura Skincare policy.`;

      }

      else if (
        orderId
      ) {

        callSummary =
          `The customer asked about ${orderId}, ` +
          `but the order could not be located ` +
          `in the test order system.`;

      }

      else {

        callSummary =
          `The customer contacted Aria regarding ` +
          `${customerIntent.toLowerCase()}. ` +
          `Aria provided the available customer support information.`;

      }


      /* ---------------------------------------------------
         Action items

         We do not claim that an actual cancellation,
         refund or return was processed because those
         actions are not implemented.
      --------------------------------------------------- */

      const actionItems = [
        "No action items",
      ];


      /* ---------------------------------------------------
         Final structured summary
      --------------------------------------------------- */

      const summary = {

        customer_intent:
          customerIntent,

        order_id:
          orderId || null,

        resolution_status:
          resolutionStatus,

        call_summary:
          callSummary,

        action_items:
          actionItems,

      };


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
        error
      );


      res.status(500).json({

        success: false,

        message:
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