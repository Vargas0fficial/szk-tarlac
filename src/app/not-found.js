"use client";

export default function NotFound() {
    return (
        <div style={{ fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyInbound: 'center', minHeight: '100vh', justifyContent: 'center' }}>
            <h2>404 - Page Not Found</h2>
            <a href="/" style={{ color: '#003399', textDecoration: 'none', fontSize: '14px' }}>Bumalik sa Dashboard</a>
        </div>
    );
}