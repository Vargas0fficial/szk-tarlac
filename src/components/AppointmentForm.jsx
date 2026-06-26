"use client";

import { useState } from 'react';

export default function AppointmentForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    sticker: '',
    model: '',
    customer: '',
    plate: '',
    contact: '',
    mileage: '',
    serviceType: '',
    advisor: '',
    date: '',
    time: '',
    remarks: '',
  });

  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClear = () => {
    setFormData({
      sticker: '', model: '', customer: '', plate: '',
      contact: '', mileage: '', serviceType: '', advisor: '',
      date: '', time: '', remarks: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/appointments/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('Appointment scheduled successfully!');
        handleClear();
        onSuccess();
      } else {
        alert('Failed to save appointment.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border border-gray-200 rounded-lg p-2 text-xs bg-gray-50 focus:bg-white focus:outline-none focus:border-[#0054a6] text-gray-800";
  const labelClass = "text-xs font-semibold text-gray-600 block mb-1";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h2 className="text-base font-bold text-slate-800 mb-5">New Appointment</h2>

      <form onSubmit={handleSubmit}>
        <div
          className="grid gap-4 mb-4"
          style={{ gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'auto auto auto' }}
        >
          {/* Col 1 Row 1 — Conduction Sticker */}
          <div style={{ gridColumn: '1', gridRow: '1' }}>
            <label className={labelClass}>
              Conduction Sticker <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="sticker"
                value={formData.sticker}
                onChange={handleChange}
                required
                placeholder="Enter conduction sticker"
                className={`${inputClass} pr-8`}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
              </svg>
            </div>
            <p className="text-[10px] text-[#0054a6] mt-1">Scan or enter conduction sticker to auto-fill details</p>
          </div>

          {/* Col 2 Row 1 — Vehicle Model */}
          <div style={{ gridColumn: '2', gridRow: '1' }}>
            <label className={labelClass}>Vehicle Model</label>
            <input type="text" name="model" value={formData.model} onChange={handleChange} placeholder="--" className={inputClass} />
          </div>

          {/* Col 3 Row 1 — Service Type */}
          <div style={{ gridColumn: '3', gridRow: '1' }}>
            <label className={labelClass}>
              Service Type <span className="text-red-500">*</span>
            </label>
            <select name="serviceType" value={formData.serviceType} onChange={handleChange} required className={`${inputClass} text-gray-500`}>
              <option value="" disabled>Select service type</option>
              <option value="PMS">PMS</option>
              <option value="GENERAL JOB">GENERAL JOB</option>
              <option value="BODY REPAIR">BODY REPAIR</option>
            </select>
          </div>

          {/* Col 4 Row 1 — Service Advisor */}
          <div style={{ gridColumn: '4', gridRow: '1' }}>
            <label className={labelClass}>Service Advisor</label>
            <select name="advisor" value={formData.advisor} onChange={handleChange} className={`${inputClass} text-gray-500`}>
              <option value="" disabled>Select advisor</option>
              <option value="KENNETH FERNANDEZ">KENNETH FERNANDEZ</option>
              <option value="MALVIN JASON MENOR">MALVIN JASON MENOR</option>
              <option value="ADOONIS TAMONDONG">ADOONIS TAMONDONG</option>
            </select>
          </div>

          {/* Col 1 Row 2 — Customer Name */}
          <div style={{ gridColumn: '1', gridRow: '2' }}>
            <label className={labelClass}>Customer Name</label>
            <input type="text" name="customer" value={formData.customer} onChange={handleChange} placeholder="--" className={inputClass} />
          </div>

          {/* Col 2 Row 2 — Plate Number */}
          <div style={{ gridColumn: '2', gridRow: '2' }}>
            <label className={labelClass}>Plate Number</label>
            <input type="text" name="plate" value={formData.plate} onChange={handleChange} placeholder="--" className={inputClass} />
          </div>

          {/* Col 3 Row 2 — Appointment Date */}
          <div style={{ gridColumn: '3', gridRow: '2' }}>
            <label className={labelClass}>
              Appointment Date <span className="text-red-500">*</span>
            </label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required className={`${inputClass} text-gray-500`} />
          </div>

          {/* Col 4 Row 2–3 — Remarks (spans 2 rows) */}
          <div style={{ gridColumn: '4', gridRow: '2 / 4' }} className="flex flex-col">
            <label className={labelClass}>Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Enter remarks (optional)"
              className={`${inputClass} flex-1 resize-none`}
            />
          </div>

          {/* Col 1 Row 3 — Contact Number */}
          <div style={{ gridColumn: '1', gridRow: '3' }}>
            <label className={labelClass}>Contact Number</label>
            <input type="text" name="contact" value={formData.contact} onChange={handleChange} placeholder="--" className={inputClass} />
          </div>

          {/* Col 2 Row 3 — Mileage */}
          <div style={{ gridColumn: '2', gridRow: '3' }}>
            <label className={labelClass}>Mileage (KM)</label>
            <input type="text" name="mileage" value={formData.mileage} onChange={handleChange} placeholder="Enter mileage" className={inputClass} />
          </div>

          {/* Col 3 Row 3 — Appointment Time */}
          <div style={{ gridColumn: '3', gridRow: '3' }}>
            <label className={labelClass}>
              Appointment Time <span className="text-red-500">*</span>
            </label>
            <input type="time" name="time" value={formData.time} onChange={handleChange} required className={`${inputClass} text-gray-500`} />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3 mt-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={submitting}
            className="px-6 py-2 border border-gray-200 text-gray-700 font-semibold rounded-lg text-xs bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-[#003399] hover:bg-[#004080] text-white font-semibold rounded-lg text-xs transition-colors shadow-sm disabled:opacity-70 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-3.5 h-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Scheduling...
              </>
            ) : (
              'Schedule Appointment'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}