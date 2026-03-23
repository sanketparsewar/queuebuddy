import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  getDoc, 
  updateDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  QrCode, 
  Users, 
  CheckCircle2, 
  Clock, 
  Store,
  Download,
  Calendar,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import LiveClock from '../components/LiveClock';
import { Restaurant, QueueEntry } from '../types';

const RestaurantDashboard = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 20;

  useEffect(() => {
    if (!restaurantId) return;
    setRestaurant(null);
    setQueue([]);
    const fetchRestaurant = async () => {
      const docSnap = await getDoc(doc(db, 'restaurants', restaurantId));
      if (docSnap.exists()) {
        setRestaurant({ id: docSnap.id, ...docSnap.data() } as Restaurant);
      }
    };
    fetchRestaurant();

    const q = query(
      collection(db, 'restaurants', restaurantId, 'queue'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QueueEntry));
      setQueue(entries);
    });

    return () => unsubscribe();
  }, [restaurantId]);

  const updateStatus = async (id: string, status: 'called' | 'completed') => {
    if (!restaurantId) return;
    await updateDoc(doc(db, 'restaurants', restaurantId, 'queue', id), { status });
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 50, 900, 900);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `${restaurant?.name || 'restaurant'}-qr-code.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const exportHistory = () => {
    const completed = queue.filter(e => e.status === 'completed');
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Token,Name,Phone,Date,Time\n"
      + completed.map(e => {
          const date = e.createdAt?.toDate ? e.createdAt.toDate() : new Date();
          return `${e.tokenNumber},${e.customerName},${e.customerPhone},${date.toLocaleDateString()},${date.toLocaleTimeString()}`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${restaurant?.name || 'restaurant'}-history.csv`);
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

  const activeQueue = queue.filter(e => e.status !== 'completed');
  const historyQueue = queue.filter(e => e.status === 'completed');

  const filteredHistory = historyQueue
    .filter(entry => {
      if (!filterDate) return true;
      const entryDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date();
      return entryDate.toISOString().split('T')[0] === filterDate;
    })
    .slice()
    .reverse();

  const totalPages = Math.ceil(filteredHistory.length / recordsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto mt-8 px-6 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">{restaurant?.name}</h1>
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
            <QrCode className="w-5 h-5" /> {showQR ? 'Hide QR' : 'Show QR'}
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
                Place this QR code at your reception counter for customers to join the queue.
              </p>
              <a href={joinUrl} target="_blank" rel="noreferrer" className="mt-4 text-indigo-600 text-sm font-bold hover:underline">
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
                <h2 className="text-2xl font-black text-gray-900">Current Queue</h2>
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
                    entry.status === 'called' 
                      ? 'bg-amber-50 border-amber-200 shadow-md scale-[1.02]' 
                      : 'bg-white border-gray-100 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm ${
                      entry.status === 'called' ? 'bg-amber-500 text-white' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {entry.tokenNumber}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{entry.customerName}</h4>
                      <p className="text-sm text-gray-500 font-medium">{entry.customerPhone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {entry.status === 'waiting' ? (
                      <button 
                        onClick={() => updateStatus(entry.id, 'called')}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-sm"
                      >
                        Call
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateStatus(entry.id, 'completed')}
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
                  <h3 className="text-gray-900 font-bold">No customers in the queue yet.</h3>
                  <p className="text-gray-400 text-sm mt-1">When customers join, they will appear here in real-time.</p>
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
                <h2 className="text-2xl font-black text-gray-900">Recent History</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => {
                      setFilterDate(e.target.value);
                      setCurrentPage(1);
                    }}
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
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Token</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Customer</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedHistory.map((entry) => {
                    const date = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date();
                    return (
                      <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-sm border border-indigo-100">
                            {entry.tokenNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{entry.customerName}</div>
                          <div className="text-xs text-gray-400">{entry.customerPhone}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                          {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                        No completed entries for this date.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-6">
                <p className="text-sm text-gray-500 font-medium">
                  Showing <span className="text-gray-900">{(currentPage - 1) * recordsPerPage + 1}</span> to <span className="text-gray-900">{Math.min(currentPage * recordsPerPage, filteredHistory.length)}</span> of <span className="text-gray-900">{filteredHistory.length}</span> results
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
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
