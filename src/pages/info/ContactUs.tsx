import React, { useRef } from "react";
import { motion } from "motion/react";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import emailjs from "@emailjs/browser";

const ContactUs = () => {
  const formRef = useRef<HTMLFormElement | null>(null);

  const sendEmail = (e: React.FormEvent) => {
    e.preventDefault();

    emailjs
      .sendForm(
        "service_ytcoog1", //YOUR_SERVICE_ID
        "template_grxveeb", //YOUR_TEMPLATE_ID
        formRef.current!,
        "sFd-MUWVwKjX2J3gA", //YOUR_PUBLIC_KEY
      )
      .then(
        () => {
          alert("Email sent");
          formRef.current?.reset();
        },
        (error) => {
          console.error(error);
          alert("Failed to send email");
        },
      );
  };

  return (
    <div className="min-h-screen bg-white pt-4 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6">
            Get in <span className="text-indigo-600">Touch</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
            Have questions or need support? We're here to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-12"
          >
            <div className="flex items-start gap-6">
              <div className="bg-indigo-50 p-4 rounded-2xl shadow-sm">
                <Mail className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Email Us
                </h3>
                <p className="text-gray-600 text-sm">
                  {import.meta.env.VITE_SUPPORT_EMAIL}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  We respond within 24 hours.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="bg-indigo-50 p-4 rounded-2xl shadow-sm">
                <Phone className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Call Us
                </h3>
                <p className="text-gray-600 text-sm">+91 88303 92209</p>
                <p className="text-gray-400 text-sm mt-1">
                  Mon-Fri, 9am - 6pm EST.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <div className="bg-indigo-50 p-4 rounded-2xl shadow-sm">
                <MapPin className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Our Office
                </h3>
                <p className="text-gray-600 text-sm">Pune</p>
                <p className="text-gray-600 text-sm">Maharashtra, IN 411061</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-50 p-8 sm:p-12 rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-100/50"
          >
            <form ref={formRef} onSubmit={sendEmail} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    Full Name
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                    Email Address
                  </label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="abc@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Subject
                </label>
                <input
                  name="title"
                  type="text"
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="How can we help?"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  rows={4}
                  required
                  className="w-full px-6 py-4 bg-white border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  placeholder="Your message here..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-3 group"
              >
                Send Message{" "}
                <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
