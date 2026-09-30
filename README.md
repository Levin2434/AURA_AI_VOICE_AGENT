# Aura Skincare AI Voice Agent

A browser-based AI voice customer experience agent for Aura Skincare. The agent, **Aria**, talks with customers by voice, looks up orders, applies store policies, handles edge cases, and produces a structured post-call summary.

## Demo

| Item                  | Link                                                |
| --------------------- | --------------------------------------------------- |
| **Live Application**  | <https://aura-ai-voice-agent-frontend.onrender.com> |
| **Demo Video**        | <https://tinyurl.com/ys4bfs8h>                      |
| **GitHub Repository** | <https://github.com/Levin2434/AURA_AI_VOICE_AGENT>  |
| **LinkedIn**          | <https://www.linkedin.com/in/levin-nadar>           |

## Short Approach Note

The application combines browser-native voice capabilities with a React frontend and Node.js backend to provide a voice-based Aura Skincare customer support experience. The backend separates order lookup and policy-sensitive business rules from conversational AI generation, while deterministic fallbacks provide reliable handling of important scenarios when the external AI service is unavailable.

## Features

- Browser-based voice conversation (Speech Recognition + Speech Synthesis)
- Live transcript, call controls, agent state indicator, and Test Orders helper
- Order lookup and tracking via `get_order_details(order_id)`
- Cancellation, return/refund, shipping, and COD policy handling
- Graceful handling of invalid, missing, and out-of-scope requests
- Guardrails against fabricated order information
- Structured JSON post-call summary with action items
- Deterministic local fallback when Gemini is unavailable

## Aura Skincare Policies

- **Shipping:** Free delivery above ₹499; ₹50 fee below ₹499; standard delivery in 3–5 business days.
- **Returns:** Accepted within 7 days of delivery for unopened, unused products in original packaging.
- **Damaged or defective:** Report within 48 hours of delivery with photos for a replacement.
- **Cancellation:** Only while the status is `Processing`. Shipped or Out for Delivery orders cannot be cancelled, but customers may refuse delivery at the doorstep.
- **Cash on Delivery:** Available up to ₹2,500, payable by cash or UPI at the doorstep.

## Sample Test Orders

| Order ID | Customer     | Product                     | Value | Status           | Notes                                       |
| -------- | ------------ | --------------------------- | ----: | ---------------- | ------------------------------------------- |
| ORD-101  | Priya Sharma | Vitamin C Serum (30ml)      |  ₹699 | Out for Delivery | BlueDart, BD-982103, arriving 6 PM today    |
| ORD-102  | Rahul Verma  | Hydrating Sunscreen SPF 50  |  ₹499 | Delivered        | Delhivery, DL-441029, delivered 14 days ago |
| ORD-103  | Ananya Patel | Green Tea Face Wash + Toner |  ₹850 | Processing       | Ordered 3 hours ago, cancellable            |

## How It Works

```text
Customer speaks
      ↓
Browser Speech Recognition
      ↓
React + Vite Frontend  ──  POST /api/chat
      ↓
Node.js + Express Backend
      ↓
Order Lookup + Policy Rules + Gemini / Local Fallback
      ↓
Browser Speech Synthesis  →  Aria speaks to the customer
```

The backend normalizes the order ID from the customer's request (for example, "order 101" becomes `ORD-101`) and calls `get_order_details("ORD-101")`. If the order does not exist, Aria asks the customer to verify the ID. If no ID is given, Aria asks for it instead of guessing.

## Test Cases

| Customer Request                             | Expected Behavior                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| Where is my order 101?                       | Gives delivery status and expected delivery time                         |
| Can I cancel order 103?                      | Confirms that ORD-103 is eligible for cancellation                       |
| Can I cancel order 101?                      | Explains that ORD-101 cannot be cancelled because it is Out for Delivery |
| I want to return order 102 and get a refund. | Explains the applicable return/refund policy                             |
| Where is my order 999?                       | Says the order could not be located                                      |
| Where is my order?                           | Asks for the order ID                                                    |
| What product is in order 101?                | Gives the product for ORD-101                                            |
| Where is my phone 101?                       | Explains that the request is outside Aura Skincare support               |

## Post-Call Summary

When the call ends, the app shows the full transcript and a structured summary:

```json
{
  "customer_intent": "Order delivery status",
  "order_id": "ORD-101",
  "resolution_status": "Information Provided",
  "call_summary": "Customer asked for the delivery status of order ORD-101. Aria provided the current status and expected delivery time.",
  "action_items": ["No action items"]
}
```

## API Endpoints

| Method | Endpoint               | Purpose                                          |
| ------ | ---------------------- | ------------------------------------------------ |
| GET    | `/`                    | Backend health check                             |
| GET    | `/api/orders/:orderId` | Order lookup (e.g. `/api/orders/ORD-101`)        |
| POST   | `/api/chat`            | Send a customer message and receive Aria's reply |
| POST   | `/api/summary`         | Generate the post-call structured summary        |

## Project Structure

```text
AURA_AI_VOICE_AGENT/
├── backend/
│   ├── data/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/   # AgentStatus, CallControls, CallSummary,
│   │   │                 # Header, OrderPanel, Transcript, VoiceAgent
│   │   ├── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Local Setup

**Prerequisites:** Node.js, npm, Git.

```bash
git clone https://github.com/Levin2434/AURA_AI_VOICE_AGENT.git
cd AURA_AI_VOICE_AGENT
```

**Backend** (runs on `http://localhost:5000`):

```bash
cd backend
npm install
```

Create `backend/.env` using `backend/.env.example` as a template:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

```bash
node server.js
```

**Frontend** (open a second terminal; runs on `http://localhost:5173`):

```bash
cd frontend
npm install
npm run dev
```

## Engineering Approach

### 1. Why did you choose this architecture and technology stack?

I used a React + Vite frontend and a Node.js + Express backend. The browser handles microphone input, speech recognition, the live transcript, call controls, and speech synthesis, and talks to the backend over REST. The backend handles order lookup through `get_order_details(order_id)`, policy and guardrail logic, invalid-order handling, and summary generation. Google Gemini generates responses when available, while a deterministic local fallback keeps order and policy flows working when it is not.

### 2. What was the most difficult part and how did you solve it?

Making the app reliable when the external AI service is unavailable or an order cannot be found. I separated order lookup from AI response generation, normalized and validated order IDs, added explicit policy rules, handled invalid and missing IDs, and implemented deterministic fallbacks. Deployment also required separate production API URLs so the public frontend did not call localhost.

### 3. If you had one more week, what would you improve first and why?

The voice experience: I would move from browser speech recognition and synthesis to a lower-latency streaming speech-to-speech architecture. After that, I would add authenticated order access, a real order-management API, human-agent handoff, multilingual support, conversation persistence, automated tests, and monitoring.

### 4. How would you scale this to 1,000+ customer conversations per day?

I would deploy the frontend and backend as independently scalable services behind HTTPS and a load balancer, using stateless backend instances to handle concurrent calls. Order data would come from a secure production order-management service. I would add rate limiting, caching, asynchronous processing for non-real-time tasks, centralized logging and monitoring, and sufficient AI provider quota.

## Security

- API keys live in environment variables; `.env` is excluded via `.gitignore` and must never be committed.
- `.env.example` is committed as a template only.
- API keys are never exposed to the frontend, and production runs over HTTPS.
- A production version should add authentication, authorization, and data-protection controls.

## License

Created as an assessment project to demonstrate an AI-powered customer experience voice agent.
