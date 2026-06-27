"use client";

import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
    return (
        <div
            style={{
                fontFamily: "'Segoe UI', Arial, sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                backgroundColor: "#ffffff",
                padding: "40px 20px",
                boxSizing: "border-box",
            }}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    maxWidth: "1200px",
                    width: "100%",
                    gap: "40px",
                    flexWrap: "wrap",
                }}
            >
                {/* Left: Text Content */}
                <div style={{ flex: "0 0 auto", minWidth: "260px", maxWidth: "360px", paddingBottom: "40px" }}>
                    {/* Suzuki Logo */}
                    <div style={{ marginBottom: "32px" }}>
                        <Image
                            src="/szk.png"
                            alt="Suzuki Logo"
                            width={160}
                            height={50}
                            style={{ width: "160px", height: "auto" }}
                            priority
                        />
                    </div>

                    {/* 404 */}
                    <h1
                        style={{
                            fontSize: "clamp(80px, 15vw, 130px)",
                            fontWeight: "900",
                            color: "#1A2B5F",
                            margin: "0 0 8px 0",
                            lineHeight: 1,
                            letterSpacing: "-2px",
                        }}
                    >
                        404
                    </h1>

                    {/* Subtitle */}
                    <h2
                        style={{
                            fontSize: "clamp(20px, 4vw, 28px)",
                            fontWeight: "700",
                            color: "#1A2B5F",
                            margin: "0 0 16px 0",
                        }}
                    >
                        Page Not Found
                    </h2>

                    {/* Description */}
                    <p
                        style={{
                            fontSize: "15px",
                            color: "#555",
                            margin: "0 0 36px 0",
                            lineHeight: "1.6",
                            maxWidth: "320px",
                        }}
                    >
                        The page you&apos;re looking for does not exist or has been moved.
                    </p>

                    {/* CTA Button */}
                    <Link
                        href="/"
                        style={{
                            display: "inline-block",
                            backgroundColor: "#1A2B5F",
                            color: "#ffffff",
                            padding: "14px 36px",
                            fontWeight: "700",
                            fontSize: "13px",
                            letterSpacing: "1.5px",
                            textDecoration: "none",
                            textTransform: "uppercase",
                        }}
                    >
                        Go to Dashboard
                    </Link>
                </div>

                {/* Right: 404 Car Image — aligned to bottom */}
                <div
                    style={{
                        flex: "1 1 auto",
                        minWidth: "340px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "flex-end",
                    }}
                >
                    <Image
                        src="/car.png"
                        alt="Broken Suzuki 404 car being repaired"
                        width={750}
                        height={600}
                        style={{ width: "100%", maxWidth: "750px", height: "auto", marginBottom: "-20px" }}
                        priority
                    />
                </div>
            </div>
        </div>
    );
}