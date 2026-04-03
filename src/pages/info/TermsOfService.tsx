import React from "react";
import { motion } from "motion/react";
import { FileText, Shield, Zap, Clock } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white pt-4 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="bg-indigo-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FileText className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6">
            Terms of <span className="text-indigo-600">Service</span>
          </h1>
          <p className="text-xl text-gray-500 font-medium">
            Please read these terms carefully before using our services.
          </p>
        </motion.div>

        <div className="prose prose-indigo max-w-none space-y-12">
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-indigo-600" /> 1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              By accessing or using our services, you agree to be bound by these
              Terms of Service. If you do not agree to all the terms and
              conditions, then you may not access the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Clock className="w-6 h-6 text-indigo-600" /> 2. Use of Service
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              You agree to use our services only for lawful purposes and in
              accordance with these Terms. You are responsible for maintaining
              the confidentiality of your account and password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-600" /> 3. Intellectual
              Property
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              The service and its original content, features, and functionality
              are and will remain the exclusive property of Scan2Queue and its
              licensors.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-indigo-600" /> 4. Termination
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We may terminate or suspend access to our service immediately,
              without prior notice or liability, for any reason whatsoever,
              including without limitation if you breach the Terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
