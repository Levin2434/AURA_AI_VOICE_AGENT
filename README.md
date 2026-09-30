# Aura Skincare AI Voice Agent

A browser-based AI voice customer experience agent for Aura Skincare. The agent, **Aria**, talks with customers by voice, looks up orders, applies store policies, and produces a structured post-call summary.

---

## Demo

The application provides a browser-based voice customer support experience where users can speak with Aria, check orders, receive policy-based responses, and view the post-call summary.

**Live Demo:** https://aura-ai-voice-agent-frontend.onrender.com

---

## AI Agent Persona

**Aria** is Aura Skincare's AI customer experience voice agent.

Aria is designed to:

- Communicate naturally with customers
- Provide Aura Skincare support
- Retrieve order information
- Follow defined store policies
- Ask for missing information
- Handle invalid orders gracefully
- Avoid inventing customer or order information

---

## Features

- Voice conversation (browser Speech Recognition + Speech Synthesis)
- Live transcript and call controls
- Order lookup and tracking via `get_order_details(order_id)`
- Cancellation, return, refund, shipping and COD policy handling
- Invalid and missing order ID handling
- Guardrails: stays within Aura Skincare support, never invents order data or claims unperformed actions
- Structured post-call summary (JSON)
- Local deterministic fallback when Gemini is unavailable

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS, Web Speech APIs |
| Backend | Node.js, Express, CORS, dotenv |
| AI | Google Gemini API, prompt-based guardrails, local fallback |
| Tools | VS Code, Git, GitHub, npm |

---

## How It Works

```text
Customer speaks → Speech Recognition → React frontend → POST /api/chat
   → Express backend (Gemini or local fallback + get_order_details)
   → Response text → Speech Synthesis → Aria speaks
```

**Order lookup flow:** extract the order ID from the conversation → call `get_order_details("ORD-101")` → if found, reply with details; if not found, ask the customer to verify; if no ID given, ask for it.

---

## Sample Test Orders

| Order | Customer | Product | Status | Notes |
|---|---|---|---|---|
| ORD-101 | Priya Sharma | Vitamin C Serum (30ml), INR 699 | Out for Delivery | BlueDart, BD-982103, arriving 6 PM today |
| ORD-102 | Rahul Verma | Hydrating Sunscreen SPF 50, INR 499 | Delivered | Delhivery, DL-441029, delivered 14 days ago |
| ORD-103 | Ananya Patel | Green Tea Face Wash + Toner, INR 850 | Processing | Ordered 3 hours ago, cancellable |

---

## Test Cases

| Say this | Expected behavior |
|---|---|
| `Where is my order 101?` | Gives delivery status and expected time |
| `Can I cancel order 103?` | Confirms it is eligible for cancellation |
| `Can I cancel order 101?` | Explains it cannot be cancelled at this stage |
| `I want to return order 102 and get a refund.` | Explains return/refund policy |
| `Where is my order 999?` | Says the order could not be located |
| `Where is my order?` | Asks for the order ID |
| `What product is in order 101?` | Gives the product for ORD-101 |
| `Where is my phone 101?` | Flags request as unrelated to Aura Skincare support |

---

## Post-Call Summary

Generated when the call ends: customer intent, order ID, resolution status, call summary and action items.

```json
{
  "customer_intent": "Order delivery status",
  "order_id": "ORD-101",
  "resolution_status": "Information Provided",
  "call_summary": "Customer asked for the delivery status of order ORD-101. Aria provided the current delivery status and expected delivery time.",
  "action_items": ["No action items"]
}
```

---

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/orders/:orderId` | Order lookup (e.g. `/api/orders/ORD-101`) |
| POST | `/api/chat` | Send a customer message, get Aria's reply |
| POST | `/api/summary` | Generate the post-call summary |

---

## Project Structure

```text
AURA_AI_VOICE_AGENT/
├── backend/
│   ├── data/  routes/  services/  utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/   (AgentStatus, CallControls, CallSummary,
│   │   │                  Header, OrderPanel, Transcript, VoiceAgent)
│   │   ├── App.css  App.jsx  main.jsx
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Local Setup

**Prerequisites:** Node.js, npm, Git

```bash
git clone https://github.com/Levin2434/AURA_AI_VOICE_AGENT.git
cd AURA_AI_VOICE_AGENT
```

**Backend** (runs on `http://localhost:5000`)

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
```

```bash
node server.js
```

**Frontend** (runs on `http://localhost:5173`), in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## Engineering Approach

### 1. What is the overall architecture and why did you choose this tech stack?

The application uses a React + Vite frontend and a Node.js + Express backend.

The browser handles microphone input, speech recognition, the live transcript, call controls, and speech synthesis. The frontend sends customer messages and conversation history to the backend through REST APIs.

The backend handles the AI response flow, order lookup through `get_order_details(order_id)`, policy/guardrail logic, invalid order handling, and post-call summary generation.

Google Gemini is used for AI-generated responses when available, while a deterministic local fallback keeps important order and policy flows functional when the AI service is unavailable.

### 2. What was the hardest part and how did you solve it?

The most challenging part was making the application reliable when external AI services are unavailable or when an order cannot be found.

I solved this by separating order lookup from the AI response, validating and normalizing order IDs, adding explicit policy rules, handling invalid and missing order IDs, and implementing deterministic fallback responses.

The deployment stage also required separate production API URLs for the chat and summary endpoints so the public frontend did not attempt to call `localhost`.

### 3. If you had one more week, what would you improve?

I would improve the voice experience by moving from browser speech recognition and speech synthesis to a lower-latency streaming speech-to-speech architecture.

I would also add authenticated customer/order access, a real order-management API, human-agent handoff, multilingual support, better conversation persistence, automated tests, and production monitoring.

### 4. How would you scale this to 1,000+ calls per day?

I would deploy the frontend and backend as independently scalable services behind HTTPS and a load balancer.

The backend would use stateless API instances so multiple instances could handle concurrent calls. Order data would come from a secure production order-management service, while logging and monitoring would be added for reliability and debugging.

For higher traffic, I would add rate limiting, caching where appropriate, asynchronous processing for non-real-time tasks, centralized observability, and appropriate AI provider capacity/quotas.

---

## Security

- API keys live in environment variables; `.env` is excluded via `.gitignore`.
- Never commit your real `backend/.env`. Commit `.env.example` only.
- Use HTTPS and proper authentication in production, and expose only necessary customer data.

---

## Repository

[View the GitHub Repository](https://github.com/Levin2434/AURA_AI_VOICE_AGENT)

## License

Created as an assessment project to demonstrate an AI-powered customer experience voice agent.
