import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { User } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { signOut } from "firebase/auth";
import {
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  Store,
  Calendar,
  FileDown,
  Trash2,
  X,
  CreditCard,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import { Restaurant, QueueEntry } from "../types";
import QRDialog from "../components/QRDialog";

const RestaurantDashboard = ({
  user,
  onLogout,
}: {
  user: User | null;
  onLogout?: () => void;
}) => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "queue" | "history" | "subscription"
  >("queue");
  const [filterDate, setFilterDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [exportEndDate, setExportEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const recordsPerPage = 20;

  useEffect(() => {
    window.scrollTo(0, 0);

    // Prevent back navigation by pushing a new state
    window.history.pushState(null, "", window.location.href);
    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    setRestaurant(null);
    setQueue([]);
    const fetchRestaurant = async () => {
      const docSnap = await getDoc(doc(db, "restaurants", restaurantId));
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Restaurant;
        setRestaurant(data);

        // Check if subscription is expired
        let expired = false;
        if (data.subscriptionStatus === "none" || !data.subscriptionStatus) {
          expired = true;
        } else if (data.subscriptionStatus === "trial") {
          const trialEnd = new Date(data.trialEndDate || "");
          if (trialEnd < new Date()) {
            expired = true;
          }
        } else if (data.subscriptionStatus === "active") {
          const expiry = new Date(data.paymentExpiryDate || "");
          if (expiry < new Date()) {
            expired = true;
          }
        }
        setIsSubscriptionExpired(expired);
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
    if (!restaurantId) return;
    try {
      const entryRef = doc(db, "restaurants", restaurantId, "queue", id);

      // If status is "called", send push notification
      if (status === "called") {
        const entrySnap = await getDoc(entryRef);
        if (entrySnap.exists()) {
          const data = entrySnap.data();
          if (data.fcmToken) {
            try {
              await fetch("/api/notifications/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  token: data.fcmToken,
                  restaurantName: restaurant?.name,
                  restaurantId: restaurantId,
                }),
              });
            } catch (err) {
              console.error("Failed to trigger push notification API:", err);
            }
          }
        }
      }

      await updateDoc(entryRef, {
        status,
      });

      if (status === "called") {
        toast.success("Customer called!");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status.");
    }
  };

  const deleteEntry = async (id: string) => {
    if (!restaurantId) return;
    await deleteDoc(doc(db, "restaurants", restaurantId, "queue", id));
  };

  const exportHistory = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = queue.filter((e) => {
      if (e.status !== "completed") return false;
      const date = e.createdAt?.toDate ? e.createdAt.toDate() : new Date();
      return date >= start && date <= end;
    });

    if (filtered.length === 0) return;

    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Token,Name,Phone,Members,Date,Time\n" +
      filtered
        .map((e) => {
          const date = e.createdAt?.toDate ? e.createdAt.toDate() : new Date();
          return `${e.tokenNumber},${e.customerName},${e.customerPhone},${e.members || "1"},${date.toLocaleDateString()},${date.toLocaleTimeString()}`;
        })
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${restaurant?.name || "restaurant"}-history-${startDate}-to-${endDate}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const setTodayRange = () => {
    const today = new Date().toISOString().split("T")[0];
    setExportStartDate(today);
    setExportEndDate(today);
  };

  const setYesterdayRange = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split("T")[0];
    setExportStartDate(yStr);
    setExportEndDate(yStr);
  };

  const handleLogout = async () => {
    try {
      if (onLogout) {
        onLogout();
      } else {
        localStorage.removeItem("mockUser");
        await signOut(auth);
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const baseUrl =
    (import.meta as any).env.VITE_APP_URL || window.location.origin;
  const cleanBaseUrl = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const joinUrl = `${cleanBaseUrl}/join?restaurantId=${restaurantId}`;

  const [copySuccess, setCopySuccess] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  if (!restaurant) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const activeQueue = queue.filter((e) => e.status !== "completed");
  const historyQueue = queue.filter((e) => e.status === "completed");

  const filteredHistory = historyQueue
    .filter((entry) => {
      if (!filterDate) return true;
      const entryDate = entry.createdAt?.toDate
        ? entry.createdAt.toDate()
        : new Date();
      return entryDate.toISOString().split("T")[0] === filterDate;
    })
    .slice()
    .reverse();

  const totalPages = Math.ceil(filteredHistory.length / recordsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage,
  );

  return (
    <div className="min-h-[screen] bg-linear-to-b from-slate-200 to-white">
      {/* Subscription Expiry Modal */}
      <AnimatePresence>
        {isSubscriptionExpired && (
          <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] p-4 max-w-md w-full shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-2">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-2">
                Account Inactive
              </h2>
              <p className="text-slate-500 text-sm mb-4 leading-relaxed">
                Your subscription has expired. Please subscribe to reactivate
                your account and continue managing your queue.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => navigate(`/subscription/${restaurantId}`)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-5 h-5" /> Subscribe Now
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold text-lg hover:bg-slate-200 transition-all"
                >
                  Logout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="w-full pt-4 sm:pt-2 px-4 sm:px-6 lg:px-8 xl:px-16 2xl:px-24 pb-4">
        {/* Export Modal */}
        <AnimatePresence>
          {showExportModal && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white w-full max-w-md rounded-4xl p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Export History
                  </h3>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4 mb-8">
                  <button
                    onClick={setTodayRange}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-left transition-all border ${
                      exportStartDate ===
                        new Date().toISOString().split("T")[0] &&
                      exportEndDate === new Date().toISOString().split("T")[0]
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                        : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={setYesterdayRange}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-left transition-all border ${
                      exportStartDate ===
                        new Date(Date.now() - 86400000)
                          .toISOString()
                          .split("T")[0] &&
                      exportEndDate ===
                        new Date(Date.now() - 86400000)
                          .toISOString()
                          .split("T")[0]
                        ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                        : "bg-white border-slate-100 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Yesterday
                  </button>

                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      Custom Range
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={exportStartDate}
                          onChange={(e) => setExportStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={exportEndDate}
                          onChange={(e) => setExportEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => exportHistory(exportStartDate, exportEndDate)}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <FileDown className="w-5 h-5" /> Download CSV
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Header Section */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/60 shadow-sm mb-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3">
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-indigo-600 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-100 shrink-0">
                  <Store className="w-5 h-5 sm:w-6  text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-4xl capitalize font-black text-slate-900 tracking-tight leading-tight">
                    {restaurant?.name}
                  </h1>
                  <p className="text-slate-500 flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-base mt-0.5 sm:mt-1">
                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-indigo-500"></span>
                    {restaurant?.address}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end flex-wrap gap-2 sm:gap-4">
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("queue")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "queue" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("subscription")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "subscription" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  Subscription
                </button>
              </div>
              <button
                onClick={() => setShowQR(!showQR)}
                className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-sm border ${
                  showQR
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-200"
                    : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
                }`}
              >
                <QrCode className="w-4 h-4  sm:w-5 " />{" "}
                {showQR ? "Hide QR" : "Show QR"}
              </button>
              {/* <LiveClock /> */}
            </div>
          </div>
        </div>

        <QRDialog
          open={showQR}
          onClose={() => setShowQR(false)}
          joinUrl={joinUrl}
          restaurantName={restaurant?.name}
        />

        {activeTab === "queue" ? (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-4 md:grid-cols-4 gap-2 sm:gap-6 mb-2 sm:mb-2">
              {[
                {
                  label: "Total",
                  value: queue.filter((e) => {
                    const d = e.createdAt?.toDate
                      ? e.createdAt.toDate()
                      : new Date();
                    return (
                      d.toISOString().split("T")[0] ===
                      new Date().toISOString().split("T")[0]
                    );
                  }).length,
                  icon: Users,
                  bgColor: "bg-indigo-50",
                  textColor: "text-indigo-600",
                },
                {
                  label: "Waiting",
                  value: activeQueue.filter((e) => e.status === "waiting")
                    .length,
                  icon: Clock,
                  bgColor: "bg-amber-50",
                  textColor: "text-amber-600",
                },
                {
                  label: "Called",
                  value: activeQueue.filter((e) => e.status === "called")
                    .length,
                  icon: Users,
                  bgColor: "bg-blue-50",
                  textColor: "text-blue-600",
                },
                {
                  label: "Completed",
                  value: historyQueue.filter((e) => {
                    const d = e.createdAt?.toDate
                      ? e.createdAt.toDate()
                      : new Date();
                    return (
                      d.toISOString().split("T")[0] ===
                      new Date().toISOString().split("T")[0]
                    );
                  }).length,
                  icon: CheckCircle2,
                  bgColor: "bg-green-50",
                  textColor: "text-green-600",
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-3 flex flex-col items-center justify-center shadow-sm"
                >
                  <div className="items-center  flex-row gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div
                      className={`p-1.5 sm:p-2 flex items-center justify-center rounded-lg sm:rounded-xl ${stat.bgColor} ${stat.textColor}`}
                    >
                      <stat.icon className="w-3.5 h-3.5 sm:w-4 " />
                    </div>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {stat.label}
                    </span>
                  </div>
                  <div className="text-xl sm:text-3xl font-black text-slate-900">
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Current Queue Section */}
              <div className="xl:col-span-5 space-y-4 sm:space-y-5">
                <div className="bg-white p-5 sm:p-8 rounded-3xl sm:rounded-3xl border border-slate-100 shadow-sm min-h-100 sm:min-h-106 flex flex-col">
                  <div className="flex items-center justify-between mb-5 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="bg-indigo-600 p-2 sm:p-3 rounded-xl shadow-md">
                        <Users className="w-5 h-5  text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                          Current Queue
                        </h2>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                          Live Updates
                        </p>
                      </div>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 text-[8px] sm:text-[10px] font-black px-3 sm:px-4 py-1.5 sm:py-2 rounded-full uppercase tracking-widest border border-indigo-100/50">
                      {activeQueue.length} Waiting
                    </span>
                  </div>

                  <div className="space-y-2 sm:space-y-3 flex-1">
                    <AnimatePresence mode="popLayout">
                      {activeQueue.map((entry) => (
                        <motion.div
                          layout
                          key={entry.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={`p-3 sm:p-4 rounded-3xl border flex items-center justify-between transition-all relative overflow-hidden ${
                            entry.status === "called"
                              ? "bg-amber-50 border-amber-200 shadow-md"
                              : "bg-white border-slate-100 hover:border-indigo-100"
                          }`}
                        >
                          {/* LEFT SIDE */}
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            {/* Token */}
                            <div
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-bold text-base sm:text-lg shrink-0 ${
                                entry.status === "called"
                                  ? "bg-amber-500 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {entry.tokenNumber}
                            </div>

                            {/* Name + phone */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 min-w-0">
                                {/* NAME (truncate fix 🔥) */}
                                <h4 className="font-semibold text-slate-900 text-sm sm:text-base truncate max-w-30 sm:max-w-45">
                                  {entry.customerName}
                                </h4>

                                {/* Members */}
                                <div className="flex items-center gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 shrink-0">
                                  <span className="text-[10px] font-bold text-indigo-600">
                                    {entry.members || "1"}
                                  </span>
                                  <Users className="w-3 h-3 text-indigo-400" />
                                </div>
                              </div>

                              <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                                {entry.customerPhone}
                              </p>
                            </div>
                          </div>

                          {/* RIGHT SIDE BUTTONS */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {entry.status === "waiting" ? (
                              <button
                                onClick={() => updateStatus(entry.id, "called")}
                                className="bg-indigo-600 text-white px-3 sm:px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all whitespace-nowrap"
                              >
                                Call
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  updateStatus(entry.id, "completed")
                                }
                                className="bg-green-600 text-white px-3 sm:px-5 py-2 rounded-xl text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-1 whitespace-nowrap"
                              >
                                <CheckCircle2 className="w-3 h-3" /> Done
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    {/* EMPTY STATE */}
                    {activeQueue.length === 0 && (
                      <div className="flex-1 flex flex-col items-center justify-center py-16 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <div className="bg-white w-14 h-14 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                          <Users className="w-6 h-6 text-slate-200" />
                        </div>
                        <h3 className="text-slate-900 font-semibold text-sm">
                          Queue is empty
                        </h3>
                        <p className="text-slate-400 text-xs mt-1 text-center max-w-xs">
                          Customers will appear here when they join.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent History Section */}
              <div className="xl:col-span-7 space-y-6">
                <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="bg-indigo-600 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-100">
                        <Clock className="w-5 h-5 sm:w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                          Recent History
                        </h2>
                        <p className="text-slate-400 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] mt-0.5 sm:mt-1">
                          Archive
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="relative flex-1 sm:flex-none">
                        <Calendar className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="date"
                          value={filterDate}
                          onChange={(e) => {
                            setFilterDate(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="w-full sm:w-auto pl-10 pr-3 py-2.5 sm:py-3 bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        />
                      </div>
                      <button
                        onClick={() => setShowExportModal(true)}
                        className="flex items-center gap-1.5 sm:gap-2 bg-white border border-slate-200 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                      >
                        <FileDown className="w-3.5 h-3.5 sm:w-4" /> Export
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-4xl border border-slate-50">
                    <table className="w-full text-left border-collapse min-w-150">
                      <thead>
                        <tr className="bg-slate-50/80">
                          <th className="px-4 sm:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Token
                          </th>
                          <th className="px-4 sm:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Customer
                          </th>
                          <th className="px-4 sm:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hidden sm:table-cell">
                            Date
                          </th>
                          <th className="px-4 sm:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            Time
                          </th>
                          <th className="px-4 sm:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {paginatedHistory.map((entry) => {
                          const date = entry.createdAt?.toDate
                            ? entry.createdAt.toDate()
                            : new Date();
                          return (
                            <tr
                              key={entry.id}
                              className="hover:bg-indigo-50/30 transition-colors group"
                            >
                              <td className="px-4 sm:px-8 py-4 sm:py-6">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-white flex items-center justify-center font-black text-indigo-600 text-xs sm:text-sm border border-slate-100 shadow-sm group-hover:border-indigo-200 transition-colors">
                                  {entry.tokenNumber}
                                </div>
                              </td>
                              <td className="px-4 sm:px-8 py-4 sm:py-6">
                                <div className="flex items-center gap-1 flex-wrap">
                                  <div className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-25 sm:max-w-none">
                                    {entry.customerName}
                                  </div>
                                  <div className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded-md shrink-0 border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-500">
                                      {entry.members || "1"}
                                    </span>
                                    <Users className="w-2.5 h-2.5 text-slate-400" />
                                  </div>
                                </div>
                                <div className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 truncate max-w-25 sm:max-w-none">
                                  {entry.customerPhone}
                                </div>
                              </td>
                              <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm text-slate-600 font-bold hidden sm:table-cell">
                                {date.toLocaleDateString([], {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </td>
                              <td className="px-4 sm:px-8 py-4 sm:py-6 text-xs sm:text-sm text-slate-600 font-bold">
                                {date.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </td>
                              <td className="px-4 sm:px-8 py-4 sm:py-6 text-right">
                                <button
                                  onClick={() => deleteEntry(entry.id)}
                                  className="p-2 sm:p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-2xl transition-all"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-4 h-4 sm:w-5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredHistory.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-16 text-center">
                              <div className="flex flex-col items-center justify-center gap-3">
                                <div className="bg-slate-50 p-4 rounded-2xl">
                                  <Calendar className="w-8 h-8 text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-bold text-sm">
                                  No completed entries for this date.
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100 pt-8 gap-6">
                      <p className="text-sm text-slate-400 font-black uppercase tracking-widest">
                        Page{" "}
                        <span className="text-slate-900">{currentPage}</span> of{" "}
                        <span className="text-slate-900">{totalPages}</span>
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className="px-6 py-3 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 transition-all active:scale-95"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages),
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="px-6 py-3 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 transition-all active:scale-95"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl sm:rounded-4xl p-4 sm:p-6 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <div className="bg-indigo-50 p-2 rounded-xl shrink-0">
                  <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-base sm:text-xl font-black text-slate-900 leading-tight">
                    Subscription
                  </h2>
                  <p className="text-slate-500 font-medium text-[10px] sm:text-sm">
                    Manage your plan and billing
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
                <div className="space-y-3 sm:space-y-4">
                  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Current Plan
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm sm:text-lg font-black text-slate-900 truncate">
                        {restaurant?.subscriptionPlan === "free_trial"
                          ? "14-Day Trial"
                          : "Monthly Premium"}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[7px] sm:text-[9px] font-black uppercase tracking-widest shrink-0 ${
                          restaurant?.subscriptionStatus === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {restaurant?.subscriptionStatus}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                    <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      {restaurant?.subscriptionStatus === "trial"
                        ? "Ends On"
                        : "Next Billing"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <h4 className="text-sm sm:text-lg font-black text-slate-900">
                        {restaurant?.subscriptionStatus === "trial"
                          ? new Date(
                              restaurant?.trialEndDate || "",
                            ).toLocaleDateString()
                          : new Date(
                              restaurant?.paymentExpiryDate || "",
                            ).toLocaleDateString()}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-50 p-5 sm:p-6 rounded-xl sm:rounded-2xl border border-indigo-100 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-sm sm:text-lg font-black text-indigo-900 mb-1">
                      Need more?
                    </h4>
                    <p className="text-indigo-700/70 font-medium text-[10px] sm:text-sm leading-relaxed">
                      Upgrade for more features or contact us for enterprise
                      solutions.
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/subscription/${restaurantId}`)}
                    className="w-full bg-indigo-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 flex items-center justify-center gap-2 text-xs sm:text-sm"
                  >
                    Change Plan{" "}
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </div>

              {restaurant?.subscriptionStatus === "trial" && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-amber-50 border border-amber-100 rounded-xl sm:rounded-2xl flex items-start gap-2 sm:gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-amber-900 text-xs sm:text-sm">
                      Trial Active
                    </h4>
                    <p className="text-amber-700 text-[10px] sm:text-xs mt-0.5 font-medium leading-relaxed">
                      Your trial ends soon. Upgrade now to keep your digital
                      queue running smoothly.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantDashboard;
