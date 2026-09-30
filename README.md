# Aura Skincare AI Voice Agent

A browser-based AI voice customer experience agent for Aura Skincare. The agent, **Aria**, talks with customers by voice, looks up orders, applies store policies, handles edge cases, and produces a structured post-call summary.

---

## Demo

The application provides a browser-based voice customer support experience where users can speak with Aria, check orders, receive policy-based responses, and view the post-call transcript and structured summary.

| Item | Link |
|---|---|
| **Live Application** | [aura-ai-voice-agent-frontend.onrender.com](https://aura-ai-voice-agent-frontend.onrender.com) |
| **Demo Video** | [tinyurl.com/ys4bfs8h](https://tinyurl.com/ys4bfs8h) |
| **GitHub Repository** | [Levin2434/AURA_AI_VOICE_AGENT](https://github.com/Levin2434/AURA_AI_VOICE_AGENT) |
| **LinkedIn** | [linkedin.com/in/levin-nadar](https://www.linkedin.com/in/levin-nadar) |

---

## Short Approach Note

The application combines browser-native voice capabilities with a React frontend and Node.js backend to provide a voice-based Aura Skincare customer support experience. The backend separates order lookup and policy-sensitive business rules from conversational AI generation, while deterministic fallbacks provide reliable handling for important supported scenarios when the external AI service is unavailable.

---

## AI Agent Persona

**Aria** is Aura Skincare's AI customer experience voice agent.

Aria is designed to:

- Communicate naturally with customers
- Provide Aura Skincare customer support
- Retrieve order information
- Follow defined store policies
- Ask for missing information
- Handle invalid orders gracefully
- Avoid inventing customer or order information
- Stay within Aura Skincare support boundaries

---

## Features

- Browser-based voice conversation
- Microphone input using browser Speech Recognition
- Spoken responses using browser Speech Synthesis
- Live transcript and call controls
- Live agent state indicator
- Test Orders helper
- Order lookup and tracking via `get_order_details(order_id)`
- Cancellation policy enforcement
- Return and refund policy handling
- Shipping and COD policy handling
- Invalid and missing order ID handling
- Out-of-scope request handling
- Guardrails against fabricated order information
- Structured post-call summary in JSON
- Action items field
- Deterministic local fallback when Gemini is unavailable

---

## Aura Skincare Policies

The application follows the policies provided in the assessment.

### Shipping Policy

- Free delivery on orders above ₹499.
- Orders below ₹499 have a ₹50 shipping fee.
- Standard delivery takes 3–5 business days.

### Return & Refund Policy

Returns are accepted within 7 days of delivery for:

- Unopened products
- Unused products
- Products in original packaging

### Damaged or Defective Products

Damaged or defective products must be reported within 48 hours of delivery with photos for replacement.

### Cancellation Policy

Orders can be cancelled only while their status is `Processing`.

Once an order is **Shipped** or **Out for Delivery**, it cannot be cancelled. Customers may refuse delivery at the doorstep.

### Cash on Delivery (COD)

- COD is available for orders up to ₹2,500.
- Customers can pay by cash or UPI at the doorstep.

---

## Sample Test Orders

| Order ID | Customer | Product | Value | Status | Notes |
|---|---|---|---:|---|---|
| ORD-101 | Priya Sharma | Vitamin C Serum (30ml) | ₹699 | Out for Delivery | BlueDart, BD-982103, arriving 6 PM today |
| ORD-102 | Rahul Verma | Hydrating Sunscreen SPF 50 | ₹499 | Delivered | Delhivery, DL-441029, delivered 14 days ago |
| ORD-103 | Ananya Patel | Green Tea Face Wash + Toner | ₹850 | Processing | Ordered 3 hours ago, cancellable |

---

## How It Works

```text
Customer speaks
      ↓
Browser Speech Recognition
      ↓
React + Vite Frontend
      ↓
POST /api/chat
      ↓
Node.js + Express Backend
      ↓
Order Lookup + Policy Rules + Gemini / Local Fallback
      ↓
Response Text
      ↓
Browser Speech Synthesis
      ↓
Aria speaks to the customer
```

### Order Lookup Flow

The application extracts the order ID from the customer's request and uses:

```js
get_order_details(order_id)
```

Example:

```text
Customer: "Where is my order 101?"
        ↓
Order ID normalized: ORD-101
        ↓
get_order_details("ORD-101")
        ↓
Order found
        ↓
Aria provides the available order information
```

- If the order does not exist, Aria asks the customer to verify the order ID.
- If no order ID is provided, Aria asks the customer for the missing order ID instead of guessing.

---

## Test Cases

| Customer Request | Expected Behavior |
|---|---|
| Where is my order 101? | Gives delivery status and expected delivery time |
| Can I cancel order 103? | Confirms that ORD-103 is eligible for cancellation |
| Can I cancel order 101? | Explains that ORD-101 cannot be cancelled because it is Out for Delivery |
| I want to return order 102 and get a refund. | Explains the applicable return/refund policy |
| Where is my order 999? | Says the order could not be located |
| Where is my order? | Asks for the order ID |
| What product is in order 101? | Gives the product for ORD-101 |
| Where is my phone 101? | Explains that the request is outside Aura Skincare support |

---

## Post-Call Summary

When the call ends, the application generates a structured summary containing:

- Customer intent
- Order ID
- Resolution status
- Call summary
- Action items

Example:

```json
{
  "customer_intent": "Order delivery status",
  "order_id": "ORD-101",
  "resolution_status": "Information Provided",
  "call_summary": "Customer asked for the delivery status of order ORD-101. Aria provided the current delivery status and expected delivery time.",
  "action_items": [
    "No action items"
  ]
}
```

The application also displays the chronological conversation transcript after the call.

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Backend health check |
| GET | `/api/orders/:orderId` | Order lookup |
| POST | `/api/chat` | Send a customer message and receive Aria's reply |
| POST | `/api/summary` | Generate the post-call structured summary |

Example order lookup:

```http
GET /api/orders/ORD-101
```

---

## Project Structure

```text
AURA_AI_VOICE_AGENT/
│
├── backend/
│   ├── data/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── AgentStatus.jsx
│   │   │   ├── CallControls.jsx
│   │   │   ├── CallSummary.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── OrderPanel.jsx
│   │   │   ├── Transcript.jsx
│   │   │   └── VoiceAgent.jsx
│   │   ├── App.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js
- npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Levin2434/AURA_AI_VOICE_AGENT.git
cd AURA_AI_VOICE_AGENT
```

### 2. Backend

The backend runs on `http://localhost:5000`.

```bash
cd backend
npm install
```

Create a file named `backend/.env` (use `backend/.env.example` as a template) and add:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

Start the backend:

```bash
node server.js
```

### 3. Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server runs on `http://localhost:5173`.

---

## Environment Variables

`backend/.env.example`:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

---

## Engineering Approach

### 1. Why did you choose this architecture and technology stack?

The application uses a React + Vite frontend and a Node.js + Express backend.

The browser handles microphone input, speech recognition, the live transcript, call controls, and speech synthesis. The frontend communicates with the backend through REST APIs.

The backend handles the AI response flow, order lookup through `get_order_details(order_id)`, policy and guardrail logic, invalid order handling, and post-call summary generation.

Google Gemini is used for AI-generated responses when available, while a deterministic local fallback keeps important order and policy flows functional when the external AI service is unavailable.

### 2. What was the most difficult part and how did you solve it?

The most challenging part was making the application reliable when external AI services are unavailable or when an order cannot be found.

I solved this by separating order lookup from AI response generation, validating and normalizing order IDs, adding explicit policy rules, handling invalid and missing order IDs, and implementing deterministic fallback responses.

The deployment stage also required separate production API URLs for the chat and summary endpoints so the public frontend did not attempt to call localhost.

### 3. If you had one more week, what would you improve first and why?

I would first improve the voice experience by moving from browser speech recognition and speech synthesis to a lower-latency streaming speech-to-speech architecture.

I would also add authenticated customer/order access, a real order-management API, human-agent handoff, multilingual support, better conversation persistence, automated tests, and production monitoring.

### 4. How would you scale this to 1,000+ customer conversations per day?

I would deploy the frontend and backend as independently scalable services behind HTTPS and a load balancer.

The backend would use stateless API instances so multiple instances could handle concurrent calls. Order data would come from a secure production order-management service, while logging and monitoring would be added for reliability and debugging.

For higher traffic, I would add rate limiting, caching where appropriate, asynchronous processing for non-real-time tasks, centralized observability, and appropriate AI provider capacity and quotas.

---

## Security

- API keys are stored in environment variables.
- `.env` is excluded through `.gitignore`.
- The real `backend/.env` file must never be committed.
- `.env.example` can be committed as a template.
- API keys are never exposed to the frontend.
- Production deployments use HTTPS.
- A production implementation should add authentication, authorization, appropriate data protection, and access controls.

---

## Links

- **GitHub:** https://github.com/Levin2434/AURA_AI_VOICE_AGENT
- **Live Application:** https://aura-ai-voice-agent-frontend.onrender.com
- **Demo Video:** https://tinyurl.com/ys4bfs8h
- **LinkedIn:** https://www.linkedin.com/in/levin-nadar

---

## License

Created as an assessment project to demonstrate an AI-powered customer experience voice agent.
