"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setError("");
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (data.success) {
                router.push("/admin");
            } else {
                setError(data.error || "Invalid credentials");
            }
        } catch {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleLogin();
    };

    return (
        <div className="min-h-screen flex">

            {/* LEFT SIDE - Image */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden">
                {/* Replace src with your actual car image path e.g. /images/car.jpg */}
                <Image
                    src="/szk-2.png"
                    alt="Suzuki"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30" />

                {/* Brand text on top of image */}
                <div className="absolute top-8 left-8">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-12 bg-red-500" />
                        <div>
                            <p className="text-white font-black text-4xl tracking-wide leading-none">SUZUKI</p>
                            <p className="text-white/80 text-base italic">Way of Life!</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT SIDE - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center px-8 bg-white">
                <div className="w-full max-w-sm">

                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="mb-4">
                            <Image
                                src="/szk-1.png"
                                alt="Suzuki Logo"
                                width={130}
                                height={90}
                                className="object-contain"
                            />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 mt-2">Welcome Back</h1>
                        <p className="text-base text-gray-400 mt-1">Please sign in to your Suzuki account</p>
                    </div>

                    {/* Form */}
                    <div className="space-y-5">

                        {/* Username */}
                        <div>
                            <label className="block text-base font-semibold text-slate-700 mb-1.5">Username</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter your username"
                                    className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-3.5 text-base focus:outline-none focus:border-[#003399] focus:ring-1 focus:ring-[#003399] transition-all text-gray-800"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-base font-semibold text-slate-700">Password</label>
                            </div>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter your password"
                                    className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-3.5 text-base focus:outline-none focus:border-[#003399] focus:ring-1 focus:ring-[#003399] transition-all text-gray-800"
                                />
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Login Button */}
                        <button
                            onClick={handleLogin}
                            disabled={loading || !username || !password}
                            className="w-full bg-[#003399] hover:bg-[#0054a6] disabled:opacity-50 text-white font-bold text-base py-3.5 rounded-lg transition-all tracking-wide"
                        >
                            {loading ? "Signing in..." : "Login"}
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs text-gray-400 mt-10">
                        © 2026 Suzuki Motor Corporation. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}