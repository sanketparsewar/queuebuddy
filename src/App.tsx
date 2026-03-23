/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  where,
  getDocs,
  limit,
  runTransaction,
} from "firebase/firestore";
import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { db, auth } from "./firebase";
import {
  LayoutDashboard,
  QrCode,
  Users,
  PlusCircle,
  CheckCircle2,
  Clock,
  LogOut,
  Store,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
interface Restaurant {
  id: string;
  name: string;
  address: string;
  ownerUid: string;
  lastTokenNumber: number;
  createdAt: any;
}

interface QueueEntry {
  id: string;
  customerName: string;
  customerPhone: string;
  tokenNumber: number;
  status: "waiting" | "called" | "completed";
  createdAt: any;
}

// --- Components ---

const Navbar = ({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout: () => void;
}) => (
  <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
    <div className="flex items-center gap-2">
      <div className="bg-indigo-600 p-2 rounded-lg">
        <Clock className="text-white w-5 h-5" />
      </div>
      <span className="font-bold text-xl tracking-tight text-gray-900">
        QueueFlow
      </span>
    </div>
    {user && (
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 hidden sm:inline">
          {user.email}
        </span>
        <button
          onClick={onLogout}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    )}
  </nav>
);

const RestaurantRegistration = ({
  onRegistered,
}: {
  onRegistered: (id: string) => void;
}) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, "restaurants"), {
        name,
        address,
        ownerUid: auth.currentUser.uid,
        lastTokenNumber: 0,
        createdAt: serverTimestamp(),
      });
      onRegistered(docRef.id);
    } catch (error) {
      console.error("Error registering restaurant:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto mt-12 p-8 bg-white rounded-2xl shadow-sm border border-gray-100"
    >
      <div className="text-center mb-8">
        <Store className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Register Your Restaurant
        </h2>
        <p className="text-gray-500 mt-2">
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
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
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            placeholder="e.g. 123 Main St, City"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
  );
};

const RestaurantDashboard = ({ restaurantId }: { restaurantId: string }) => {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    setRestaurant(null);
    setQueue([]);
    const fetchRestaurant = async () => {
      const docSnap = await getDoc(doc(db, "restaurants", restaurantId));
      if (docSnap.exists()) {
        setRestaurant({ id: docSnap.id, ...docSnap.data() } as Restaurant);
      }
    };
    fetchRestaurant();

    const q = query(
      collection(db, "restaurants", restaurantId, "queue"),
      orderBy("createdAt", "asc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as QueueEntry,
      );
      setQueue(entries);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const updateStatus = async (id: string, status: "called" | "completed") => {
    await updateDoc(doc(db, "restaurants", restaurantId, "queue", id), {
      status,
    });
  };

  const joinUrl = `${import.meta.env.VITE_QR_CODE_URL}/join?restaurantId=${restaurantId}`;

  if (!restaurant) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto mt-8 px-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {restaurant?.name}
          </h1>
          <p className="text-gray-500 flex items-center gap-1 mt-1">
            <Store className="w-4 h-4" /> {restaurant?.address}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
          >
            <QrCode className="w-4 h-4" /> {showQR ? "Hide QR" : "Show QR"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-8"
          >
            <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
              <h3 className="text-lg font-semibold mb-4">Customer Scan QR</h3>
              <div className="bg-white p-4 rounded-xl shadow-inner border border-gray-50">
                <QRCodeSVG value={joinUrl} size={200} />
              </div>
              <p className="mt-4 text-sm text-gray-500 max-w-xs">
                Place this QR code at your reception counter for customers to
                join the queue.
              </p>
              <a
                href={joinUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 text-indigo-600 text-xs hover:underline"
              >
                {joinUrl}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Waiting List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Current Queue</h2>
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full">
              {queue.filter((e) => e.status !== "completed").length} Active
            </span>
          </div>

          <div className="space-y-3">
            {queue
              .filter((e) => e.status !== "completed")
              .map((entry) => (
                <motion.div
                  layout
                  key={entry.id}
                  className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${
                    entry.status === "called"
                      ? "bg-amber-50 border-amber-200 shadow-sm"
                      : "bg-white border-gray-100 hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${
                        entry.status === "called"
                          ? "bg-amber-200 text-amber-800"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {entry.tokenNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">
                        {entry.customerName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {entry.customerPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {entry.status === "waiting" ? (
                      <button
                        onClick={() => updateStatus(entry.id, "called")}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        Call Customer
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(entry.id, "completed")}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Done
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            {queue.filter((e) => e.status !== "completed").length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No customers in the queue yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats / History */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Recent History
            </h3>
            <div className="space-y-3">
              {queue
                .filter((e) => e.status === "completed")
                .slice(-5)
                .reverse()
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between text-sm py-2 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-gray-700">{entry.customerName}</span>
                    <span className="text-gray-400">
                      Token #{entry.tokenNumber}
                    </span>
                  </div>
                ))}
              {queue.filter((e) => e.status === "completed").length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  No completed entries yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerJoin = () => {
  const [searchParams] = useSearchParams();
  const restaurantId = searchParams.get("restaurantId");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [token, setToken] = useState<QueueEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionTrigger, setSessionTrigger] = useState(0);

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

            // Vibrate if called
            if (data.status === "called" && "vibrate" in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
          } else {
            // Entry might have been deleted or doesn't exist anymore
            localStorage.removeItem(`queue_entry_${restaurantId}`);
            setToken(null);
          }
        },
        (error) => {
          console.error("onSnapshot error:", error);
          handleFirestoreError(
            error,
            OperationType.GET,
            `restaurants/${restaurantId}/queue/${savedEntryId}`,
          );
        },
      );
      return () => unsubscribe();
    }
  }, [restaurantId, sessionTrigger]);

  useEffect(() => {
    if (!restaurantId) return;
    const fetchRestaurant = async () => {
      const docSnap = await getDoc(doc(db, "restaurants", restaurantId));
      if (docSnap.exists()) {
        setRestaurant({ id: docSnap.id, ...docSnap.data() } as Restaurant);
      }
    };
    fetchRestaurant();
  }, [restaurantId]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;
    setLoading(true);
    setError("");
    try {
      await runTransaction(db, async (transaction) => {
        const restaurantRef = doc(db, "restaurants", restaurantId);
        const restaurantDoc = await transaction.get(restaurantRef);

        if (!restaurantDoc.exists()) {
          throw new Error("Restaurant does not exist!");
        }

        const currentLastToken = restaurantDoc.data().lastTokenNumber || 0;
        const nextToken = currentLastToken + 1;

        // Update restaurant's last token number
        transaction.update(restaurantRef, { lastTokenNumber: nextToken });

        // Add new queue entry
        const queueRef = doc(
          collection(db, "restaurants", restaurantId, "queue"),
        );
        transaction.set(queueRef, {
          customerName: name,
          customerPhone: phone,
          tokenNumber: nextToken,
          status: "waiting",
          createdAt: serverTimestamp(),
        });

        // Save to localStorage
        localStorage.setItem(`queue_entry_${restaurantId}`, queueRef.id);
        setSessionTrigger((prev) => prev + 1);
      });
    } catch (err) {
      console.error("Error joining queue:", err);
      setError(
        "Failed to join queue. This might be due to a permission error or a network issue. Please try again.",
      );
      // Log detailed error for debugging
      try {
        handleFirestoreError(
          err,
          OperationType.WRITE,
          `restaurants/${restaurantId}/queue`,
        );
      } catch (e) {
        // Already logged to console by handleFirestoreError
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLeave = () => {
    if (restaurantId) {
      localStorage.removeItem(`queue_entry_${restaurantId}`);
      setToken(null);
    }
  };

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

  if (token) {
    const isCalled = token.status === "called";
    const isCompleted = token.status === "completed";

    return (
      <div
        className={`min-h-screen transition-colors duration-500 flex items-center justify-center p-6 ${
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
            className={`bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl text-center relative overflow-hidden border-8 ${
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
              className={`rounded-[2rem] p-10 mb-10 transition-all transform ${
                isCalled
                  ? "bg-amber-600 text-white scale-110 shadow-xl shadow-amber-200"
                  : isCompleted
                    ? "bg-green-50"
                    : "bg-gray-50"
              }`}
            >
              <p
                className={`text-xs uppercase tracking-[0.2em] font-black mb-4 ${
                  isCalled ? "text-amber-100" : "text-gray-400"
                }`}
              >
                Token Number
              </p>
              <h1
                className={`text-8xl font-black leading-none ${
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
              className={`p-6 rounded-2xl mb-8 flex flex-col items-center justify-center gap-3 ${
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
                    We hope you enjoyed your meal!
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-2xl p-8 shadow-sm border border-gray-100"
      >
        <div className="text-center mb-8">
          <div className="bg-indigo-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Join the Queue</h2>
          <p className="text-gray-500 mt-1">
            at {restaurant?.name || "Restaurant"}
          </p>
        </div>

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
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
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
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Enter your phone number"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Joining..." : "Get Token Number"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const Home = () => {
  const [user, setUser] = useState<User | null>(null);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Check if user already has a restaurant
        const q = query(
          collection(db, "restaurants"),
          where("ownerUid", "==", user.uid),
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setRestaurantId(snapshot.docs[0].id);
        } else {
          setRestaurantId(null);
        }
      } else {
        setRestaurantId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = () => auth.signOut();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar user={null} onLogout={() => {}} />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-5xl font-black text-gray-900 leading-tight">
                Replace physical queues with{" "}
                <span className="text-indigo-600">QueueFlow.</span>
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed">
                The modern way to manage restaurant queues. Customers scan,
                join, and wait anywhere.
              </p>
              <button
                onClick={handleLogin}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-3"
              >
                Get Started as Restaurant <ArrowRight className="w-5 h-5" />
              </button>
            </div>
            <div className="relative hidden md:block">
              <div className="absolute -inset-4 bg-indigo-100 rounded-3xl blur-2xl opacity-50 animate-pulse"></div>
              <div className="relative bg-white p-8 rounded-3xl border border-gray-100 shadow-xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <Users className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <div className="h-4 w-24 bg-gray-100 rounded mb-2"></div>
                    <div className="h-3 w-32 bg-gray-50 rounded"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg"></div>
                        <div className="h-3 w-16 bg-gray-200 rounded"></div>
                      </div>
                      <div className="h-6 w-12 bg-indigo-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      {restaurantId ? (
        <RestaurantDashboard restaurantId={restaurantId} />
      ) : (
        <RestaurantRegistration onRegistered={setRestaurantId} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<CustomerJoin />} />
      </Routes>
    </Router>
  );
}
