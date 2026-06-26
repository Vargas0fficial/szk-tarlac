"use client";

import React from 'react';

export default function GlobalError({ error, reset }) {
    // Pinipilit nitong mag-throw ng isolation bypass sa compiler level
    React.useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <head>
                <title>System Error</title>
            </head>
            <body style={{
                fontFamily: 'sans-serif',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                backgroundColor: '#f8fafc',
                margin: 0
            }}>
                <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
                    <h2 style={{ color: '#1e293b', marginBottom: '0.5rem' }}>May kaunting aberya, gar!</h2>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Nagkaroon ng isyu sa pag-render ng system dashboard.</p>
                    <button
                        onClick={() => reset()}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#003399', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                       Try again!
                    </button>
                </div>
            </body>
        </html>
    );
}