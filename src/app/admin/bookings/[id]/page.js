'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function BookingDetail() {
    const { id } = useParams();
    const router = useRouter();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    // States for dates and status
    const [status, setStatus] = useState('pending');
    const [caparraDate, setCaparraDate] = useState('');
    const [saldoDate, setSaldoDate] = useState('');

    const [emailModal, setEmailModal] = useState({ isOpen: false, type: null });
    const [emailFormData, setEmailFormData] = useState({
        amount: 0,
        dueDate: ''
    });
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (id) {
            fetchBooking();
        }
    }, [id]);

    async function fetchBooking() {
        setLoading(true);
        const { data, error } = await supabase
            .from('bookings')
            .select(`*, properties (name)`)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Errore caricamento prenotazione:', error);
        } else if (data) {
            setBooking(data);
            setStatus(data.status || 'pending');
            // Supabase returns timestamps. We want YYYY-MM-DD for date inputs
            setCaparraDate(data.caparra_paid_at ? new Date(data.caparra_paid_at).toISOString().split('T')[0] : '');
            setSaldoDate(data.saldo_paid_at ? new Date(data.saldo_paid_at).toISOString().split('T')[0] : '');
        }
        setLoading(false);
    }

    const handleSave = async () => {
        setUpdatingId(id);
        const updateData = {
            status: status,
            caparra_paid_at: caparraDate ? new Date(caparraDate).toISOString() : null,
            saldo_paid_at: saldoDate ? new Date(saldoDate).toISOString() : null,
        };

        const { error } = await supabase
            .from('bookings')
            .update(updateData)
            .eq('id', id);

        if (error) {
            alert('Errore durante il salvataggio: ' + error.message);
        } else {
            alert('Modifiche salvate con successo!');
            fetchBooking(); // refresh
        }
        setUpdatingId(null);
    };

    const openEmailModal = (type) => {
        if (!booking) return;
        const caparraProp = (booking.total_price * 0.3).toFixed(2);
        const saldoProp = (booking.total_price - caparraProp).toFixed(2);

        if (type === 'deposit') {
            const scadCapDate = new Date();
            scadCapDate.setDate(scadCapDate.getDate() + 3);
            setEmailFormData({
                amount: caparraProp,
                dueDate: scadCapDate.toISOString().split('T')[0]
            });
        } else {
            const scadSaldoDate = new Date(booking.check_in);
            scadSaldoDate.setDate(scadSaldoDate.getDate() - 14);
            setEmailFormData({
                amount: saldoProp,
                dueDate: scadSaldoDate.toISOString().split('T')[0]
            });
        }
        setEmailModal({ isOpen: true, type });
    };

    const handleEmailGenerate = async (e) => {
        e.preventDefault();
        const { type } = emailModal;
        setIsGenerating(true);

        const checkInDate = new Date(booking.check_in).toLocaleDateString();
        const checkOutDate = new Date(booking.check_out).toLocaleDateString();
        const scadenzaArr = new Date(emailFormData.dueDate).toLocaleDateString();

        const subject = encodeURIComponent(type === 'deposit'
            ? `Approvazione e Caparra Prenotazione - Vacanze Mare`
            : `Saldo Finale Prenotazione - Vacanze Mare`);

        let paymentLink = '[ERRORE GENERAZIONE LINK STRIPE]';
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: booking.id,
                    amount: parseFloat(emailFormData.amount),
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
                return;
            }
        } catch (err) {
            console.error('Fetch Stripe API fallita:', err);
            alert('Errore di comunicazione con il server per Stripe.');
            setIsGenerating(false);
            return;
        }

        let bodyText = '';

        if (type === 'deposit') {
            bodyText = `Gentile ${booking.guest_name},\n\nSiamo felici di confermarle che la sua prenotazione è stata APPROVATA!\n\nRiepilogo soggiorno:\n- Struttura: ${booking.properties?.name}\n- Check-in: ${checkInDate}\n- Check-out: ${checkOutDate}\n\nPer confermare definitivamente le date sul calendario, le chiediamo di procedere al pagamento della CAPARRA:\n- Importo Caparra: €${emailFormData.amount} su €${parseFloat(booking.total_price).toFixed(2)} totali\n- Scadenza pagamento caparra: ${scadenzaArr}\n\n- **Link Sicuro Stripe per la Caparra:** \n${paymentLink}\n\nRimaniamo a disposizione.\nCordiali saluti,\nVacanze Mare`;
        } else {
            bodyText = `Gentile ${booking.guest_name},\n\nCi avviciniamo alla data del suo soggiorno!\nCome da precedenti accordi, le chiediamo di procedere al versamento del SALDO FINALE per la sua prenotazione.\n\nRiepilogo soggiorno:\n- Struttura: ${booking.properties?.name}\n- Check-in: ${checkInDate}\n- Check-out: ${checkOutDate}\n\nDettagli Saldo:\n- Importo Saldo Restante: €${emailFormData.amount}\n- Scadenza pagamento saldo: ${scadenzaArr}\n\n- **Link Sicuro Stripe per il Saldo:** \n${paymentLink}\n\nRimaniamo in attesa e le auguriamo un felice soggiorno!\nCordiali saluti,\nVacanze Mare`;
        }

        const body = encodeURIComponent(bodyText);
        window.open(`mailto:${booking.guest_email}?subject=${subject}&body=${body}`, '_blank');
        setIsGenerating(false);
        setEmailModal({ isOpen: false, type: null });
    };

    const getStatusColor = (st) => {
        switch (st) {
            case 'pending': return '#f59e0b';
            case 'approved': return '#3b82f6';
            case 'booked': return '#8b5cf6';
            case 'confirmed': return '#10b981';
            case 'cancelled': return '#ef4444';
            default: return '#64748b';
        }
    };

    if (loading) return <div>Caricamento in corso...</div>;
    if (!booking) return <div>Prenotazione non trovata.</div>;

    return (
        <div>
            {/* Modal Email */}
            {emailModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '100%', maxWidth: '500px' }}>
                        <h2 style={{ marginTop: 0 }}>Genera Email e Link ({emailModal.type === 'deposit' ? 'Caparra' : 'Saldo'})</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Controlla importo e scadenza per il pagamento di {booking.guest_name}.</p>

                        <form onSubmit={handleEmailGenerate}>
                            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Importo (€)</label>
                                    <input type="number" step="0.01" value={emailFormData.amount} onChange={e => setEmailFormData({ ...emailFormData, amount: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Scadenza Pagamento</label>
                                    <input type="date" value={emailFormData.dueDate} onChange={e => setEmailFormData({ ...emailFormData, dueDate: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setEmailModal({ isOpen: false, type: null })} disabled={isGenerating} className="btn" style={{ background: '#e2e8f0', color: 'black' }}>Annulla</button>
                                <button type="submit" disabled={isGenerating} className="btn btn-primary" style={{ opacity: isGenerating ? 0.7 : 1 }}>
                                    {isGenerating ? 'Generazione Link...' : 'Genera Link Stripe e Apri Email'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: 'var(--space-l)' }}>
                <Link href="/admin/bookings" className="btn" style={{ border: '1px solid var(--border)', textDecoration: 'none' }}>&larr; Indietro</Link>
                <h1 style={{ margin: 0 }}>Dettaglio Prenotazione</h1>
            </div>

            <div style={{ background: 'white', borderRadius: '1rem', padding: '2rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>

                    {/* Riepilogo Dati */}
                    <div>
                        <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Riepilogo</h3>
                        <p><strong>Ospite:</strong> {booking.guest_name} ({booking.guest_email})</p>
                        <p><strong>Appartamento:</strong> {booking.properties?.name}</p>
                        <p><strong>Check-in:</strong> {new Date(booking.check_in).toLocaleDateString()}</p>
                        <p><strong>Check-out:</strong> {new Date(booking.check_out).toLocaleDateString()}</p>
                        <p><strong>Prezzo Totale:</strong> €{parseFloat(booking.total_price).toFixed(2)}</p>
                    </div>

                    {/* Gestione Stato e Pagamenti */}
                    <div>
                        <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Gestione</h3>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Stato Prenotazione</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.6rem',
                                    borderRadius: '0.4rem',
                                    border: '2px solid',
                                    borderColor: getStatusColor(status),
                                    backgroundColor: getStatusColor(status) + '10',
                                    color: getStatusColor(status),
                                    fontWeight: 'bold',
                                    fontSize: '1rem',
                                    cursor: 'pointer'
                                }}
                            >
                                <option value="pending" style={{ color: 'black' }}>Pending</option>
                                <option value="approved" style={{ color: 'black' }}>Approved</option>
                                <option value="booked" style={{ color: 'black' }}>Booked</option>
                                <option value="confirmed" style={{ color: 'black' }}>Confirmed</option>
                                <option value="cancelled" style={{ color: 'black' }}>Cancelled</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Data versamento caparra</label>
                                <input
                                    type="date"
                                    value={caparraDate}
                                    onChange={(e) => setCaparraDate(e.target.value)}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}
                                />
                                <button
                                    onClick={() => openEmailModal('deposit')}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.4rem', fontSize: '0.8rem' }}
                                >
                                    ✉️ Invia Link Caparra
                                </button>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Data versamento saldo</label>
                                <input
                                    type="date"
                                    value={saldoDate}
                                    onChange={(e) => setSaldoDate(e.target.value)}
                                    style={{ width: '100%', padding: '0.6rem', borderRadius: '0.4rem', border: '1px solid var(--border)' }}
                                />
                                <button
                                    onClick={() => openEmailModal('balance')}
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: '0.5rem', padding: '0.4rem', fontSize: '0.8rem', background: '#3b82f6' }}
                                >
                                    ✉️ Invia Link Saldo
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                            <button
                                onClick={handleSave}
                                disabled={updatingId === id}
                                className="btn btn-primary"
                                style={{ opacity: updatingId ? 0.7 : 1 }}
                            >
                                {updatingId ? 'Salvataggio...' : 'Salva Modifiche'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
