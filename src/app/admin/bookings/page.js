'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function BookingsAdmin() {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const [emailModal, setEmailModal] = useState({ isOpen: false, booking: null, type: null });
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
        // Nessun modale o automatismo qui, cambiamo solo il db silente.
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

    const openEmailModal = (booking, type) => {
        const caparraProp = (booking.total_price * 0.3).toFixed(2);
        const saldoProp = (booking.total_price - caparraProp).toFixed(2);

        // Imposta scadenze di default (es. +3 giorni e -14 giorni dal check-in)
        const scadCapDate = new Date();
        scadCapDate.setDate(scadCapDate.getDate() + 3);

        const scadSaldoDate = new Date(booking.check_in);
        scadSaldoDate.setDate(scadSaldoDate.getDate() - 14);

        setEmailFormData({
            caparra: caparraProp,
            scadenzaCaparra: scadCapDate.toISOString().split('T')[0],
            saldo: saldoProp,
            scadenzaSaldo: scadSaldoDate.toISOString().split('T')[0]
        });
        setEmailModal({ isOpen: true, booking, type });
    };

    const handleEmailGenerate = async (e) => {
        e.preventDefault();
        const { booking, type } = emailModal;
        setIsGenerating(true);

        const checkInDate = new Date(booking.check_in).toLocaleDateString();
        const checkOutDate = new Date(booking.check_out).toLocaleDateString();
        const scadenzaCapArr = new Date(emailFormData.scadenzaCaparra).toLocaleDateString();
        const scadenzaSaldoArr = new Date(emailFormData.scadenzaSaldo).toLocaleDateString();

        const subject = encodeURIComponent(type === 'deposit'
            ? `Approvazione e Caparra Prenotazione - Vacanze Mare`
            : `Saldo Finale Prenotazione - Vacanze Mare`);

        // Chiamata all'API Stripe per creare la Checkout Session
        let paymentLink = '[ERRORE GENERAZIONE LINK STRIPE]';
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    amount: type === 'deposit' ? parseFloat(emailFormData.caparra) : parseFloat(emailFormData.saldo),
                    customerEmail: booking.guest_email,
                    propertyName: booking.properties?.name,
                    paymentType: type
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

        let bodyText = '';

        if (type === 'deposit') {
            bodyText = `Gentile ${booking.guest_name},

Siamo felici di confermarle che la sua prenotazione è stata APPROVATA!

Riepilogo soggiorno:
- Struttura: ${booking.properties?.name}
- Check-in: ${checkInDate}
- Check-out: ${checkOutDate}

Per confermare definitivamente le date sul calendario, le chiediamo di procedere al pagamento della CAPARRA:
- Importo Caparra: €${emailFormData.caparra} su €${parseFloat(booking.total_price).toFixed(2)} totali
- Scadenza pagamento caparra: ${scadenzaCapArr}

- **Link Sicuro Stripe per la Caparra:** 
${paymentLink}

Rimaniamo a disposizione.
Cordiali saluti,
Vacanze Mare`;
        } else {
            bodyText = `Gentile ${booking.guest_name},

Ci avviciniamo alla data del suo soggiorno!
Come da precedenti accordi, le chiediamo di procedere al versamento del SALDO FINALE per la sua prenotazione.

Riepilogo soggiorno:
- Struttura: ${booking.properties?.name}
- Check-in: ${checkInDate}
- Check-out: ${checkOutDate}

Dettagli Saldo:
- Importo Saldo Restante: €${emailFormData.saldo}
- Scadenza pagamento saldo: ${scadenzaSaldoArr}

- **Link Sicuro Stripe per il Saldo:** 
${paymentLink}

Rimaniamo in attesa e le auguriamo un felice soggiorno!
Cordiali saluti,
Vacanze Mare`;
        }

        const body = encodeURIComponent(bodyText);

        window.open(`mailto:${booking.guest_email}?subject=${subject}&body=${body}`, '_blank');
        setIsGenerating(false);
        setEmailModal({ isOpen: false, booking: null, type: null });
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
                        <h2 style={{ marginTop: 0 }}>Genera Email e Link ({emailModal.type === 'deposit' ? 'Caparra' : 'Saldo'})</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Controlla importo e scadenza per il pagamento di {emailModal.booking?.guest_name}.</p>

                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <div><strong>Check-in:</strong> {new Date(emailModal.booking?.check_in).toLocaleDateString()}</div>
                                <div><strong>Check-out:</strong> {new Date(emailModal.booking?.check_out).toLocaleDateString()}</div>
                                <div style={{ gridColumn: '1 / -1' }}><strong>Costo Totale del Soggiorno:</strong> €{parseFloat(emailModal.booking?.total_price).toFixed(2)}</div>
                            </div>
                        </div>

                        <form onSubmit={handleEmailGenerate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                {emailModal.type === 'deposit' ? (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Importo Caparra (€)</label>
                                            <input type="number" step="0.01" value={emailFormData.caparra} onChange={e => setEmailFormData({ ...emailFormData, caparra: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Scadenza Caparra</label>
                                            <input type="date" value={emailFormData.scadenzaCaparra} onChange={e => setEmailFormData({ ...emailFormData, scadenzaCaparra: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Importo Saldo (€)</label>
                                            <input type="number" step="0.01" value={emailFormData.saldo} onChange={e => setEmailFormData({ ...emailFormData, saldo: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Scadenza Saldo</label>
                                            <input type="date" value={emailFormData.scadenzaSaldo} onChange={e => setEmailFormData({ ...emailFormData, scadenzaSaldo: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setEmailModal({ isOpen: false, booking: null, type: null })} disabled={isGenerating} className="btn" style={{ background: '#e2e8f0', color: 'black' }}>Annulla</button>
                                <button type="submit" disabled={isGenerating} className="btn btn-primary" style={{ opacity: isGenerating ? 0.7 : 1 }}>
                                    {isGenerating ? 'Generazione Link...' : 'Genera Link Stripe e Apri Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* FINE MODALE EMAIL */}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-l)' }}>
                <h1>Gestione Prenotazioni</h1>
                <button onClick={fetchBookings} className="btn" style={{ border: '1px solid var(--border)' }}>Aggiorna Lista (F5)</button>
            </div>

            <div style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th style={{ padding: '1rem' }}>Ospite</th>
                                <th style={{ padding: '1rem' }}>Appartamento/Date</th>
                                <th style={{ padding: '1rem' }}>Totale</th>
                                <th style={{ padding: '1rem' }}>Caparra</th>
                                <th style={{ padding: '1rem' }}>Saldo</th>
                                <th style={{ padding: '1rem' }}>Stato (Manuale)</th>
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
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                            {new Date(booking.check_in).toLocaleDateString()} &rarr; {new Date(booking.check_out).toLocaleDateString()}
                                        </div>
                                    </td>

                                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>€{parseFloat(booking.total_price).toFixed(2)}</td>

                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: booking.caparra_paid_at ? 'bold' : 'normal', color: booking.caparra_paid_at ? '#10b981' : '#ef4444' }}>
                                            {booking.caparra_paid_at ? `✔️ Pagata il ${new Date(booking.caparra_paid_at).toLocaleDateString()}` : '⏳ Non pagata'}
                                        </div>
                                        <button onClick={() => openEmailModal(booking, 'deposit')} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>✉️ Invia Link Caparra</button>
                                    </td>

                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: booking.saldo_paid_at ? 'bold' : 'normal', color: booking.saldo_paid_at ? '#10b981' : '#ef4444' }}>
                                            {booking.saldo_paid_at ? `✔️ Pagato il ${new Date(booking.saldo_paid_at).toLocaleDateString()}` : '⏳ Non pagato'}
                                        </div>
                                        <button onClick={() => openEmailModal(booking, 'balance')} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', background: '#3b82f6' }}>✉️ Invia Link Saldo</button>
                                    </td>

                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={booking.status}
                                            onChange={(e) => updateStatus(booking.id, e.target.value)}
                                            disabled={updatingId === booking.id}
                                            style={{
                                                padding: '0.4rem',
                                                borderRadius: '0.4rem',
                                                border: '2px solid',
                                                borderColor: getStatusColor(booking.status),
                                                backgroundColor: getStatusColor(booking.status) + '10',
                                                color: getStatusColor(booking.status),
                                                fontWeight: 'bold',
                                                fontSize: '0.8rem',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <option value="pending" style={{ color: 'black' }}>Pending</option>
                                            <option value="approved" style={{ color: 'black' }}>Approved</option>
                                            <option value="booked" style={{ color: 'black' }}>Booked</option>
                                            <option value="confirmed" style={{ color: 'black' }}>Confirmed</option>
                                            <option value="cancelled" style={{ color: 'black' }}>Cancelled</option>
                                        </select>
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
