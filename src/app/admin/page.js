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
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updatingMaintenance, setUpdatingMaintenance] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);

            // Fetch statistiche
            const { data: bookingsData } = await supabase.from('bookings').select('*');
            if (bookingsData) {
                const total = bookingsData.length;
                const pending = bookingsData.filter(b => b.status === 'pending').length;
                const confirmed = bookingsData.filter(b => b.status === 'confirmed').length;
                const revenue = bookingsData
                    .filter(b => b.status === 'confirmed')
                    .reduce((acc, b) => acc + parseFloat(b.total_price), 0);

                setStats({ total, pending, confirmed, revenue });
            }

            // Fetch stato manutenzione
            const { data: settingData } = await supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single();

            if (settingData) {
                setMaintenanceMode(settingData.value === true);
            }

            setLoading(false);
        }
        fetchData();
    }, []);

    const toggleMaintenance = async () => {
        setUpdatingMaintenance(true);
        const newValue = !maintenanceMode;

        const { error } = await supabase
            .from('site_settings')
            .upsert({ key: 'maintenance_mode', value: newValue });

        if (error) {
            alert('Errore aggiornamento manutenzione: ' + error.message);
        } else {
            setMaintenanceMode(newValue);
        }
        setUpdatingMaintenance(false);
    };

    const cardStyle = {
        background: 'white',
        padding: 'var(--space-m)',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
    };

    if (loading) return <div>Caricamento dati dashboard...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-l)' }}>
                <h1>Dashboard Panoramica</h1>

                {/* Toggle Manutenzione */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    background: maintenanceMode ? '#fee2e2' : '#ecfdf5',
                    padding: '0.5rem 1rem',
                    borderRadius: '2rem',
                    border: `1px solid ${maintenanceMode ? '#ef4444' : '#10b981'}`
                }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: maintenanceMode ? '#b91c1c' : '#047857' }}>
                        {maintenanceMode ? '🚨 SITO IN MANUTENZIONE' : '✅ SITO ONLINE'}
                    </span>
                    <button
                        onClick={toggleMaintenance}
                        disabled={updatingMaintenance}
                        style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '1rem',
                            background: maintenanceMode ? '#ef4444' : '#10b981',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            opacity: updatingMaintenance ? 0.7 : 1
                        }}
                    >
                        {updatingMaintenance ? '...' : (maintenanceMode ? 'ATTIVA SITO' : 'METTI IN MANUTENZIONE')}
                    </button>
                </div>
            </div>

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
