import React from "react";
import { motion } from "motion/react";
import { Heart, Users, Zap, Clock } from "lucide-react";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6">
            About <span className="text-indigo-600">Scan2Queue</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
            We're on a mission to modernize the restaurant experience, one queue
            at a time.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">
              Empowering restaurants with <br />
              <span className="text-indigo-600">modern solutions.</span>
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Scan2Queue was born from a simple observation: waiting in line is
              a friction point for both customers and businesses. We wanted to
              create a solution that was friction-free, required no app
              downloads, and provided real-time visibility for everyone
              involved.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              Our platform is built for speed, reliability, and customer
              satisfaction. We believe that technology should enhance the human
              experience, not get in the way of it.
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {[
            {
              icon: <Heart className="w-8 h-8 text-red-500" />,
              title: "Customer First",
              description:
                "We prioritize the customer experience in everything we build.",
            },
            {
              icon: <Zap className="w-8 h-8 text-indigo-600" />,
              title: "Speed & Efficiency",
              description:
                "Our tools are designed to save time and reduce friction.",
            },
            {
              icon: <Users className="w-8 h-8 text-indigo-600" />,
              title: "Community Focused",
              description:
                "We support local restaurants and help them thrive in a digital world.",
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
