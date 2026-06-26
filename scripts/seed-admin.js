// Run this ONCE to create your admin account:
// node scripts/seed-admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://mbvargas91_db_user:Markminard1@cluster0.2oeqdzm.mongodb.net/?appName=szk-appointment';

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function seedAdmin() {
    await mongoose.connect(MONGODB_URI);

    const existing = await Admin.findOne({ username: 'admin' });
    if (existing) {
        console.log('Admin account already exists!');
        process.exit(0);
    }

    const hashed = await bcrypt.hash('admin123', 10);
    await Admin.create({ username: 'admin', password: hashed });

    console.log(' Admin created! Username: admin | Password: admin123');
    console.log('  Change the password after first login!');
    process.exit(0);
}

seedAdmin().catch(console.error);