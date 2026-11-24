import mongoose, { Schema } from "mongoose";
const cartItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, min: [1, "Quantity must be >= 1"], validate: { validator: Number.isInteger, message: "Quantity must be a whole number" } },
}, { _id: false });
const cartSchema = new Schema({
  customer: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true });
export const Cart = mongoose.model("Cart", cartSchema);