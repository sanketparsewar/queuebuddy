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
  Download,
  Calendar,
  FileDown,
  Search,
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

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 min-w-[240px]">
      <div className="bg-indigo-50 p-3 rounded-xl">
        <Clock className="w-6 h-6 text-indigo-600" />
      </div>
      <div className="text-right flex-1">
        <div className="text-2xl font-bold text-gray-900 tabular-nums">
          {time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {time.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>
    </div>
  );
};

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
  const [filterDate, setFilterDate] = useState("");

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

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${restaurant?.name || "restaurant"}-qr-code.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const exportHistory = () => {
    const completed = queue.filter((e) => e.status === "completed");
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Token,Name,Phone,Date,Time\n" +
      completed
        .map((e) => {
          const date = e.createdAt?.toDate ? e.createdAt.toDate() : new Date();
          return `${e.tokenNumber},${e.customerName},${e.customerPhone},${date.toLocaleDateString()},${date.toLocaleTimeString()}`;
        })
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${restaurant?.name || "restaurant"}-history.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const joinUrl = `${import.meta.env.VITE_QR_CODE_URL}/join?restaurantId=${restaurantId}`;

  if (!restaurant) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeQueue = queue.filter((e) => e.status !== "completed");
  const historyQueue = queue.filter((e) => e.status === "completed");

  return (
    <div className="max-w-7xl mx-auto mt-8 px-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            {restaurant?.name}
          </h1>
          <p className="text-gray-500 flex items-center gap-2 mt-2 font-medium">
            <Store className="w-5 h-5 text-indigo-500" /> {restaurant?.address}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <LiveClock />
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-5 py-3 rounded-2xl text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <QrCode className="w-5 h-5" /> {showQR ? "Hide QR" : "Show QR"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showQR && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-10"
          >
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col items-center text-center max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-6">Customer Scan QR</h3>
              <div className="bg-white p-6 rounded-3xl shadow-inner border border-gray-50 mb-8">
                <QRCodeSVG id="qr-code-svg" value={joinUrl} size={240} />
              </div>
              <button
                onClick={downloadQRCode}
                className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 mb-6"
              >
                <Download className="w-5 h-5" /> Download QR for Print
              </button>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
                Place this QR code at your reception counter for customers to
                join the queue.
              </p>
              <a
                href={joinUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 text-indigo-600 text-sm font-bold hover:underline"
              >
                {joinUrl}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Current Queue Section */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">
                  Current Queue
                </h2>
              </div>
              <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider">
                {activeQueue.length} Active
              </span>
            </div>

            <div className="space-y-4">
              {activeQueue.map((entry) => (
                <motion.div
                  layout
                  key={entry.id}
                  className={`p-6 rounded-3xl border flex items-center justify-between transition-all ${
                    entry.status === "called"
                      ? "bg-amber-50 border-amber-200 shadow-md scale-[1.02]"
                      : "bg-white border-gray-100 hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${
                        entry.status === "called"
                          ? "bg-amber-500 text-white"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {entry.tokenNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {entry.customerName}
                      </h4>
                      <p className="text-sm text-gray-500 font-medium">
                        {entry.customerPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {entry.status === "waiting" ? (
                      <button
                        onClick={() => updateStatus(entry.id, "called")}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
                      >
                        Call
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(entry.id, "completed")}
                        className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-green-700 transition-all shadow-sm flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Done
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {activeQueue.length === 0 && (
                <div className="text-center py-20 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-100">
                  <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Users className="w-8 h-8 text-gray-200" />
                  </div>
                  <h3 className="text-gray-900 font-bold">
                    No customers in the queue yet.
                  </h3>
                  <p className="text-gray-400 text-sm mt-1">
                    When customers join, they will appear here in real-time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent History Section */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">
                  Recent History
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button
                  onClick={exportHistory}
                  className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <FileDown className="w-4 h-4" /> Export
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-50">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                      Token
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                      Customer
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                      Date
                    </th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {historyQueue
                    .filter((entry) => {
                      if (!filterDate) return true;
                      const entryDate = entry.createdAt?.toDate
                        ? entry.createdAt.toDate()
                        : new Date();
                      return (
                        entryDate.toISOString().split("T")[0] === filterDate
                      );
                    })
                    .slice()
                    .reverse()
                    .map((entry) => {
                      const date = entry.createdAt?.toDate
                        ? entry.createdAt.toDate()
                        : new Date();
                      return (
                        <tr
                          key={entry.id}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-sm border border-indigo-100">
                              {entry.tokenNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">
                              {entry.customerName}
                            </div>
                            <div className="text-xs text-gray-400">
                              {entry.customerPhone}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                            {date.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                            {date.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  {historyQueue.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-gray-400 italic text-sm"
                      >
                        No completed entries yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
