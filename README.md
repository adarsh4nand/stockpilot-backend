# 🚀 StockPilot – E-Commerce & Inventory Management API

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)

> **⚠️ Academic Note:** This is an **individual** Backend Development capstone project. All business rules, security validations, price calculations, and permissions are strictly enforced on the backend to ensure data integrity.

## 📋 Overview
StockPilot is a robust, production-grade RESTful API designed for multi-vendor e-commerce and inventory management. It goes beyond basic CRUD operations by implementing **atomic stock control** to prevent race conditions, **Role-Based Access Control (RBAC)** for secure multi-tenant operations, **MongoDB aggregation pipelines** for real-time analytics, and **Socket.IO** for decoupled, real-time event notifications.

## ✨ Key Features
- 🔐 **Secure Authentication:** JWT-based auth with Access/Refresh token rotation and HttpOnly cookies.
- 🛡️ **Role-Based Access Control (RBAC):** Strict middleware enforcing `admin`, `seller`, and `customer` permissions.
- 🛒 **Smart Cart & Checkout:** Server-side total calculation and **atomic database operations** (`$inc` with `$gte`) to guarantee zero overselling.
- 📊 **Advanced Analytics:** 5+ MongoDB aggregation pipelines for sales summaries, best-selling products, and inventory health.
- ⚡ **Real-Time Notifications:** Decoupled `EventEmitter` bridging to `Socket.IO` for instant low-stock alerts and order status updates.
- 🧹 **Centralized Error Handling:** Global error middleware mapping Mongoose validation, cast, and duplicate key errors to standard HTTP status codes.

## 🛠️ Tech Stack
| Category | Technologies |
| :--- | :--- |
| **Runtime & Framework** | Node.js, Express.js |
| **Database & ODM** | MongoDB, Mongoose |
| **Security** | `bcryptjs`, `jsonwebtoken`, `helmet`, `cors`, `cookie-parser` |
| **Real-Time** | `socket.io`, Node.js `EventEmitter` |
| **DevOps & Testing** | `nodemon`, `morgan`, Postman |

## 📂 Project Structure
Built using the **MVC (Model-View-Controller)** architecture for scalability and separation of concerns.
```text
stockpilot-backend/
├── src/
│   ├── config/         # Database connection setup
│   ├── controllers/    # Business logic and request handling
│   ├── models/         # Mongoose schemas and validation rules
│   ├── routes/         # Express route definitions
│   ├── middleware/     # Auth, RBAC, and global error handlers
│   ├── services/       # Complex business logic (e.g., inventory)
│   ├── events/         # Node.js EventEmitter instance
│   ├── sockets/        # Socket.IO initialization and event listeners
│   ├── utils/          # Custom ApiError, ApiResponse, asyncHandler
│   ├── seed/           # Database seeding scripts
│   ├── app.js          # Express app configuration
│   └── server.js       # Entry point (HTTP server + Socket.IO)
├── postman/            # Exported Postman collection for testing
├── .env.example        # Environment variable template
└── package.json
```

## ⚡ Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or via MongoDB Atlas)

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/stockpilot-backend.git
cd stockpilot-backend

# Install dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory and configure it based on `.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/stockpilot
JWT_ACCESS_SECRET=your_super_secret_access_key
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:5173
```

### 4. Seed the Database
Populate the database with demo users, categories, and products for immediate testing:
```bash
npm run seed
```

### 5. Start the Server
```bash
npm run dev
```
  The server will start on http://localhost:5000.

## 🔑 Demo Credentials
Use these credentials to test different RBAC flows via the Postman collection:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@stockpilot.dev` | `Password123` | Full system access, category management, reports |
| **Seller** | `seller1@test.com` | `Password123` | Manage own products, view own orders, receive stock alerts |
| **Customer**| `customer1@test.com` | `Password123` | Browse catalog, manage cart, place/cancel orders |

## 🧪 API Testing & Documentation
This project includes a comprehensive **Postman Collection** featuring positive flows, negative test cases (401/403/409), and automated test scripts.

1. Import `postman/StockPilot.postman_collection.json` into Postman.
2. Set the collection variable `baseUrl` to `http://localhost:5000/api/v1`.
3. Run the `01 - Auth` folder first to populate the token variables (`adminToken`, `sellerToken`, `customerToken`).
4. Use the **Collection Runner** to execute all tests and verify rubric compliance.

## 📈 Rubric Alignment (Academic)
| Requirement | Implementation Location |
| :--- | :--- |
| **MVC & REST API** | `src/controllers`, `src/routes`, `src/models` |
| **Auth & RBAC** | `src/middleware/auth.middleware.js`, `role.middleware.js` |
| **Atomic Stock Control** | `src/controllers/order.controller.js` (Checkout rollback logic) |
| **Aggregation Pipelines** | `src/controllers/report.controller.js` (Sales, Best-Selling, Inventory) |
| **Real-Time (Socket.IO)** | `src/sockets/socketHandler.js` + `src/events/appEvents.js` |
| **API Testing** | `postman/StockPilot.postman_collection.json` |

## 🚀 Future Enhancements
- Integration of a real payment gateway (e.g., Stripe or Razorpay) via webhooks.
- Image upload functionality for product catalogs using `multer` and AWS S3.
- Redis caching layer for frequently accessed public endpoints (e.g., product catalog).
- Implementation of rate limiting (`express-rate-limit`) to prevent brute-force attacks.

## 👨‍💻 Author
**Adarsh Anand**  
*Computer Science Student*  
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/adarsh4nand)

---
*Built with clean architecture principles.*