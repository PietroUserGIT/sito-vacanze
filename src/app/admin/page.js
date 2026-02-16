'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        revenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            const { data, error } = await supabase.from('bookings').select('*');
            if (error) {
                console.error('Errore caricamento statistiche:', error);
            } else {
                const total = data.length;
                const pending = data.filter(b => b.status === 'pending').length;
                const confirmed = data.filter(b => b.status === 'confirmed').length;
                const revenue = data
                    .filter(b => b.status === 'confirmed')
                    .reduce((acc, b) => acc + parseFloat(b.total_price), 0);

                setStats({ total, pending, confirmed, revenue });
            }
            setLoading(false);
        }
        fetchStats();
    }, []);

    const cardStyle = {
        background: 'white',
        padding: 'var(--space-m)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    };

    if (loading) return <div>Caricamento statistiche...</div>;

    return (
        <div>
            <h1 style={{ marginBottom: 'var(--space-l)' }}>Dashboard Panoramica</h1>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 'var(--space-m)',
                marginBottom: 'var(--space-xl)'
            }}>
                <div style={cardStyle}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Prenotazioni Totali</span>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</span>
                </div>
                <div style={{ ...cardStyle, borderLeft: '4px solid #f59e0b' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Richieste in Sospeso</span>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pending}</span>
                </div>
                <div style={{ ...cardStyle, borderLeft: '4px solid #10b981' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Prenotazioni Confermate</span>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{stats.confirmed}</span>
                </div>
                <div style={cardStyle}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Entrate Totali</span>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>€{stats.revenue.toFixed(2)}</span>
                </div>
            </div>

            <div style={{ background: 'white', padding: 'var(--space-l)', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <h3>Benvenuto nell'Area Amministrativa</h3>
                <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                    Da qui puoi gestire ogni aspetto del tuo sito "Vacanze Mare".
                    Usa il menu a sinistra per navigare tra le prenotazioni e il calendario.
                </p>
                <div style={{ marginTop: '2rem', display: 'flex', gap: 'var(--space-s)' }}>
                    <a href="/admin/bookings" className="btn btn-primary">Gestisci Prenotazioni</a>
                    <a href="/" target="_blank" className="btn" style={{ border: '1px solid var(--border)' }}>Vedi Sito Pubblico</a>
                </div>
            </div>
        </div>
    );
}
