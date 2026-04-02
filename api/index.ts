import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const app = express();

app.use(express.json());

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    env: {
      hasKeyId: !!process.env.VITE_RAZORPAY_KEY_ID,
      hasKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
    },
  });
});

const getRazorpay = () => {
  const key_id = process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay Key ID or Key Secret is missing in environment variables.",
    );
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
};

// API Route to create a Razorpay order
app.post("/api/razorpay/order", async (req, res) => {
  try {
    const razorpay = getRazorpay();
    const { amount, currency } = req.body;
    const options = {
      amount: amount, // amount in the smallest currency unit
      currency: currency,
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error: any) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      error: "Failed to create order",
      message: error.message,
      details: error.description || error.error?.description || "Unknown error",
    });
  }
});

// API Route to verify Razorpay payment
app.post("/api/razorpay/verify", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET || "";

    if (!secret) {
      throw new Error("RAZORPAY_KEY_SECRET is missing.");
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated_signature === razorpay_signature) {
      res.json({ status: "ok" });
    } else {
      res.status(400).json({ error: "Invalid signature" });
    }
  } catch (error: any) {
    console.error("Error verifying Razorpay payment:", error);
    res.status(500).json({
      error: "Failed to verify payment",
      message: error.message,
    });
  }
});

export default app;
