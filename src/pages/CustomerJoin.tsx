import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  collection,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase";
import { Users, CheckCircle2, Clock, UserPlus, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Restaurant, QueueEntry, OperationType } from "../types";
import { handleFirestoreError } from "../services/errorHandling";

const CustomerJoin = () => {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [members, setMembers] = useState("1");
  const [token, setToken] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionTrigger, setSessionTrigger] = useState(0);
  const [isInitialCheckDone, setIsInitialCheckDone] = useState(false);

  // Restore session from localStorage
  useEffect(() => {
    if (!restaurantId) return;

    const savedEntryId = localStorage.getItem(`queue_entry_${restaurantId}`);
    if (savedEntryId) {
      const unsubscribe = onSnapshot(
        doc(db, "restaurants", restaurantId, "queue", savedEntryId),
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as any;
            setToken({ id: snapshot.id, ...data } as QueueEntry);
          } else {
            // Entry might have been deleted or doesn't exist anymore
            localStorage.removeItem(`queue_entry_${restaurantId}`);
            setToken(null);
          }
          setIsInitialCheckDone(true);
        },
        (error) => {
          console.error("onSnapshot error:", error);
          setIsInitialCheckDone(true);
          handleFirestoreError(
            error,
            OperationType.GET,
            `restaurants/${restaurantId}/queue/${savedEntryId}`,
          );
        },
      );
      return () => unsubscribe();
    } else {
      setIsInitialCheckDone(true);
    }
  }, [restaurantId, sessionTrigger]);

  useEffect(() => {
    if (!restaurantId) return;
    const fetchRestaurant = async () => {
      try {
        const docSnap = await getDoc(doc(db, "restaurants", restaurantId));
        if (docSnap.exists()) {
          setRestaurant({ id: docSnap.id, ...docSnap.data() } as Restaurant);
        } else {
          setError("Restaurant not found. Please scan a valid QR code.");
        }
      } catch (err) {
        console.error("Error fetching restaurant:", err);
        setError(
          "Failed to load restaurant details. Please check your connection.",
        );
        try {
          handleFirestoreError(
            err,
            OperationType.GET,
            `restaurants/${restaurantId}`,
          );
        } catch (e) {}
      }
    };
    fetchRestaurant();
  }, [restaurantId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setLoading(true);
    setError("");
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }
    try {
      await runTransaction(db, async (transaction) => {
        // ... (rest of the transaction logic)
        const restaurantRef = doc(db, "restaurants", restaurantId);
        const restaurantDoc = await transaction.get(restaurantRef);

        if (!restaurantDoc.exists()) {
          throw new Error("Restaurant does not exist!");
        }

        const restaurantData = restaurantDoc.data();
        const currentLastToken = restaurantData.lastTokenNumber || 0;
        const lastTokenDate = restaurantData.lastTokenDate || "";
        const today = new Date().toISOString().split("T")[0];

        let nextToken = currentLastToken + 1;
        if (lastTokenDate !== today) {
          nextToken = 1;
        }

        // Update restaurant's last token number and date
        transaction.update(restaurantRef, {
          lastTokenNumber: nextToken,
          lastTokenDate: today,
        });

        // Add new queue entry
        const queueRef = doc(
          collection(db, "restaurants", restaurantId, "queue"),
        );
        transaction.set(queueRef, {
          customerName: name,
          customerPhone: phone,
          members: members,
          tokenNumber: nextToken,
          status: "waiting",
          createdAt: serverTimestamp(),
        });

        // Save to localStorage
        localStorage.setItem(`queue_entry_${restaurantId}`, queueRef.id);
        setSessionTrigger((prev) => prev + 1);
      });
      setName("");
      setPhone("");
      setMembers("1");
    } catch (err) {
      console.error("Error joining queue:", err);
      setError(
        "Failed to join queue. This might be due to a permission error or a network issue. Please try again.",
      );
      try {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `restaurants/${restaurantId}/queue`,
        );
      } catch (e) {
        // Already logged
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    if (restaurantId) {
      localStorage.removeItem(`queue_entry_${restaurantId}`);
      setToken(null);
      window.close();
    }
  };

  // Handle notifications (Vibration) when called
  useEffect(() => {
    if (token?.status === "called") {
      // Vibrate if supported
      if ("vibrate" in navigator) {
        navigator.vibrate([500, 200, 500, 200, 500]);
      }
    }
  }, [token?.status]);

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">
            Invalid Queue Link
          </h2>
          <p className="text-gray-500 mt-2">
            Please scan a valid restaurant QR code.
          </p>
        </div>
      </div>
    );
  }

  if (!isInitialCheckDone) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (token) {
    const isCalled = token.status === "called";
    const isCompleted = token.status === "completed";

    return (
      <div
        className={`min-h-screen transition-colors duration-500 flex items-center justify-center p-4 ${
          isCalled
            ? "bg-amber-500"
            : isCompleted
              ? "bg-green-600"
              : "bg-indigo-600"
        }`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={token.status}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className={`bg-white w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden border-8 ${
              isCalled
                ? "border-amber-400"
                : isCompleted
                  ? "border-green-400"
                  : "border-white"
            }`}
          >
            {isCalled && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-amber-500/20 pointer-events-none animate-pulse"
              />
            )}

            <div
              className={`w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 transform rotate-3 ${
                isCalled
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-200 animate-bounce"
                  : isCompleted
                    ? "bg-green-100 text-green-600"
                    : "bg-indigo-50 text-indigo-600"
              }`}
            >
              {isCalled ? (
                <Users className="w-12 h-12" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-12 h-12" />
              ) : (
                <Clock className="w-12 h-12" />
              )}
            </div>

            <h2
              className={`font-black mb-2 tracking-tight ${
                isCalled ? "text-4xl text-amber-600" : "text-2xl text-gray-900"
              }`}
            >
              {isCalled
                ? "IT'S YOUR TURN!"
                : isCompleted
                  ? "Thank You!"
                  : "You're in the queue!"}
            </h2>
            <p className="text-gray-500 mb-10 font-medium uppercase tracking-widest text-sm">
              {restaurant?.name}
            </p>

            <div
              className={`rounded-4xl p-6 sm:p-8 mb-6 transition-all transform ${
                isCalled
                  ? "bg-amber-600 text-white scale-110 shadow-xl shadow-amber-200"
                  : isCompleted
                    ? "bg-green-50"
                    : "bg-gray-50"
              }`}
            >
              <p
                className={`text-xs uppercase tracking-[0.2em] font-black mb-2 ${
                  isCalled ? "text-amber-100" : "text-gray-400"
                }`}
              >
                Token Number
              </p>
              <h1
                className={`text-7xl font-black leading-none ${
                  isCalled
                    ? "text-white"
                    : isCompleted
                      ? "text-green-600"
                      : "text-indigo-600"
                }`}
              >
                {token.tokenNumber}
              </h1>
            </div>

            <div
              className={`p-4 rounded-2xl mb-6 flex flex-col items-center justify-center gap-2 ${
                isCalled
                  ? "bg-white border-2 border-amber-500 text-amber-600"
                  : isCompleted
                    ? "bg-green-600 text-white"
                    : "bg-indigo-50 text-indigo-700"
              }`}
            >
              {isCalled ? (
                <>
                  <span className="text-2xl font-black uppercase tracking-tighter">
                    Please Proceed Now
                  </span>
                  <span className="text-sm font-bold opacity-80">
                    Go to the reception counter immediately.
                  </span>
                </>
              ) : isCompleted ? (
                <>
                  <span className="font-bold text-lg">Visit Completed</span>
                  <span className="text-sm opacity-90">
                    Sit relax and enjoy your meal!
                  </span>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 animate-spin-slow" />
                    <span className="font-bold">Waiting for your turn...</span>
                  </div>
                </>
              )}
            </div>

            {isCompleted && (
              <button
                onClick={handleLeave}
                className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 transition-colors"
              >
                Close & Exit
              </button>
            )}

            {!isCalled && !isCompleted && (
              <p className="text-xs text-gray-400">
                Keep this page open. We'll notify you here when it's your turn.
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100"
      >
        <div className="text-center mb-6">
          <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Join the Queue</h2>
          <p className="text-gray-500 mt-2">{restaurant?.name}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={18}
              max={18}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="Enter 10-digit number"
              pattern="\d{10}"
              title="Please enter exactly 10 digits"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Members
            </label>
            <select
              value={members}
              onChange={(e) => setMembers(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white appearance-none"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <option key={num} value={num.toString()}>
                  {num}
                </option>
              ))}
              <option value="9+">9+</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
          >
            {loading ? (
              "Joining..."
            ) : (
              <>
                Get Token <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
          <p className="text-[10px] text-center text-slate-400 font-medium leading-relaxed">
            Keep this page open to track your position in the queue.
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default CustomerJoin;
