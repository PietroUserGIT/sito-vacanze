'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function BookingsAdmin() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

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

    const updateStatus = async (id, newStatus) => {
        setUpdatingId(id);
        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert('Errore durante l\'aggiornamento: ' + error.message);
        } else {
            setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
        }
        setUpdatingId(null);
    };

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
                <button onClick={fetchBookings} className="btn" style={{ border: '1px solid var(--border)' }}>Aggiorna Lista</button>
            </div>

            <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                        <tr>
                            <th style={{ padding: '1rem' }}>Ospite</th>
                            <th style={{ padding: '1rem' }}>Appartamento</th>
                            <th style={{ padding: '1rem' }}>Soggiorno</th>
                            <th style={{ padding: '1rem' }}>Totale</th>
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
                                <td style={{ padding: '1rem' }}>{booking.properties?.name}</td>
                                <td style={{ padding: '1rem' }}>
                                    <div style={{ fontSize: '0.9rem' }}>{new Date(booking.check_in).toLocaleDateString()}</div>
                                    <div style={{ fontSize: '0.9rem' }}>{new Date(booking.check_out).toLocaleDateString()}</div>
                                </td>
                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>€{parseFloat(booking.total_price).toFixed(2)}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '9999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        background: getStatusColor(booking.status) + '20',
                                        color: getStatusColor(booking.status),
                                        textTransform: 'uppercase'
                                    }}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>
                                    <select
                                        value={booking.status}
                                        onChange={(e) => updateStatus(booking.id, e.target.value)}
                                        disabled={updatingId === booking.id}
                                        style={{
                                            padding: '0.4rem',
                                            borderRadius: '0.4rem',
                                            border: '1px solid var(--border)',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="booked">Booked</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {bookings.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nessuna prenotazione trovata.
                    </div>
                )}
            </div>
        </div>
    );
}
