"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppointmentForm from '@/components/AppointmentForm';
import AppointmentTable from '@/components/AppointmentTable';

export default function AdminPage() {
  const [appointments, setAppointments] = useState([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const eventSource = new EventSource('/api/appointments/stream');

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        if (parsedData.type === 'initial' || parsedData.type === 'update') {
          setAppointments(parsedData.data);
        }
      } catch (err) {
        console.error("Error parsing incoming live data stream:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE connection closed or lost. Attempting reconnection...", err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const fetchAdminData = async () => {
    try {
      const res = await fetch('/api/appointments/stream');
      const data = await res.json();
      if (res.ok) {
        setAppointments(data.data || data);
      }
    } catch (err) {
      console.error("Manual database synchronization fallback failed:", err);
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (err) {
      console.error("Logout failed:", err);
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img src="/szk.png" alt="Logo" className="h-20 w-auto object-contain" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest border-l border-slate-300 pl-3">
              Service Management System
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-all disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Appointment List (editable)</h1>
        <AppointmentForm onSuccess={fetchAdminData} />
        <AppointmentTable data={appointments} onRefresh={fetchAdminData} />
      </main>
    </div>
  );
}