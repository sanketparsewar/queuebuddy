import React from "react";
import { motion } from "motion/react";
import { CheckCircle2, Zap, Users, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { PRODUCT_NAME } from "@/src/utils/constants";

const Pricing = () => {
  const plans = [
    {
      name: "Free Trial",
      price: "0",
      duration: "14 Days",
      description: `Experience the full power of ${PRODUCT_NAME} with no commitment.`,
      features: [
        "Full Queue Management",
        "QR Code Generation",
        "Real-time Updates",
        "Basic Analytics (today only)",
        "Unlimited Customer Entries",
        "No payment required",
      ],
      buttonText: "Start Free Trial",
      highlight: false,
    },
    {
      name: "Monthly Premium",
      price: "199",
      duration: "Per Month",
      description: "Everything you need to manage your restaurant's waitlist.",
      features: [
        "Everything in Trial",
        "Unlimited Customer Entries",
        "Analytics History",
        "CSV Export",
        "Data saved permanently",
        "Unlimited access for 30 days",
      ],
      buttonText: "Get Started Now",
      highlight: true,
    },
  ];

  return (
    <div className="min-h-screen bg-white pt-4 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6">
            Simple <span className="text-indigo-600">Pricing</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
            Choose the plan that fits your restaurant's needs. No hidden fees.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col ${
                plan.highlight
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-200"
                  : "bg-white border-gray-100 text-gray-900 hover:border-indigo-100"
              }`}
            >
              <div className="mb-8">
                <h3
                  className={`text-2xl font-black mb-2 ${plan.highlight ? "text-white" : "text-gray-900"}`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`text-sm font-medium ${plan.highlight ? "text-indigo-100" : "text-gray-500"}`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-black">₹{plan.price}</span>
                <span
                  className={`text-sm font-bold uppercase tracking-widest ${plan.highlight ? "text-indigo-200" : "text-gray-400"}`}
                >
                  / {plan.duration}
                </span>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2
                      className={`w-5 h-5 ${plan.highlight ? "text-indigo-300" : "text-green-500"}`}
                    />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              <Link to="/">
                <button
                  className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg shadow-indigo-900/20"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
                  }`}
                >
                  {plan.buttonText}
                </button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
