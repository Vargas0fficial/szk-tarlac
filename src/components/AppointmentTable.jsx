"use client";

import { useState } from 'react';

const STATUS_STYLES = {
  Confirmed: 'bg-green-100 text-green-700 border border-green-200',
  Pending: 'bg-amber-100 text-amber-700 border border-amber-200',
  'On Going': 'bg-blue-100 text-blue-700 border border-blue-200',
  Completed: 'bg-gray-100 text-gray-600 border border-gray-200',
  Cancelled: 'bg-red-100 text-red-700 border border-red-200',
};

const STATUS_OPTIONS = Object.keys(STATUS_STYLES);
const PAGE_SIZE = 5;

export default function AppointmentTable({ data, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [openStatusId, setOpenStatusId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

  const handleDeleteClick = (item) => setDeleteTarget(item);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    const executeDelete = async (isRetry = false) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const id = deleteTarget._id?.toString() || deleteTarget._id;
        const res = await fetch(`/api/appointments/stream?id=${id}`, {
          method: 'DELETE',
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          setDeleteTarget(null);
          onRefresh?.();
        } else if (!isRetry) {
          throw new Error("Failed delete route");
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!isRetry) {
          console.warn("Delete timed out or failed. Resetting link channel and retrying silently...");
          if (typeof window !== 'undefined' && window.__forceSilentStreamReconnect) {
            window.__forceSilentStreamReconnect();
          }
          await new Promise(r => setTimeout(r, 1000));
          await executeDelete(true);
        } else {
          setDeleteTarget(null);
          setDeleting(false);
        }
      }
    };

    await executeDelete();
    setDeleting(false);
  };

  const handleStatusChange = async (id, newStatus) => {
    if (updatingStatus !== null) return;

    setOpenStatusId(null);
    setUpdatingStatus(id);

    const executeUpdate = async (isRetry = false) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      try {
        const res = await fetch('/api/appointments/stream', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: newStatus }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          onRefresh?.();
        } else if (!isRetry) {
          throw new Error("Failed route patch");
        }
      } catch (err) {
        clearTimeout(timeoutId);
        if (!isRetry) {
          console.warn("Network path frozen. Resetting channel connection and forcing processing...");
          if (typeof window !== 'undefined' && window.__forceSilentStreamReconnect) {
            window.__forceSilentStreamReconnect();
          }
          await new Promise(r => setTimeout(r, 400));
          await executeUpdate(true);
        }
      }
    };

    try {
      await executeUpdate();
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filtered = data.filter((item) => {
    const matchSearch =
      !search ||
      item.customer?.toLowerCase().includes(search.toLowerCase()) ||
      item.sticker?.toLowerCase().includes(search.toLowerCase()) ||
      item.model?.toLowerCase().includes(search.toLowerCase()) ||
      item.plate?.toLowerCase().includes(search.toLowerCase());

    const matchStatus =
      statusFilter === 'All Status' || (item.status || 'Pending') === statusFilter;

    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  const pageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (page > 3) pages.push('...');
      for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
      if (page < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {openStatusId && <div className="fixed inset-0 z-40" onClick={() => setOpenStatusId(null)} />}

      {/* Header Controls */}
      <div className="p-4 flex justify-between items-center">
        <h3 className="font-bold text-slate-800 text-sm">Appointment List</h3>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search..."
              className="border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:border-[#0054a6] w-48"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs bg-white focus:outline-none focus:border-[#0054a6] text-gray-600"
          >
            <option>All Status</option>
            {STATUS_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
          </select>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#003399] text-white text-[10px] font-bold uppercase tracking-wider">
              <th className="px-4 py-3 text-center">Appointment Date & Time</th>
              <th className="px-4 py-3 text-center">Customer Name</th>
              <th className="px-4 py-3 text-center">Conduction Sticker</th>
              <th className="px-4 py-3 text-center">Vehicle Model</th>
              <th className="px-4 py-3 text-center">Plate Number</th>
              <th className="px-4 py-3 text-center">Service Type</th>
              <th className="px-4 py-3 text-center">Advisor</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-xs divide-y divide-gray-100">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan="9" className="p-10 text-center text-gray-400">No appointments found.</td>
              </tr>
            ) : (
              paginated.map((item) => {
                const { date, time } = formatDateTime(item);
                const status = item.status || 'Pending';
                return (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-center text-gray-700 font-medium">
                      {date}<br /><span className="text-[10px] text-gray-400">{time}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-800 uppercase">{item.customer}</td>
                    <td className="px-4 py-3 text-center font-mono text-gray-600">{item.sticker}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.model}</td>
                    <td className="px-4 py-3 text-center font-mono text-gray-600">{item.plate}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.serviceType || 'PMS'}</td>
                    <td className="px-4 py-3 text-center text-gray-600">{item.advisor || '—'}</td>

                    <td className="px-4 py-3 text-center">
                      <div className="relative inline-block">
                        <button
                          type="button"
                          onClick={(e) => {
                            if (openStatusId === item._id) setOpenStatusId(null);
                            else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const targetTop = spaceBelow < 170 ? rect.top - 174 : rect.bottom + 4;
                              setDropdownPos({ top: targetTop, left: rect.left });
                              setOpenStatusId(item._id);
                            }
                          }}
                          disabled={updatingStatus === item._id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-semibold cursor-pointer disabled:opacity-50 transition-all ${STATUS_STYLES[status] || STATUS_STYLES['Pending']}`}
                        >
                          <span>{updatingStatus === item._id ? 'Updating...' : status}</span>

                          {updatingStatus !== item._id && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              className="w-3 h-3 opacity-70"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          )}
                        </button>

                        {openStatusId === item._id && (
                          <div className="fixed z-50 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1" style={{ top: dropdownPos.top, left: dropdownPos.left }}>
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleStatusChange(item._id, opt)}
                                className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-gray-50 ${opt === status ? 'font-bold text-slate-800' : 'text-gray-600'}`}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleDeleteClick(item)} className="text-red-400 hover:text-red-600">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-sm font-bold text-slate-800">Delete Appointment</h3>
            <p className="text-xs text-gray-600 my-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
              Are you sure you want to delete{' '}
              <span className="font-bold text-slate-800 uppercase">{deleteTarget.customer}</span>?
              <br />
              <span className="text-gray-400">Conduction Sticker: </span>
              <span className="font-mono font-semibold text-slate-700">{deleteTarget.sticker}</span>
              <span className="text-gray-400"> · Vehicle: </span>
              <span className="font-semibold text-slate-700">{deleteTarget.model}</span>
            </p>
            <div className="flex justify-end space-x-2">
              <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg bg-gray-50">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={deleting} className="px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg">{deleting ? 'Deleting...' : 'Yes, Delete'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
        <p className="text-[11px] text-gray-400">Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries</p>
        <div className="flex items-center space-x-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border border-gray-200 text-xs text-gray-500 disabled:opacity-40">«</button>
          {pageNumbers().map((p, i) => typeof p === 'string' ? <span key={i} className="px-2 py-1 text-xs text-gray-400">...</span> : <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded text-xs font-medium ${page === p ? 'bg-[#0054a6] text-white' : 'border border-gray-200 text-gray-600'}`}>{p}</button>)}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded border border-gray-200 text-xs text-gray-500 disabled:opacity-40">»</button>
        </div>
      </div>
    </div>
  );
}