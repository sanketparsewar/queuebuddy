import React from "react";
import { motion } from "motion/react";
import { Heart, Users, Zap, Clock } from "lucide-react";
import { COMPANY_NAME_TM, PRODUCT_NAME } from "@/src/utils/constants";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white pt-4 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6">
            About <span className="text-indigo-600">{PRODUCT_NAME}</span>
          </h1>

          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
            We're on a mission to modernize the queue experience for businesses
            and customers.
          </p>

          {/* TRUST LINE */}
          <p className="text-sm text-gray-400 mt-4 max-w-2xl mx-auto">
            {PRODUCT_NAME} is a product by <strong>{COMPANY_NAME_TM}</strong>.
          </p>
        </motion.div>

        {/* MAIN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              Simplifying queues with <br />
              <span className="text-indigo-600">modern technology.</span>
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed">
              {PRODUCT_NAME} is developed to solve a simple but widespread
              problem — long waiting times and inefficient queue management.
              Traditional systems create frustration for customers and
              operational challenges for businesses.
            </p>

            <p className="text-lg text-gray-600 leading-relaxed">
              Our goal is to provide a seamless, no-download experience that
              allows customers to join queues remotely while giving businesses
              real-time control and visibility.
            </p>

            <p className="text-lg text-gray-600 leading-relaxed">
              Built under <strong>{COMPANY_NAME_TM}</strong>, we focus on
              creating practical, scalable solutions that improve everyday
              business operations.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-50 rounded-[3rem] p-12 flex items-center justify-center"
          >
            <div className="bg-indigo-600 w-32 h-32 rounded-4xl flex items-center justify-center shadow-2xl shadow-indigo-200">
              <Clock className="text-white w-16 h-16" />
            </div>
          </motion.div>
        </div>

        {/* VALUES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            {
              icon: <Heart className="w-8 h-8 text-red-500" />,
              title: "Customer First",
              description:
                "We design every feature with end-user experience in mind.",
            },
            {
              icon: <Zap className="w-8 h-8 text-indigo-600" />,
              title: "Speed & Efficiency",
              description:
                "We help businesses reduce wait times and operate smoothly.",
            },
            {
              icon: <Users className="w-8 h-8 text-indigo-600" />,
              title: "Business Focused",
              description:
                "We empower businesses with tools that improve operations and growth.",
            },
          ].map((value, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-8 rounded-3xl bg-gray-50 border border-gray-100 text-center"
            >
              <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm mx-auto">
                {value.icon}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {value.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
