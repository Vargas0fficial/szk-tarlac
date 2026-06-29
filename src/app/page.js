"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, useRef } from 'react';

const STATUS_STYLES = {
  Confirmed: 'bg-green-100 text-green-700 border border-green-200',
  Pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  'On Going': 'bg-blue-100 text-blue-700 border border-blue-200',
  Completed: 'bg-gray-100 text-gray-600 border border-gray-200',
  Cancelled: 'bg-red-100 text-red-700 border border-red-200',
};

const SLIDE_INTERVAL = 15000;
const COMPLETED_HIDE_DELAY = 2000;

// Calculate how many rows fit based on available screen height
const calculatePageSize = () => {
  if (typeof window === 'undefined') return 5;
  const screenHeight = window.innerHeight;
  const navHeight = 80;       // nav
  const headerHeight = 80;    // "Appointment List" + clock
  const tableHeaderHeight = 40; // thead
  const footerHeight = 100;   // footer + dots
  const rowHeight = screenHeight < 700 ? 44 : screenHeight < 1080 ? 52 : 60;
  const available = screenHeight - navHeight - headerHeight - tableHeaderHeight - footerHeight;
  const count = Math.floor(available / rowHeight);
  return Math.max(3, count);
};

export default function PublicPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [fade, setFade] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);
  const [hidingIds, setHidingIds] = useState(new Set());
  const [hiddenIds, setHiddenIds] = useState(new Set());
  const prevAppointmentsRef = useRef([]);

  // Clock
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Responsive page size based on screen height
  useEffect(() => {
    const update = () => {
      setPageSize(calculatePageSize());
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Detect newly Completed appointments and fade them out
  useEffect(() => {
    const prev = prevAppointmentsRef.current;

    appointments.forEach((appt) => {
      if (
        appt.status === 'Completed' &&
        !hiddenIds.has(appt._id) &&
        !hidingIds.has(appt._id)
      ) {
        const wasAlreadyCompleted = prev.find(
          (p) => p._id === appt._id && p.status === 'Completed'
        );

        if (!wasAlreadyCompleted) {
          setTimeout(() => {
            setHidingIds((prev) => new Set([...prev, appt._id]));
            setTimeout(() => {
              setHiddenIds((prev) => new Set([...prev, appt._id]));
              setHidingIds((prev) => {
                const next = new Set(prev);
                next.delete(appt._id);
                return next;
              });
            }, 1000);
          }, COMPLETED_HIDE_DELAY);
        }
      }
    });

    prevAppointmentsRef.current = appointments;
  }, [appointments]);

  // SSE Stream
  useEffect(() => {
    let eventSource = null;
    let watchdogTimer = null;

    const connectStream = () => {
      if (eventSource) eventSource.close();

      eventSource = new EventSource('/api/appointments/stream');

      const resetWatchdog = () => {
        if (watchdogTimer) clearTimeout(watchdogTimer);
        watchdogTimer = setTimeout(() => {
          console.log("Heartbeat lost. Automatically reconnecting stream in background...");
          connectStream();
        }, 35000);
      };

      resetWatchdog();

      eventSource.onmessage = (event) => {
        resetWatchdog();
        try {
          const payload = JSON.parse(event.data);
          if (payload && typeof payload === 'object') {
            if (Array.isArray(payload.data)) setAppointments(payload.data);
            else if (Array.isArray(payload)) setAppointments(payload);
          }
          setLoading(false);
        } catch (err) {
          console.error('Error parsing SSE payload:', err);
        }
      };

      eventSource.onerror = () => {
        resetWatchdog();
      };
    };

    window.__forceSilentStreamReconnect = () => {
      console.log("Table requested a silent stream reset...");
      connectStream();
    };

    connectStream();

    return () => {
      if (eventSource) eventSource.close();
      if (watchdogTimer) clearTimeout(watchdogTimer);
      delete window.__forceSilentStreamReconnect;
    };
  }, []);

  // Filter out fully hidden appointments
  const visibleAppointments = appointments.filter((a) => !hiddenIds.has(a._id));
  const totalPages = Math.max(1, Math.ceil(visibleAppointments.length / pageSize));

  // Auto slideshow
  useEffect(() => {
    if (totalPages <= 1) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPage((p) => (p >= totalPages ? 1 : p + 1));
        setFade(true);
      }, 600);
    }, SLIDE_INTERVAL);

    return () => clearInterval(interval);
  }, [totalPages]);

  // Reset to page 1 when appointments change
  useEffect(() => {
    setPage(1);
  }, [visibleAppointments.length]);

  const paginated = visibleAppointments.slice((page - 1) * pageSize, page * pageSize);

  const formatDateTime = (item) => {
    if (item.date && item.time) {
      const d = new Date(`${item.date}T${item.time}`);
      return {
        date: d.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    }
    return { date: '—', time: '—' };
  };

  // Dynamic row padding based on screen height
  const rowPadding = mounted
    ? window.innerHeight < 700
      ? 'px-3 py-1'
      : window.innerHeight < 1080
        ? 'px-3 py-2'
        : 'px-3 py-3'
    : 'px-3 py-2';

  return (
    <div className="h-screen bg-[#f4f7fa] font-sans flex flex-col overflow-hidden">

      {/* NAV */}
      <nav className="bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/szk.png" alt="Logo" className="h-14 w-auto object-contain" />
            <div className="border-l border-slate-300 pl-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">
                Service Management System
              </span>
              {process.env.NEXT_PUBLIC_BRANCH_NAME && (
                <span className="text-xs font-bold text-[#003399] uppercase tracking-widest block">
                  {process.env.NEXT_PUBLIC_BRANCH_NAME}
                </span>
              )}
            </div>
          </div>
          <span className="text-xs font-medium text-slate-400">Live Appointment Status</span>
        </div>
      </nav>

      {/* MAIN */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-4 w-full h-full flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Appointment List</h1>
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium select-none min-h-[40px]">
              {mounted ? (
                <>
                  <span className="text-[#0054a6] font-bold tracking-wider tabular-nums text-base">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-slate-500 font-semibold">
                    {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: '2-digit', year: 'numeric' })}
                  </span>
                </>
              ) : (
                <span className="text-slate-400 animate-pulse text-xs">Loading system time...</span>
              )}
            </div>
          </div>

          {/* TABLE with fade transition */}
          <div
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1"
            style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.6s ease-in-out' }}
          >
            <div className="overflow-x-auto h-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#003399] text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-3 py-2 text-center">Appointment Date & Time</th>
                    <th className="px-3 py-2 text-center">Customer Name</th>
                    <th className="px-3 py-2 text-center">Conduction Sticker</th>
                    <th className="px-3 py-2 text-center">Vehicle Model</th>
                    <th className="px-3 py-2 text-center">Plate Number</th>
                    <th className="px-3 py-2 text-center">Service Type</th>
                    <th className="px-3 py-2 text-center">Advisor</th>
                    <th className="px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="p-10 text-center text-gray-400 animate-pulse">Loading appointments...</td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-10 text-center text-gray-400">No appointments found.</td>
                    </tr>
                  ) : (
                    paginated.map((item) => {
                      const status = item.status || 'Pending';
                      const formatted = formatDateTime(item);
                      const isHiding = hidingIds.has(item._id);
                      return (
                        <tr
                          key={item._id}
                          className="hover:bg-gray-50 transition-colors"
                          style={{
                            opacity: isHiding ? 0 : 1,
                            transform: isHiding ? 'translateX(40px)' : 'translateX(0)',
                            transition: isHiding
                              ? 'opacity 1s ease-out, transform 1s ease-out'
                              : 'opacity 0.3s, transform 0.3s',
                          }}
                        >
                          <td className={`${rowPadding} text-center text-gray-700 font-medium`}>
                            {formatted.date}<br />
                            <span className="text-[10px] text-gray-400">{formatted.time}</span>
                          </td>
                          <td className={`${rowPadding} text-center font-bold text-gray-800 uppercase`}>{item.customer}</td>
                          <td className={`${rowPadding} text-center font-mono text-gray-600`}>{item.sticker}</td>
                          <td className={`${rowPadding} text-center text-gray-600`}>{item.model || '—'}</td>
                          <td className={`${rowPadding} text-center font-mono text-gray-600`}>{item.plate || '—'}</td>
                          <td className={`${rowPadding} text-center text-gray-600`}>{item.serviceType || 'PMS'}</td>
                          <td className={`${rowPadding} text-center text-gray-600`}>{item.advisor || '—'}</td>
                          <td className={`${rowPadding} text-center`}>
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_STYLES[status] || STATUS_STYLES['Pending']}`}>
                              {status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] flex-shrink-0">

        {/* PAGE INDICATOR dots + count */}
        {totalPages > 1 && (
          <div className="border-b border-gray-100 px-6 py-1.5 flex justify-between items-center max-w-7xl mx-auto w-full">
            <p className="text-[11px] text-gray-400">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, visibleAppointments.length)} of {visibleAppointments.length} entries
            </p>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, i) => (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-500 ${i + 1 === page ? 'w-4 h-2 bg-[#0054a6]' : 'w-2 h-2 bg-gray-300'
                    }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* BRANDING + BMC */}
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <img src="/szk.png" alt="Suzuki Logo" className="h-6 w-auto object-contain opacity-80" style={{ maxWidth: '80px' }} />
            <div>
              <p className="text-xs font-semibold text-slate-600">Service Management System</p>
              <p className="text-[10px] text-slate-400">
                © {new Date().getFullYear()} All rights reserved.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Created by: Mark Vargas ❤️
            </p>
            <a
              href="https://www.buymeacoffee.com/worstcoder.vargas"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg inline-block animate-bounce hover:animate-none hover:scale-110 active:scale-95 transition-transform"
            >
              <img src="/bmc-button-640x180.png" alt="Buy me a coffee" className="h-9 w-auto object-contain" />
            </a>
          </div>
        </div>

      </footer>
    </div>
  );
}