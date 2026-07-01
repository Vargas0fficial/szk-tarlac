import { connectDB } from "@/db";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(request) {
    try {
        await connectDB();

        const cookieStore = await cookies();
        const token = cookieStore.get("admin_token")?.value;

        if (!token) {
            return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return new Response(JSON.stringify({ success: false, error: "Invalid session" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return new Response(JSON.stringify({ success: false, error: "Missing fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        if (newPassword.length < 6) {
            return new Response(JSON.stringify({ success: false, error: "New password must be at least 6 characters" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return new Response(JSON.stringify({ success: false, error: "Admin not found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.password);
        if (!isMatch) {
            return new Response(JSON.stringify({ success: false, error: "Current password is incorrect" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        admin.password = hashed;
        await admin.save();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Change password error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}