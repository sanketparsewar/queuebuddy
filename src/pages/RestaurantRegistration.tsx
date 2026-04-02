import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { User } from "firebase/auth";
import { db, auth } from "../firebase";
import { Store, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";

const RestaurantRegistration = ({ user }: { user: User | null }) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [waitTime, setWaitTime] = useState("10");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const checkExistingRestaurant = async () => {
      try {
        const q = query(
          collection(db, "restaurants"),
          where("ownerUid", "==", user.uid),
          limit(1),
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const id = querySnapshot.docs[0].id;
          navigate(`/dashboard/${id}`, { replace: true });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking existing restaurant:", error);
        setLoading(false);
      }
    };

    checkExistingRestaurant();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "restaurants"), {
        name,
        address,
        ownerUid: user.uid,
        lastTokenNumber: 0,
        lastTokenDate: new Date().toISOString().split("T")[0],
        averageWaitTimePerCustomer: parseInt(waitTime) || 10,
        createdAt: serverTimestamp(),
      });
      navigate(`/dashboard/${docRef.id}`, { replace: true });
    } catch (error) {
      console.error("Error registering restaurant:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-indigo-600 font-bold animate-pulse">
            Checking registration status...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto mt-8 sm:mt-12 p-6 sm:p-8 bg-white rounded-2xl shadow-sm border border-gray-100"
      >
        <div className="text-center mb-8">
          <Store className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Register Your Restaurant
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mt-2">
            Start managing your virtual queue today.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Restaurant Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
              placeholder="e.g. The Gourmet Kitchen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
              placeholder="e.g. 123 Main St, City"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Avg. Wait Time per Customer (mins)
            </label>
            <input
              type="number"
              required
              min="1"
              max="120"
              value={waitTime}
              onChange={(e) => setWaitTime(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all text-sm sm:text-base"
              placeholder="e.g. 10"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              "Registering..."
            ) : (
              <>
                Register Restaurant <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default RestaurantRegistration;
