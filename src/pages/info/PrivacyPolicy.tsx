import React from "react";
import { motion } from "motion/react";
import {
  Shield,
  Lock,
  Eye,
  FileText,
  Zap,
  Mail,
  CreditCard,
} from "lucide-react";
import { COMPANY_NAME, COMPANY_NAME_TM, PRODUCT_NAME } from "@/src/utils/constants";

const PrivacyPolicy = () => {
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
            <Shield className="w-10 h-10 text-indigo-600" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6">
            Privacy <span className="text-indigo-600">Policy</span>
          </h1>

          <p className="text-xl text-gray-500 font-medium">
            Your privacy is our top priority. Here's how we protect your data.
          </p>

          {/*  LEGAL IDENTITY */}
          <p className="text-sm text-gray-400 mt-4 max-w-2xl mx-auto">
            {PRODUCT_NAME} is a product by{" "}
            <strong>{COMPANY_NAME_TM}</strong>.
          </p>
        </motion.div>

        {/* CONTENT */}
        <div className="prose prose-indigo max-w-none space-y-12">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Eye className="w-6 h-6 text-indigo-600" />
              1. Information We Collect
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We collect information that you provide directly to us, such as
              when you create an account, join a queue, or contact support. This
              may include your name, phone number, email address, and business
              details.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mt-3">
              We may also collect usage data such as device information, browser
              type, and interaction with our platform to improve performance and
              user experience.
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-indigo-600" />
              2. How We Use Your Information
            </h2>
            <ul className="text-gray-600 text-sm space-y-2">
              <li>• Provide and maintain our services</li>
              <li>• Manage queues and customer flow</li>
              <li>• Send notifications and updates</li>
              <li>• Improve platform performance</li>
              <li>• Ensure security and prevent misuse</li>
            </ul>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Lock className="w-6 h-6 text-indigo-600" />
              3. Data Security
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We implement appropriate security measures to protect your data.
              Your information is stored on secure servers and is accessible
              only to authorized personnel.
            </p>
            <p className="text-gray-600 text-sm leading-relaxed mt-3">
              However, no method of transmission over the internet is completely
              secure, and we cannot guarantee absolute security.
            </p>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              4. Data Sharing
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We do not sell your personal data. We may share information with
              trusted third-party services such as hosting providers, analytics
              tools, and communication platforms strictly to operate and improve
              our services.
            </p>
          </section>

          {/*  PAYMENT TRANSPARENCY */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-indigo-600" />
              5. Payments
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Payments for {PRODUCT_NAME} services are processed through
              third-party payment gateways such as Razorpay. Currently, payments
              are processed under the name <strong>Sanket Parsewar</strong>{" "}
              (individual owner of {COMPANY_NAME_TM}).
            </p>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <FileText className="w-6 h-6 text-indigo-600" />
              6. Changes to This Policy
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. Any changes
              will be posted on this page with an updated effective date.
            </p>
          </section>

          {/* CONTACT */}
          <section>
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-3">
              <Mail className="w-6 h-6 text-indigo-600" />
              7. Contact Us
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              If you have any questions, you can contact us at:
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

export default PrivacyPolicy;
