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

const getMileageServiceType = (mileage) => {
  const km = parseInt(mileage?.toString().replace(/,/g, ''), 10);
  if (isNaN(km) || km <= 0) return '';
  const step = km <= 1000 ? 1000 : Math.ceil(km / 5000) * 5000;
  const label = step >= 1000 ? `${step / 1000}K` : `${step}`;
  return `${label} PMS`;
};

export default function AppointmentTable({ data, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [openStatusId, setOpenStatusId] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Delete All states
  const [showDeleteAll, setShowDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllProgress, setDeleteAllProgress] = useState({ done: 0, total: 0 });

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

  // Delete All handler
  const handleDeleteAll = async () => {
    setDeletingAll(true);
    setDeleteAllProgress({ done: 0, total: filtered.length });

    let done = 0;
    for (const item of filtered) {
      try {
        const id = item._id?.toString() || item._id;
        await fetch(`/api/appointments/stream?id=${id}`, { method: 'DELETE' });
      } catch {
        // continue even if one fails
      }
      done++;
      setDeleteAllProgress({ done, total: filtered.length });
    }

    setDeletingAll(false);
    setShowDeleteAll(false);
    setPage(1);
    onRefresh?.();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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

  const handleEditClick = (item) => {
    setEditTarget(item);
    setEditForm({
      sticker: item.sticker || '',
      model: item.model || '',
      customer: item.customer || '',
      plate: item.plate || '',
      contact: item.contact || '',
      mileage: item.mileage || '',
      serviceType: item.serviceType || 'PMS',
      advisor: item.advisor || '',
      date: item.date || '',
      time: item.time || '',
      remarks: item.remarks || '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'mileage') {
      const suggested = getMileageServiceType(value);
      setEditForm((prev) => ({
        ...prev,
        mileage: value,
        serviceType: (prev.serviceType === 'PMS' || prev.serviceType.includes('PMS'))
          ? (suggested || prev.serviceType)
          : prev.serviceType,
      }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSave = async () => {
    if (!editTarget) return;
    setSaving(true);

    try {
      const res = await fetch('/api/appointments/stream', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editTarget._id, ...editForm }),
      });

      if (res.ok) {
        setEditTarget(null);
        onRefresh?.();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert('Failed to update appointment.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
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

  const inputClass = "w-full border border-gray-200 rounded-lg p-2 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-[#0054a6] text-gray-800";
  const labelClass = "text-xs font-semibold text-gray-600 block mb-1";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {openStatusId && <div className="fixed inset-0 z-40" onClick={() => setOpenStatusId(null)} />}

      {/* Success Toast */}
      {showSuccess && (
        <div
          className="fixed top-6 right-6 z-[100] flex items-center gap-2 bg-green-500 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-lg"
          style={{ animation: 'fadeInOut 3s ease-in-out forwards' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Appointment updated successfully!
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0%   { opacity: 0; transform: translateY(-10px); }
          15%  { opacity: 1; transform: translateY(0); }
          75%  { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>

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
              className="border border-gray-200 rounded-lg pl-3 pr-8 py-1.5 text-xs focus:outline-none focus:border-[#0054a6] w-48 text-gray-800"
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
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 opacity-70">
                              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
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
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEditClick(item)} className="text-blue-400 hover:text-blue-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteClick(item)} className="text-red-400 hover:text-red-600 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Edit Appointment</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Conduction Sticker</label>
                <input type="text" name="sticker" value={editForm.sticker} onChange={handleEditChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Vehicle Model</label>
                <input type="text" name="model" value={editForm.model} onChange={handleEditChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Customer Name</label>
                <input type="text" name="customer" value={editForm.customer} onChange={handleEditChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Plate Number</label>
                <input type="text" name="plate" value={editForm.plate} onChange={handleEditChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Contact Number</label>
                <input type="text" name="contact" value={editForm.contact} onChange={handleEditChange} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Mileage (KM)</label>
                <input type="text" name="mileage" value={editForm.mileage} onChange={handleEditChange} placeholder="Enter mileage" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Service Type</label>
                <select name="serviceType" value={editForm.serviceType} onChange={handleEditChange} className={`${inputClass} text-gray-500`}>
                  {editForm.serviceType && editForm.serviceType.includes('K PMS') ? (
                    <option value={editForm.serviceType}>{editForm.serviceType}</option>
                  ) : (
                    <option value="PMS">PMS</option>
                  )}
                  <option value="GENERAL JOB">GENERAL JOB</option>
                  <option value="BODY REPAIR">BODY REPAIR</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Service Advisor</label>
                <select name="advisor" value={editForm.advisor} onChange={handleEditChange} className={`${inputClass} text-gray-500`}>
                  <option value="">Select advisor</option>
                  <option value="KENNETH FERNANDEZ">KENNETH FERNANDEZ</option>
                  <option value="MALVIN JASON MENOR">MALVIN JASON MENOR</option>
                  <option value="ADOONIS TAMONDONG">ADOONIS TAMONDONG</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Appointment Date</label>
                <input type="date" name="date" value={editForm.date} onChange={handleEditChange} className={`${inputClass} text-gray-500`} />
              </div>
              <div>
                <label className={labelClass}>Appointment Time</label>
                <input type="time" name="time" value={editForm.time} onChange={handleEditChange} className={`${inputClass} text-gray-500`} />
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Remarks</label>
                <textarea name="remarks" value={editForm.remarks} onChange={handleEditChange} placeholder="Enter remarks (optional)" className={`${inputClass} resize-none h-16`} />
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button onClick={() => setEditTarget(null)} disabled={saving} className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100">
                Cancel
              </button>
              <button onClick={handleEditSave} disabled={saving} className="px-4 py-2 text-xs font-semibold text-white bg-[#003399] hover:bg-[#004080] rounded-lg disabled:opacity-70 flex items-center gap-2">
                {saving ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Single Confirmation Modal */}
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

      {/*  DELETE ALL Confirmation Modal */}
      {showDeleteAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-slate-800">Delete All Appointments</h3>
            </div>

            <p className="text-xs text-gray-600 my-3 bg-red-50 rounded-lg p-3 border border-red-100">
              {statusFilter === 'All Status' && !search
                ? <>This will permanently delete <span className="font-bold text-red-600">all {filtered.length} appointments</span>. This action cannot be undone.</>
                : <>This will permanently delete <span className="font-bold text-red-600">{filtered.length} filtered appointments</span> ({statusFilter !== 'All Status' ? `Status: ${statusFilter}` : ''}{search ? ` Search: "${search}"` : ''}). This action cannot be undone.</>
              }
            </p>

            {/* Progress bar (shown while deleting) */}
            {deletingAll && (
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                  <span>Deleting...</span>
                  <span>{deleteAllProgress.done} / {deleteAllProgress.total}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${(deleteAllProgress.done / deleteAllProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteAll(false)}
                disabled={deletingAll}
                className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deletingAll}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-70 flex items-center gap-2"
              >
                {deletingAll ? (
                  <>
                    <svg className="animate-spin w-3.5 h-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Deleting...
                  </>
                ) : 'Yes, Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex justify-between items-center">
        <p className="text-[11px] text-gray-400">
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
        </p>
        <div className="flex items-center space-x-1">
          {/* Delete All Button — nasa left ng pagination */}
          {filtered.length > 0 && (
            <>
              <button
                onClick={() => setShowDeleteAll(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-semibold text-red-500 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete All ({filtered.length})
              </button>
              <div className="w-px h-4 bg-gray-200 mx-1" />
            </>
          )}
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border border-gray-200 text-xs text-gray-500 disabled:opacity-40">«</button>
          {pageNumbers().map((p, i) => typeof p === 'string' ? <span key={i} className="px-2 py-1 text-xs text-gray-400">...</span> : <button key={p} onClick={() => setPage(p)} className={`px-3 py-1 rounded text-xs font-medium ${page === p ? 'bg-[#0054a6] text-white' : 'border border-gray-200 text-gray-600'}`}>{p}</button>)}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded border border-gray-200 text-xs text-gray-500 disabled:opacity-40">»</button>
        </div>
      </div>
    </div>
  );
}