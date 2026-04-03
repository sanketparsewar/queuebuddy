import React from "react";
import { motion } from "motion/react";
import { Shield, Lock, Eye, FileText, Zap } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6">
            Privacy <span className="text-indigo-600">Policy</span>
          </h1>
          <p className="text-xl text-gray-500 font-medium">
            Your privacy is our top priority. Here's how we protect your data.
          </p>
        </motion.div>

        <div className="prose prose-indigo max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-indigo-600" /> 1. Information We
              Collect
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              We collect information that you provide directly to us, such as
              when you create an account, join a queue, or contact us for
              support. This may include your name, phone number, and email
              address.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-indigo-600" /> 2. How We Use Your
              Information
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              We use the information we collect to provide, maintain, and
              improve our services, to communicate with you about your queue
              status, and to respond to your inquiries.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-indigo-600" /> 3. Data Security
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              We implement a variety of security measures to maintain the safety
              of your personal information. Your data is stored on secure
              servers and is only accessible by authorized personnel.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" /> 4. Changes to
              This Policy
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify
              you of any changes by posting the new Privacy Policy on this page.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
