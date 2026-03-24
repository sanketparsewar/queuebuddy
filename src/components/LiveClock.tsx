import React, { useState, useEffect } from "react";
import { Clock } from "lucide-react";

const LiveClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex items-center gap-4 min-w-[240px]">
      <div className="bg-indigo-50 p-3 rounded-xl">
        <Clock className="w-6 h-6 text-indigo-600" />
      </div>
      <div className="text-right flex-1">
        <div className="text-2xl font-black text-slate-900 tabular-nums tracking-tight">
          {time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
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

export default LiveClock;
