import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  customer:    { type: String, required: true },
  sticker:     { type: String, required: true },
  model:       { type: String },
  plate:       { type: String },
  contact:     { type: String },
  mileage:     { type: String },
  serviceType: { type: String, default: 'PMS' },
  advisor:     { type: String },
  date:        { type: String },
  time:        { type: String },
  remarks:     { type: String },
  status:      { type: String, default: 'Pending' },
}, { timestamps: true });

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);