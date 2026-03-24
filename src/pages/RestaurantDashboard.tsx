import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
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
import { db } from "../firebase";
import {
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  Store,
  Download,
  Calendar,
  FileDown,
  Trash2,
  ChevronDown,
  Filter,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import LiveClock from "../components/LiveClock";
import { Restaurant, QueueEntry } from "../types";

const RestaurantDashboard = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [showQR, setShowQR] = useState(false);
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
    if (!restaurantId) return;
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
    if (!restaurantId) return;
    await updateDoc(doc(db, "restaurants", restaurantId, "queue", id), {
      status,
    });
  };

  const deleteEntry = async (id: string) => {
    if (!restaurantId) return;
    await deleteDoc(doc(db, "restaurants", restaurantId, "queue", id));
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
      "Token,Name,Phone,Date,Time\n" +
      filtered
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto pt-6 sm:pt-10 px-4 sm:px-6 lg:px-8 pb-24">
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
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-200/60 shadow-sm mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-2xl shadow-xl shadow-indigo-100 shrink-0">
                  <Store className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                    {restaurant?.name}
                  </h1>
                  <p className="text-slate-500 flex items-center gap-2 font-medium text-sm sm:text-base mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                    {restaurant?.address}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                onClick={() => setShowQR(!showQR)}
                className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all shadow-sm border ${
                  showQR
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-indigo-200"
                    : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
                }`}
              >
                <QrCode className="w-5 h-5" />{" "}
                {showQR ? "Hide QR Code" : "Show QR Code"}
              </button>
              <div className="h-10 w-px bg-slate-100 hidden lg:block mx-2"></div>
              <LiveClock />
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-10">
          {[
            {
              label: "Total Today",
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
              value: activeQueue.filter((e) => e.status === "waiting").length,
              icon: Clock,
              bgColor: "bg-amber-50",
              textColor: "text-amber-600",
            },
            {
              label: "Called",
              value: activeQueue.filter((e) => e.status === "called").length,
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
              className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`p-2 rounded-xl ${stat.bgColor} ${stat.textColor}`}
                >
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {stat.label}
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {showQR && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="mb-12"
          >
            <div className="bg-white p-8 sm:p-12 rounded-[3rem] border border-indigo-100 shadow-2xl shadow-indigo-100/50 flex flex-col items-center text-center max-w-3xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
              <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-8">
                Customer Registration Point
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-xl border border-slate-50 mb-10 relative group">
                <div className="absolute -inset-4 bg-indigo-600/5 rounded-[3rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative">
                  <QRCodeSVG
                    id="qr-code-svg"
                    value={joinUrl}
                    size={window.innerWidth < 640 ? 200 : 280}
                  />
                </div>
              </div>

              {/* URL Warning */}
              {baseUrl.includes("ais-dev-") && (
                <div className="mb-8 p-5 bg-amber-50 border border-amber-100 rounded-3xl text-amber-700 text-sm font-medium max-w-md">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 p-1.5 rounded-lg mt-0.5">
                      <Users className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Private Dev URL Detected</p>
                      <p className="mt-1 text-xs opacity-80 leading-relaxed">
                        To test on other devices, please use the{" "}
                        <strong>Shared App URL</strong> from AI Studio. The
                        current URL is restricted to your session.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mb-8 w-full sm:w-auto">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center justify-center gap-3 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 group active:scale-95"
                >
                  <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />{" "}
                  Download QR
                </button>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center justify-center gap-3 px-10 py-4 rounded-2xl font-black transition-all shadow-sm border ${
                    copySuccess
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "bg-white border-slate-200 text-slate-700 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> Copied!
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" /> Copy Link
                    </>
                  )}
                </button>
              </div>
              <p className="text-slate-500 font-medium max-w-md leading-relaxed mb-6 text-sm">
                Display this QR code at your reception. Customers scan it to
                join your digital queue instantly.
              </p>
              <div className="bg-slate-50 px-6 py-3 rounded-xl border border-slate-100 w-full max-w-md">
                <code className="text-indigo-600 text-xs font-bold break-all">
                  {joinUrl}
                </code>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Current Queue Section */}
          <div className="xl:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-150 flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                      Current Queue
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                      Live Updates
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest border border-indigo-100/50">
                    {activeQueue.length} Waiting
                  </span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <AnimatePresence mode="popLayout">
                  {activeQueue.map((entry) => (
                    <motion.div
                      layout
                      key={entry.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`p-5 sm:p-6 rounded-4xl border-2 flex items-center justify-between transition-all relative overflow-hidden group ${
                        entry.status === "called"
                          ? "bg-amber-50/50 border-amber-200 shadow-xl shadow-amber-100/20 scale-[1.02] z-10"
                          : "bg-white border-slate-50 hover:border-indigo-100 hover:shadow-md"
                      }`}
                    >
                      {entry.status === "called" && (
                        <motion.div
                          animate={{ opacity: [0.05, 0.15, 0.05] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-amber-400"
                        />
                      )}
                      <div className="flex items-center gap-4 sm:gap-5 relative z-10">
                        <div
                          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl shadow-sm transition-all ${
                            entry.status === "called"
                              ? "bg-amber-500 text-white ring-4 ring-amber-100"
                              : "bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105"
                          }`}
                        >
                          {entry.tokenNumber}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-900 text-lg sm:text-xl truncate leading-tight">
                            {entry.customerName}
                          </h4>
                          <p className="text-sm text-slate-400 font-medium mt-0.5 truncate">
                            {entry.customerPhone}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10">
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        {entry.status === "waiting" ? (
                          <button
                            onClick={() => updateStatus(entry.id, "called")}
                            className="bg-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                          >
                            Call
                          </button>
                        ) : (
                          <button
                            onClick={() => updateStatus(entry.id, "completed")}
                            className="bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm font-black hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center gap-2 active:scale-95"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Done
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {activeQueue.length === 0 && (
                  <div className="flex-1 flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200/60">
                    <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                      <Users className="w-10 h-10 text-slate-200" />
                    </div>
                    <h3 className="text-slate-900 font-bold text-xl">
                      Queue is empty
                    </h3>
                    <p className="text-slate-400 text-sm mt-2 max-w-55 text-center leading-relaxed font-medium">
                      New customers will appear here automatically as they join.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent History Section */}
          <div className="xl:col-span-7 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 leading-tight">
                      Recent History
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                      Archive
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 sm:flex-none">
                    <Calendar className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => {
                        setFilterDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full sm:w-auto pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm active:scale-95"
                  >
                    <FileDown className="w-4 h-4" /> Export
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-4xl border border-slate-50">
                <table className="w-full text-left border-collapse min-w-150">
                  <thead>
                    <tr className="bg-slate-50/80">
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Token
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Customer
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Date
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        Time
                      </th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">
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
                          <td className="px-8 py-6">
                            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black text-indigo-600 text-sm border border-slate-100 shadow-sm group-hover:border-indigo-200 transition-colors">
                              {entry.tokenNumber}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="font-bold text-slate-900 text-base">
                              {entry.customerName}
                            </div>
                            <div className="text-xs text-slate-400 font-medium mt-0.5">
                              {entry.customerPhone}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-sm text-slate-600 font-bold">
                            {date.toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-8 py-6 text-sm text-slate-600 font-bold">
                            {date.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button
                              onClick={() => deleteEntry(entry.id)}
                              className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Record"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredHistory.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-3">
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
                    Page <span className="text-slate-900">{currentPage}</span>{" "}
                    of <span className="text-slate-900">{totalPages}</span>
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
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
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
      </div>
    </div>
  );
};

export default RestaurantDashboard;
