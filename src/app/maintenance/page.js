'use client';
import React from 'react';

export default function MaintenancePage() {
    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            textAlign: 'center'
        }}>
            <h1 style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: 'var(--primary)',
                fontFamily: 'var(--font-playfair)'
            }}>
                Work in Progress
            </h1>
        </main>
    );
}
