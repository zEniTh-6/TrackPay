# TrackPay

Smart payment and expense tracking.

---

## Overview

TrackPay is a full-stack mobile application that combines 
seamless UPI payments with intelligent expense tracking. 
Users can make payments, scan QR codes, and instantly see 
categorized spending insights — all without manual entry.

The app uses a rule-based auto-categorization engine that 
learns from user behavior over time, automatically assigning 
categories to future transactions from the same merchant.

---

## Key Features

**Payments**
- Make payments via Razorpay checkout
- Scan UPI QR codes to auto-fill receiver details
- Support for UPI, Cards and Netbanking

**Expense Tracking**
- Automatic transaction capture via Razorpay webhooks
- Rule-based merchant categorization
- Learns and remembers user-defined categories
- Custom category creation for unknown merchants

**Insights**
- Monthly and weekly spending trends
- Category-wise donut chart breakdown
- Smart insight cards highlighting top spending areas
- Daily average and peak spending stats

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Bare Workflow) |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Payments | Razorpay |
| HTTP Client | Axios |

---

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local)
- Android device or emulator
- Razorpay account (test mode)
- ngrok

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
```

Fill in your `.env` file:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/trackpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Start the backend:
```bash
node src/index.js
```

### 2. Webhook Setup
```bash
ngrok http 5000
```

Add the ngrok URL to Razorpay dashboard:
```
Settings → Webhooks → Add New Webhook
URL: https://your-ngrok-url/api/webhook
Event: payment.captured
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npx react-native run-android
```

### 4. Startup Order

Every time you develop, start in this order:
```
1. net start MongoDB
2. node src/index.js       (backend)
3. ngrok http 5000         (webhook tunnel)
4. npx react-native run-android  (app)
```

---

## Environment Variables

| Variable | Description |
|---|---|
| PORT | Backend server port (default 5000) |
| MONGODB_URI | MongoDB connection string |
| RAZORPAY_KEY_ID | Razorpay API key ID |
| RAZORPAY_KEY_SECRET | Razorpay API secret |
| RAZORPAY_WEBHOOK_SECRET | Webhook signature secret |

---

## License

This project is licensed under the MIT License.

---

<p align="center">Built with React Native · Node.js · MongoDB · Razorpay</p>