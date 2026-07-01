// Create a new admin account.
// Usage: node scripts/create-admin.js <username> <password>
// Example: node scripts/create-admin.js john_admin MySecurePass123

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI. Make sure it is set in your .env.local file.');
    process.exit(1);
}

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true });

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function createAdmin() {
    const [, , username, password] = process.argv;

    if (!username || !password) {
        console.error('Missing arguments.');
        console.error('Usage: node scripts/create-admin.js <username> <password>');
        process.exit(1);
    }

    if (password.length < 6) {
        console.error('Password must be at least 6 characters.');
        process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);

    const existing = await Admin.findOne({ username });
    if (existing) {
        console.log(`Admin account "${username}" already exists!`);
        process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 10);
    await Admin.create({ username, password: hashed });

    console.log(`Admin created! Username: ${username}`);
    process.exit(0);
}

createAdmin().catch((err) => {
    console.error('Error creating admin:', err.message);
    process.exit(1);
});