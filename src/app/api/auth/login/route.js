import { connectDB } from "@/db";
import Admin from "@/models/Admin";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export async function POST(request) {
    try {
        await connectDB();
        const { username, password } = await request.json();

        if (!username || !password) {
            return new Response(JSON.stringify({ success: false, error: "Missing credentials" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        const admin = await Admin.findOne({ username });
        if (!admin) {
            return new Response(JSON.stringify({ success: false, error: "Invalid username or password" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return new Response(JSON.stringify({ success: false, error: "Invalid username or password" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const token = jwt.sign(
            { id: admin._id, username: admin.username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        const cookieStore = await cookies();
        cookieStore.set("admin_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24, // 1 day
            path: "/",
        });

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Login error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}