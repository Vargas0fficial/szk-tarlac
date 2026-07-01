// List or delete admin accounts.
// List all admins:   node scripts/delete-admin.js --list
// Delete an admin:    node scripts/delete-admin.js <username>

require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

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

async function run() {
    const [, , arg] = process.argv;

    if (!arg) {
        console.error('Missing argument.');
        console.error('   Usage:');
        console.error('     node scripts/delete-admin.js --list           (list all admin accounts)');
        console.error('     node scripts/delete-admin.js <username>       (delete a specific admin)');
        process.exit(1);
    }

    await mongoose.connect(MONGODB_URI);

    if (arg === '--list') {
        const admins = await Admin.find({}, { username: 1, createdAt: 1 }).sort({ createdAt: 1 });
        if (admins.length === 0) {
            console.log('No admin accounts found.');
        } else {
            console.log(`Found ${admins.length} admin account(s):\n`);
            admins.forEach((a, i) => {
                console.log(`${i + 1}. ${a.username}  (created: ${a.createdAt?.toLocaleString() || 'unknown'})`);
            });
        }
        process.exit(0);
    }

    // Safety check: prevent deleting the last remaining admin account
    const totalAdmins = await Admin.countDocuments();
    if (totalAdmins <= 1) {
        console.error('Cannot delete the last remaining admin account. Create a new one first.');
        process.exit(1);
    }

    const deleted = await Admin.findOneAndDelete({ username: arg });

    if (!deleted) {
        console.log(`Admin account "${arg}" not found.`);
        process.exit(0);
    }

    console.log(`Admin account "${arg}" deleted successfully.`);
    process.exit(0);
}

run().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
});