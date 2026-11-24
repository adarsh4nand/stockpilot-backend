import mongoose, { Schema } from "mongoose";
const orderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  seller: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: String, price: Number, quantity: Number, subtotal: Number, // price snapshots
}, { _id: false });
const orderSchema = new Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  deliveryDetails: { fullName: String, phone: String, address: String, city: String, pincode: String },
  subtotal: Number, total: Number,
  paymentMode: { type: String, default: "SIMULATED" },
  paymentStatus: { type: String, enum: ["simulated_pending", "simulated_paid", "failed"], default: "simulated_paid" },
  status: { type: String, enum: ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"], default: "placed" },
  statusHistory: [{ status: String, changedAt: { type: Date, default: Date.now } }],
}, { timestamps: true });
orderSchema.index({ customer: 1, createdAt: -1 }); // index #4
export const Order = mongoose.model("Order", orderSchema);