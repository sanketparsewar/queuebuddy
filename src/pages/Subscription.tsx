import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import {
  Check,
  Zap,
  Shield,
  CreditCard,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { motion } from "motion/react";
import { Restaurant } from "../types";

const Subscription = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const isTrialActive = restaurant?.subscriptionStatus === "trial";
  const isMonthlyActive = restaurant?.subscriptionStatus === "active";
  const hasUsedTrial = restaurant?.hasUsedTrial === true;

  useEffect(() => {
    if (!restaurantId) return;
    const fetchRestaurant = async () => {
      try {
        const docSnap = await getDoc(doc(db, "restaurants", restaurantId));
        if (docSnap.exists()) {
          const data = docSnap.id
            ? ({ id: docSnap.id, ...docSnap.data() } as Restaurant)
            : null;
          setRestaurant(data);

          // If already has active subscription, redirect to dashboard
          if (
            data?.subscriptionStatus === "active" ||
            data?.subscriptionStatus === "trial"
          ) {
            // navigate(`/dashboard/${restaurantId}`, { replace: true });
          }
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurant();
  }, [restaurantId, navigate]);

  const handleTrial = async () => {
    if (!restaurantId) return;
    setProcessing(true);
    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + 7);

      await updateDoc(doc(db, "restaurants", restaurantId), {
        subscriptionStatus: "trial",
        subscriptionPlan: "free_trial",
        trialEndDate: trialEndDate.toISOString(),
        hasUsedTrial: true,
      });

      navigate(`/dashboard/${restaurantId}`, { replace: true });
    } catch (error) {
      console.error("Error starting trial:", error);
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    if (!restaurantId || !restaurant) return;

    const razorpayKey = import.meta.env.PROD
      ? import.meta.env.VITE_RAZORPAY_KEY_ID_LIVE
      : import.meta.env.VITE_RAZORPAY_KEY_ID_TEST;

    if (!razorpayKey) {
      const mode = import.meta.env.PROD ? "LIVE" : "TEST";
      alert(
        `Razorpay ${mode} Key ID is missing. Please configure VITE_RAZORPAY_KEY_ID_${mode} in the settings.`,
      );
      return;
    }

    setProcessing(true);
    let alertShown = false;

    try {
      const appUrl = import.meta.env.VITE_APP_URL || "";
      // 1. Create order on the server
      const orderResponse = await fetch(`${appUrl}/api/razorpay/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 19900, currency: "INR" }),
      });

      if (!orderResponse.ok) throw new Error("Failed to create order");
      const order = await orderResponse.json();

      // 2. Open Razorpay Checkout
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: "Scan2Queue",
        description: `Subscription for ${restaurant.name}`,
        image: "/favicon.svg",
        order_id: order.id,
        handler: async function (response: any) {
          // 3. Verify payment on the server
          try {
            const verifyResponse = await fetch(
              `${appUrl}/api/razorpay/verify`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              },
            );

            if (!verifyResponse.ok)
              throw new Error("Payment verification failed");

            const expiryDate = new Date();
            expiryDate.setMonth(expiryDate.getMonth() + 1);

            await updateDoc(doc(db, "restaurants", restaurantId), {
              subscriptionStatus: "active",
              subscriptionPlan: "monthly_199",
              paymentExpiryDate: expiryDate.toISOString(),
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            });

            navigate(`/dashboard/${restaurantId}`, { replace: true });
          } catch (error) {
            console.error("Error updating subscription after payment:", error);
            if (!alertShown) {
              alert(
                "Payment successful but failed to update subscription. Please contact support.",
              );
              alertShown = true;
            }
          }
        },
        prefill: {
          name: restaurant.name,
          email: "",
          contact: "",
        },
        theme: {
          color: "#4f46e5",
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on("payment.failed", function (response: any) {
        console.error("Razorpay Payment Failed:", response.error);
        if (!alertShown) {
          alert(
            `Oops! Something went wrong.\nPayment Failed: ${response.error.description}`,
          );
          alertShown = true;
        }
        setProcessing(false);
      });

      rzp.open();
    } catch (error: any) {
      console.error("Error in payment flow:", error);
      if (!alertShown) {
        alert(error.message || "Oops! Something went wrong. Payment Failed");
        alertShown = true;
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-100 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black text-slate-900 mb-1">
              Scan2Queue
            </h3>
            <p className="text-slate-500 font-medium animate-pulse">
              Loading subscription details...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
              Choose your plan
            </h1>
            <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
              Select the best plan for your restaurant. Start with a free trial
              or go premium for full features.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Trial Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col"
          >
            <div className="mb-8">
              <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">
                Free Trial
              </h3>
              <p className="text-slate-500 font-medium">
                Perfect for testing the waters.
              </p>
            </div>

            <div className="mb-8 flex-1">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-slate-900">₹0</span>
                <span className="text-slate-400 font-bold">/ 7 days</span>
              </div>
              <ul className="space-y-4">
                {[
                  "Full Queue Management",
                  "QR Code Generation",
                  "Real-time Updates",
                  "Basic Analytics",
                  "7 Days Access",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-slate-600 font-medium"
                  >
                    <div className="bg-green-50 p-1 rounded-full">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handleTrial}
              disabled={
                processing || isTrialActive || isMonthlyActive || hasUsedTrial
              }
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all border-2 flex items-center justify-center gap-2 group ${
                isTrialActive || isMonthlyActive || hasUsedTrial
                  ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                  : "border-slate-100 text-slate-700 hover:border-indigo-600 hover:text-indigo-600"
              }`}
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isTrialActive ? (
                "Current Plan (Trial)"
              ) : hasUsedTrial ? (
                "Trial Already Used"
              ) : isMonthlyActive ? (
                "Trial Unavailable"
              ) : (
                <>
                  Start 7-Day Trial{" "}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            {isTrialActive && (
              <p className="text-center mt-3 text-amber-600 text-sm font-bold">
                Your 7-day free trial is currently active.
              </p>
            )}
            {hasUsedTrial && !isTrialActive && (
              <p className="text-center mt-3 text-slate-400 text-sm font-medium">
                You have already used your one-time free trial.
              </p>
            )}
          </motion.div>

          {/* Premium Plan */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-indigo-600 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-200 flex flex-col relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>

            <div className="mb-8 relative z-10">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-white mb-2">Premium</h3>
                <span className="bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md">
                  Most Popular
                </span>
              </div>
              <p className="text-indigo-100 font-medium">
                Unlimited access for your business.
              </p>
            </div>

            <div className="mb-8 flex-1 relative z-10">
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-black text-white">₹199</span>
                <span className="text-indigo-200 font-bold">/ month</span>
              </div>
              <ul className="space-y-4">
                {[
                  "Everything in Trial",
                  "Unlimited Queue Entries",
                  "Advanced Export (CSV)",
                  "Custom Branding",
                  "30 Days Access",
                ].map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-center gap-3 text-indigo-50 font-medium"
                  >
                    <div className="bg-white/20 p-1 rounded-full backdrop-blur-md">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={handlePayment}
              disabled={processing || isMonthlyActive}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2 group relative z-10 ${
                isMonthlyActive
                  ? "bg-indigo-400 text-indigo-100 cursor-not-allowed shadow-none"
                  : "bg-white text-indigo-600 hover:bg-indigo-50"
              }`}
            >
              {processing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isMonthlyActive ? (
                "Monthly Plan Active"
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> Pay ₹199 Now
                </>
              )}
            </button>
            {isMonthlyActive && (
              <p className="text-center mt-3 text-indigo-100 text-sm font-bold relative z-10">
                Your monthly premium plan is currently active.
              </p>
            )}
          </motion.div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-sm font-medium flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" /> Secure payment powered by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
