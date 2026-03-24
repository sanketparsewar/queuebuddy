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
  const joinUrl = `${baseUrl}/join?restaurantId=${restaurantId}`;

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
    <div className="max-w-7xl mx-auto mt-8 px-6 pb-12">
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
                      : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50"
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
                      : "bg-white border-gray-100 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Yesterday
                </button>

                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">
                    Custom Range
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={exportStartDate}
                        onChange={(e) => setExportStartDate(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={exportEndDate}
                        onChange={(e) => setExportEndDate(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
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
          <button
            onClick={() => setShowQR(!showQR)}
            className="flex items-center gap-2 bg-white border border-gray-200 px-5 py-3 rounded-2xl text-gray-700 font-bold hover:bg-gray-50 transition-all shadow-sm"
          >
            <QrCode className="w-5 h-5" /> {showQR ? "Hide QR" : "Show QR"}
          </button>
          <LiveClock />
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
            <div className="bg-white p-6 sm:p-10 rounded-4xl sm:rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col items-center text-center max-w-2xl mx-auto">
              <h3 className="text-xl font-bold mb-6">Customer Scan QR</h3>
              <div className="bg-white p-4 sm:p-6 rounded-3xl shadow-inner border border-gray-50 mb-8">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={joinUrl}
                  size={window.innerWidth < 640 ? 180 : 240}
                />
              </div>

              {/* URL Warning */}
              {baseUrl.includes("ais-dev-") && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-sm font-medium max-w-sm">
                  <p className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>
                      Note: You are using the <strong>Private Dev URL</strong>.
                    </span>
                  </p>
                  <p className="mt-1 text-xs opacity-80">
                    To test on other phones, please use the{" "}
                    <strong>Shared App URL</strong> from AI Studio to avoid 403
                    errors.
                  </p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={downloadQRCode}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  <Download className="w-5 h-5" /> Download QR
                </button>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold transition-all shadow-sm border ${
                    copySuccess
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {copySuccess ? "Copied!" : "Copy Link"}
                </button>
              </div>
              <p className="text-sm text-gray-500 max-w-sm leading-relaxed px-4">
                Place this QR code at your reception counter for customers to
                join the queue.
              </p>
              <a
                href={joinUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 text-indigo-600 text-sm font-bold hover:underline break-all px-4"
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
          <div className="bg-white p-6 sm:p-8 rounded-4xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm min-h-100 sm:min-h-125">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  Current Queue
                </h2>
              </div>
              <span className="bg-indigo-600 text-white text-[10px] sm:text-xs font-black px-2 sm:px-3 py-1 sm:py-1.5 rounded-full uppercase tracking-wider">
                {activeQueue.length} Active
              </span>
            </div>

            <div className="space-y-4">
              {activeQueue.map((entry) => (
                <motion.div
                  layout
                  key={entry.id}
                  className={`p-4 sm:p-6 rounded-2xl sm:rounded-3xl border flex items-center justify-between transition-all ${
                    entry.status === "called"
                      ? "bg-amber-50 border-amber-200 shadow-md scale-[1.02]"
                      : "bg-white border-gray-100 hover:border-indigo-200"
                  }`}
                >
                  <div className="flex items-center gap-3 sm:gap-5">
                    <div
                      className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center font-black text-lg sm:text-xl shadow-sm ${
                        entry.status === "called"
                          ? "bg-amber-500 text-white"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {entry.tokenNumber}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                        {entry.customerName}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium truncate">
                        {entry.customerPhone}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Delete Record"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    {entry.status === "waiting" ? (
                      <button
                        onClick={() => updateStatus(entry.id, "called")}
                        className="bg-indigo-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
                      >
                        Call
                      </button>
                    ) : (
                      <button
                        onClick={() => updateStatus(entry.id, "completed")}
                        className="bg-green-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-green-700 transition-all shadow-sm flex items-center gap-1 sm:gap-2"
                      >
                        <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" /> Done
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
              {activeQueue.length === 0 && (
                <div className="text-center py-16 sm:py-20 bg-gray-50/50 rounded-4xl border-2 border-dashed border-gray-100">
                  <div className="bg-white w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-gray-200" />
                  </div>
                  <h3 className="text-gray-900 font-bold text-sm sm:text-base">
                    No customers in the queue yet.
                  </h3>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    When customers join, they will appear here in real-time.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent History Section */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-4xl sm:rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-50 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-gray-900">
                  Recent History
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 sm:flex-none">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full sm:w-auto pl-9 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => setShowExportModal(true)}
                  className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
                >
                  <FileDown className="w-4 h-4" /> Export
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-gray-50">
              <table className="w-full text-left border-collapse min-w-125">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
                      Token
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
                      Customer
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
                      Date
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest">
                      Time
                    </th>
                    <th className="px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-black text-gray-400 uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedHistory.map((entry) => {
                    const date = entry.createdAt?.toDate
                      ? entry.createdAt.toDate()
                      : new Date();
                    return (
                      <tr
                        key={entry.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-4 sm:px-6 py-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-xs sm:text-sm border border-indigo-100">
                            {entry.tokenNumber}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <div className="font-bold text-gray-900 text-sm sm:text-base">
                            {entry.customerName}
                          </div>
                          <div className="text-[10px] sm:text-xs text-gray-400">
                            {entry.customerPhone}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 font-medium">
                          {date.toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-600 font-medium">
                          {date.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right">
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-gray-400 italic text-sm"
                      >
                        No completed entries for this date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 pt-6 gap-4">
                <p className="text-xs sm:text-sm text-gray-500 font-medium">
                  Showing{" "}
                  <span className="text-gray-900">
                    {(currentPage - 1) * recordsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="text-gray-900">
                    {Math.min(
                      currentPage * recordsPerPage,
                      filteredHistory.length,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="text-gray-900">
                    {filteredHistory.length}
                  </span>{" "}
                  results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 sm:px-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 sm:px-4 py-2 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
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
  );
};

export default RestaurantDashboard;
