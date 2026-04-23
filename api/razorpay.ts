import type { VercelRequest, VercelResponse } from "@vercel/node";
import Razorpay from "razorpay";
import crypto from "crypto";

function getRazorpay() {
  const key_id = process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Missing Razorpay credentials");
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

// Helper: enable CORS
function setCors(res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const razorpay = getRazorpay();

    // =========================
    // CREATE ORDER
    // =========================
    if (req.url?.includes("/order")) {
      const { amount, currency } = req.body;

      // ✅ Validation
      if (!amount || typeof amount !== "number") {
        return res.status(400).json({ error: "Invalid amount" });
      }

      if (!currency || typeof currency !== "string") {
        return res.status(400).json({ error: "Invalid currency" });
      }

      const order = await razorpay.orders.create({
        amount,
        currency,
        receipt: `receipt_${Date.now()}`,
      });

      return res.status(200).json(order);
    }

    // =========================
    // VERIFY PAYMENT
    // =========================
    if (req.url?.includes("/verify")) {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: "Missing payment fields" });
      }

      const secret = process.env.RAZORPAY_KEY_SECRET!;

      const generated_signature = crypto
        .createHmac("sha256", secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

      if (generated_signature === razorpay_signature) {
        return res.status(200).json({ status: "ok" });
      } else {
        return res.status(400).json({ error: "Invalid signature" });
      }
    }

    return res.status(404).json({ error: "Route not found" });
  } catch (error: unknown) {
    console.error("Razorpay API error:", error);

    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
