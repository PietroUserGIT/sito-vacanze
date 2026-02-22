'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function BookingsAdmin() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchBookings();
    }, []);

    async function fetchBookings() {
        setLoading(true);
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                properties (name)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Errore caricamento prenotazioni:', error);
        } else {
            setBookings(data || []);
        }
        setLoading(false);
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'approved': return '#3b82f6';
            case 'booked': return '#8b5cf6';
            case 'confirmed': return '#10b981';
            case 'cancelled': return '#ef4444';
            default: return '#64748b';
        }
    };

    if (loading) return <div>Caricamento prenotazioni...</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-l)' }}>
                <h1>Gestione Prenotazioni</h1>
                <button onClick={fetchBookings} className="btn" style={{ border: '1px solid var(--border)' }}>Aggiorna Lista (F5)</button>
            </div>

            <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Ospite</th>
                                <th style={{ padding: '1rem' }}>Appartamento</th>
                                <th style={{ padding: '1rem' }}>Data inizio</th>
                                <th style={{ padding: '1rem' }}>Data fine</th>
                                <th style={{ padding: '1rem' }}>Stato</th>
                                <th style={{ padding: '1rem' }}>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.map((booking) => (
                                <tr key={booking.id} style={{ borderBottom: '1px solid #f1f5f9' }}>

                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '600' }}>{booking.guest_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{booking.guest_email}</div>
                                    </td>

                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: '500' }}>{booking.properties?.name}</div>
                                    </td>

                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(booking.check_in).toLocaleDateString()}
                                        </div>
                                    </td>

                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(booking.check_out).toLocaleDateString()}
                                        </div>
                                    </td>

                                    <td style={{ padding: '1rem' }}>
                                        <span
                                            style={{
                                                padding: '0.4rem 0.8rem',
                                                borderRadius: '9999px',
                                                backgroundColor: getStatusColor(booking.status) + '20',
                                                color: getStatusColor(booking.status),
                                                fontWeight: 'bold',
                                                fontSize: '0.8rem',
                                                display: 'inline-block'
                                            }}
                                        >
                                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                        </span>
                                    </td>

                                    <td style={{ padding: '1rem' }}>
                                        <Link href={`/admin/bookings/${booking.id}`} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', textDecoration: 'none' }}>
                                            Gestione prenotazione
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {bookings.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nessuna prenotazione trovata.
                    </div>
                )}
            </div>
        </div>
    );
}
