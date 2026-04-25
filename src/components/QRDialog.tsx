import { QRCodeSVG } from "qrcode.react";
import { motion, AnimatePresence } from "motion/react";
import { Download, QrCode, CheckCircle2, X } from "lucide-react";
import { useState } from "react";
import { PRODUCT_NAME } from "../utils/constants";

type Props = {
  open: boolean;
  onClose: () => void;
  joinUrl: string;
  restaurantName?: string;
};

const QRDialog = ({ open, onClose, joinUrl, restaurantName }: Props) => {
  const [copySuccess, setCopySuccess] = useState(false);

  const downloadQRCode = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      const width = 1000;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, width, height);

        // Restaurant Name
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 60px system-ui";
        ctx.textAlign = "center";
        ctx.fillText(restaurantName || "Restaurant", width / 2, 120);

        // QR
        const qrSize = 700;
        const qrX = (width - qrSize) / 2;
        const qrY = 220;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // 3. Footer (Bottom)
        const footerY = 1050;
        const footerText = PRODUCT_NAME;
        ctx.font = "bold 50px system-ui, -apple-system, sans-serif";
        const textWidth = ctx.measureText(footerText).width;
        const iconSize = 44;
        const gap = 20;
        const totalFooterWidth = iconSize + gap + textWidth;
        const startX = (width - totalFooterWidth) / 2;

        // Draw Icon (Clock/Logo representation)
        const iconX = startX + iconSize / 2;
        const iconCenterY = footerY;

        // Outer circle
        ctx.beginPath();
        ctx.arc(iconX, iconCenterY, iconSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = "#4f46e5"; // indigo-600
        ctx.fill();

        // Clock hands
        ctx.beginPath();
        ctx.moveTo(iconX, iconCenterY - iconSize / 4);
        ctx.lineTo(iconX, iconCenterY);
        ctx.lineTo(iconX + iconSize / 4, iconCenterY);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();

        // Draw Text
        ctx.fillStyle = "#4f46e5";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(footerText, startX + iconSize + gap, footerY);

        const pngFile = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${restaurantName || "restaurant"}-qr.png`;
        link.href = pngFile;
        link.click();
      }
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl relative"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-xl mt-2 text-xs font-black uppercase tracking-widest">
                Print and place it at your entrance
              </div>

              <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border mt-6 mb-6">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={joinUrl}
                  size={window.innerWidth < 640 ? 180 : 240}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full mb-4">
                <button
                  onClick={downloadQRCode}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 rounded-xl font-bold"
                >
                  <Download className="w-4 h-4" /> Download
                </button>

                <button
                  onClick={copyToClipboard}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-bold border ${
                    copySuccess
                      ? "bg-green-50 border-green-200 text-green-600"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  {copySuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Copied
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" /> Copy Link
                    </>
                  )}
                </button>
              </div>

              <p className="text-slate-500 text-sm">
                Customers scan it to join your digital queue instantly
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QRDialog;
