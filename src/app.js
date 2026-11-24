import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';

import { notFoundHandler, errorHandler } from './middleware/error.middleware.js';
import authRouter from './routes/auth.routes.js';
import userRouter from './routes/user.routes.js';
import categoryRouter from './routes/category.routes.js';
import productRouter from './routes/product.routes.js';

import cartRouter from './routes/cart.routes.js';
import orderRouter from './routes/order.routes.js';

import reportRouter from './routes/report.routes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(morgan('dev'));

app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);

app.use("/api/v1/reports", reportRouter);

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "StockPilot API is running..." });
});

app.use(notFoundHandler);
app.use(errorHandler);

export { app };