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

  // Change password modal state
  const [showChangePw, setShowChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const handlePwChange = (e) => {
    setPwForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPwError('');
  };

  const handleChangePwSubmit = async () => {
    setPwError('');
    const { currentPassword, newPassword, confirmPassword } = pwForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match.');
      return;
    }

    setSavingPw(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (data.success) {
        setPwSuccess(true);
        setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setPwSuccess(false);
          setShowChangePw(false);
        }, 2000);
      } else {
        setPwError(data.error || 'Something went wrong.');
      }
    } catch {
      setPwError('Network error. Please try again.');
    } finally {
      setSavingPw(false);
    }
  };

  const handleClosePwModal = () => {
    setShowChangePw(false);
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwError('');
    setPwSuccess(false);
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  };

  const inputClass = "w-full border border-gray-200 rounded-lg p-2 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-[#0054a6] text-gray-800 pr-9";
  const labelClass = "text-xs font-semibold text-gray-600 block mb-1";

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

          <div className="flex items-center gap-2">
            {/* Change Password Button */}
            <button
              onClick={() => setShowChangePw(true)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              Change Password
            </button>

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
        </div>
      </nav>

      {/* MAIN */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">Appointment List (editable)</h1>
        <AppointmentForm onSuccess={fetchAdminData} />
        <AppointmentTable data={appointments} onRefresh={fetchAdminData} />
      </main>

      {/* CHANGE PASSWORD MODAL */}
      {showChangePw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Change Password</h3>
              <button onClick={handleClosePwModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {pwSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-green-600">Password changed successfully!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Current Password */}
                <div>
                  <label className={labelClass}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      name="currentPassword"
                      value={pwForm.currentPassword}
                      onChange={handlePwChange}
                      placeholder="Enter current password"
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowCurrent(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showCurrent
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className={labelClass}>New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      name="newPassword"
                      value={pwForm.newPassword}
                      onChange={handlePwChange}
                      placeholder="At least 6 characters"
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNew
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      }
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className={labelClass}>Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={pwForm.confirmPassword}
                      onChange={handlePwChange}
                      placeholder="Re-enter new password"
                      className={inputClass}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirm
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      }
                    </button>
                  </div>
                </div>

                {pwError && (
                  <p className="text-[11px] text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{pwError}</p>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={handleClosePwModal} disabled={savingPw} className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
                    Cancel
                  </button>
                  <button onClick={handleChangePwSubmit} disabled={savingPw} className="px-4 py-2 text-xs font-semibold text-white bg-[#003399] hover:bg-[#004080] rounded-lg disabled:opacity-70 flex items-center gap-2">
                    {savingPw ? (
                      <>
                        <svg className="animate-spin w-3.5 h-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                        </svg>
                        Saving...
                      </>
                    ) : 'Save Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}