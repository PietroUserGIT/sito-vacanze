'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function BookingsAdmin() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const [emailModal, setEmailModal] = useState({ isOpen: false, booking: null });
    const [emailFormData, setEmailFormData] = useState({
        caparra: 0,
        scadenzaCaparra: '',
        saldo: 0,
        scadenzaSaldo: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);

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
        if (newStatus === 'approved') {
            const bookingToApprove = bookings.find(b => b.id === id);
            const caparraProp = (bookingToApprove.total_price * 0.3).toFixed(2);
            const saldoProp = (bookingToApprove.total_price - caparraProp).toFixed(2);

            // Imposta scadenze di default (es. +3 giorni e -14 giorni dal check-in)
            const scadCapDate = new Date();
            scadCapDate.setDate(scadCapDate.getDate() + 3);

            const scadSaldoDate = new Date(bookingToApprove.check_in);
            scadSaldoDate.setDate(scadSaldoDate.getDate() - 14);

            setEmailFormData({
                caparra: caparraProp,
                scadenzaCaparra: scadCapDate.toISOString().split('T')[0],
                saldo: saldoProp,
                scadenzaSaldo: scadSaldoDate.toISOString().split('T')[0]
            });
            setEmailModal({ isOpen: true, booking: bookingToApprove });
            return; // L'aggiornamento vero e proprio avverrà dal modale
        }

        executeStatusUpdate(id, newStatus);
    };

    const executeStatusUpdate = async (id, newStatus) => {
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

    const handleEmailGenerateAndApprove = async (e) => {
        e.preventDefault();
        const { booking } = emailModal;
        setIsGenerating(true);

        // Esegui approvazione sul DB
        executeStatusUpdate(booking.id, 'approved');

        // Genera Testo Email
        const checkInDate = new Date(booking.check_in).toLocaleDateString();
        const checkOutDate = new Date(booking.check_out).toLocaleDateString();
        const scadenzaCapArr = new Date(emailFormData.scadenzaCaparra).toLocaleDateString();
        const scadenzaSaldoArr = new Date(emailFormData.scadenzaSaldo).toLocaleDateString();

        const subject = encodeURIComponent(`Approvazione Prenotazione - Vacanze Mare`);
        // Chiamata all'API Stripe per creare la Checkout Session
        let paymentLink = '[ERRORE GENERAZIONE LINK STRIPE]';
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    amount: parseFloat(emailFormData.caparra),
                    customerEmail: booking.guest_email,
                    propertyName: booking.properties?.name
                })
            });
            const data = await res.json();
            if (data.url) {
                paymentLink = data.url;
            } else {
                console.error('Errore da Stripe:', data.error);
                alert('Impossibile generare il link di pagamento: ' + data.error);
                setIsGenerating(false);
                return; // Ferma il processo se Stripe fallisce
            }
        } catch (err) {
            console.error('Fetch Stripe API fallita:', err);
            alert('Errore di comunicazione con il server per Stripe.');
            setIsGenerating(false);
            return;
        }

        // Il link di Stripe è spesso molto lungo nel test, raccomandabile mandarlo in una riga separata
        const body = encodeURIComponent(`Gentile ${booking.guest_name},

Siamo felici di confermarle che la sua richiesta di prenotazione è stata APPROVATA!

Riepilogo soggiorno:
- Struttura: ${booking.properties?.name}
- Check-in: ${checkInDate}
- Check-out: ${checkOutDate}
- Totale: €${parseFloat(booking.total_price).toFixed(2)}

Per confermare definitivamente la prenotazione (Stato: Booked), le chiediamo di procedere al pagamento della CAPARRA:
- Importo Caparra: €${emailFormData.caparra}
- Scadenza pagamento caparra: ${scadenzaCapArr}
- Link per il pagamento sicuro tramite Stripe: 
${paymentLink}

Il saldo finale dovrà essere versato con le seguenti tempistiche:
- Importo Saldo: €${emailFormData.saldo}
- Scadenza pagamento saldo: ${scadenzaSaldoArr}

Rimaniamo a disposizione per qualsiasi necessità.
Cordiali saluti,
Vacanze Mare`);

        window.open(`mailto:${booking.guest_email}?subject=${subject}&body=${body}`, '_blank');
        setIsGenerating(false);
        setEmailModal({ isOpen: false, booking: null });
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
            {/* INIZIO MODALE EMAIL */}
            {emailModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginTop: 0 }}>Genera Email Approvazione</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Configura gli importi e le scadenze per la mail di {emailModal.booking?.guest_name}.</p>

                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div><strong>Check-in:</strong> {new Date(emailModal.booking?.check_in).toLocaleDateString()}</div>
                                <div><strong>Check-out:</strong> {new Date(emailModal.booking?.check_out).toLocaleDateString()}</div>
                                <div>
                                    <strong>Notti:</strong> {
                                        Math.ceil(Math.abs(new Date(emailModal.booking?.check_out) - new Date(emailModal.booking?.check_in)) / (1000 * 60 * 60 * 24))
                                    }
                                </div>
                                <div><strong>Importo totale:</strong> €{parseFloat(emailModal.booking?.total_price).toFixed(2)}</div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <strong>Prezzo medio giornaliero:</strong> €{(
                                        emailModal.booking?.total_price /
                                        Math.max(1, Math.ceil(Math.abs(new Date(emailModal.booking?.check_out) - new Date(emailModal.booking?.check_in)) / (1000 * 60 * 60 * 24)))
                                    ).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleEmailGenerateAndApprove}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Importo Caparra (€)</label>
                                    <input type="number" step="0.01" value={emailFormData.caparra} onChange={e => setEmailFormData({ ...emailFormData, caparra: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Scadenza Caparra</label>
                                    <input type="date" value={emailFormData.scadenzaCaparra} onChange={e => setEmailFormData({ ...emailFormData, scadenzaCaparra: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Importo Saldo (€)</label>
                                    <input type="number" step="0.01" value={emailFormData.saldo} onChange={e => setEmailFormData({ ...emailFormData, saldo: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Scadenza Saldo</label>
                                    <input type="date" value={emailFormData.scadenzaSaldo} onChange={e => setEmailFormData({ ...emailFormData, scadenzaSaldo: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setEmailModal({ isOpen: false, booking: null })} disabled={isGenerating} className="btn" style={{ background: '#e2e8f0', color: 'black' }}>Annulla</button>
                                <button type="submit" disabled={isGenerating} className="btn btn-primary" style={{ opacity: isGenerating ? 0.7 : 1 }}>
                                    {isGenerating ? 'Generazione Link...' : 'Approva, Genera Link e Apri Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* FINE MODALE EMAIL */}

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
