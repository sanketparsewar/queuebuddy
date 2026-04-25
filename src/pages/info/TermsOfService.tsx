import React from "react";
import { motion } from "motion/react";
import {
  FileText,
  Shield,
  Zap,
  Clock,
  CreditCard,
  AlertTriangle,
  Mail,
} from "lucide-react";
import {
  COMPANY_NAME,
  COMPANY_NAME_TM,
  PRODUCT_NAME,
} from "@/src/utils/constants";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white pt-4 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* HEADER */}
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

          {/* LEGAL IDENTITY */}
          <p className="text-sm text-gray-400 mt-4 max-w-2xl mx-auto">
            {PRODUCT_NAME} is a product by <strong>{COMPANY_NAME_TM}</strong>.
          </p>
        </motion.div>

        {/* CONTENT */}
        <div className="prose prose-indigo max-w-none space-y-12">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-indigo-600" />
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              By accessing or using {PRODUCT_NAME}, you agree to be bound by
              these Terms of Service. If you do not agree, you must not use the
              service.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Clock className="w-6 h-6 text-indigo-600" />
              2. Use of Service
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              You agree to use the service only for lawful purposes. You are
              responsible for maintaining the confidentiality of your account
              and any activity under it.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-indigo-600" />
              3. Intellectual Property
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              The service, including all content, features, and branding, is
              owned by Sanket Parsewar under {COMPANY_NAME_TM}. You may not
              copy, modify, distribute, or reproduce any part of the service
              without permission.
            </p>
          </section>

          {/* PAYMENTS */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              4. Payments & Billing
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Payments for services are processed through third-party payment
              providers such as Razorpay. Currently, payments are processed
              under the name <strong>Sanket Parsewar</strong>.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mt-3">
              All fees are non-refundable unless otherwise stated. You are
              responsible for ensuring accurate billing information.
            </p>
          </section>

          {/* LIABILITY */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-indigo-600" />
              5. Limitation of Liability
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              The service is provided "as is" without warranties of any kind. We
              are not liable for any indirect, incidental, or consequential
              damages arising from your use of the service.
            </p>
          </section>

          {/* TERMINATION */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-indigo-600" />
              6. Termination
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We may suspend or terminate access to the service at any time if
              you violate these terms or misuse the platform.
            </p>
          </section>

          {/* CONTACT */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-indigo-600" />
              7. Contact Us
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              For any questions regarding these terms, contact:
            </p>
            <p className="text-gray-700 text-sm mt-3">
              <strong>{COMPANY_NAME}</strong>
              <br />
              Email: {import.meta.env.VITE_SUPPORT_EMAIL}
            </p>
          </section>

          {/* DATE */}
          <div className="text-sm text-gray-400 pt-6 border-t">
            Effective Date: January 1, 2026
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
