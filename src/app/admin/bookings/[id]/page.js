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

    const [emailModal, setEmailModal] = useState({ isOpen: false, type: null });
    const [emailFormData, setEmailFormData] = useState({
        caparraAmount: 0,
        caparraDueDate: '',
        saldoAmount: 0,
        saldoDueDate: ''
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
            // Manteniamo le logiche su status e date vere
        }
        setLoading(false);
    }

    const handleSave = async () => {
        setUpdatingId(id);
        const updateData = {
            status: status
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

        const scadCapDate = new Date();
        scadCapDate.setDate(scadCapDate.getDate() + 3);

        const scadSaldoDate = new Date(booking.check_in);
        scadSaldoDate.setDate(scadSaldoDate.getDate() - 14);

        setEmailFormData({
            caparraAmount: caparraProp,
            caparraDueDate: scadCapDate.toISOString().split('T')[0],
            saldoAmount: saldoProp,
            saldoDueDate: scadSaldoDate.toISOString().split('T')[0]
        });

        setEmailModal({ isOpen: true, type });
    };

    const handleEmailGenerate = async (e) => {
        e.preventDefault();
        const { type } = emailModal;
        setIsGenerating(true);

        const checkInDate = new Date(booking.check_in).toLocaleDateString();
        const checkOutDate = new Date(booking.check_out).toLocaleDateString();

        const scadenzaCapArr = new Date(emailFormData.caparraDueDate).toLocaleDateString();
        const scadenzaSaldoArr = new Date(emailFormData.saldoDueDate).toLocaleDateString();

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
                    amount: type === 'deposit' ? parseFloat(emailFormData.caparraAmount) : parseFloat(emailFormData.saldoAmount),
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

        // Recuperiamo i template dal database
        const { data: settingsData } = await supabase
            .from('settings')
            .select('*')
            .in('id', ['email_deposit_template', 'email_balance_template']);

        const templates = {};
        if (settingsData) {
            settingsData.forEach(s => templates[s.id] = s.value);
        }

        const activeTemplate = type === 'deposit'
            ? (templates.email_deposit_template || 'Gentile {{guest_name}}, approvazione prenotazione...')
            : (templates.email_balance_template || 'Gentile {{guest_name}}, richiesta saldo...');

        const replaceTags = (text, data) => {
            return text
                .replace(/\\n/g, '\n') // Converte i "\n" testuali inseriti a mano o dal DB in veri a capo
                .replace(/{{guest_name}}/g, data.guest_name)
                .replace(/{{property_name}}/g, data.property_name)
                .replace(/{{check_in}}/g, data.check_in)
                .replace(/{{check_out}}/g, data.check_out)
                .replace(/{{total_price}}/g, data.total_price)
                .replace(/{{payment_amount}}/g, data.payment_amount)
                .replace(/{{due_date}}/g, data.due_date)
                .replace(/{{payment_link}}/g, data.payment_link)
                .replace(/{{guest_note}}/g, data.guest_note);
        };

        bodyText = replaceTags(activeTemplate, {
            guest_name: booking.guest_name,
            property_name: booking.properties?.name || 'Appartamento',
            check_in: checkInDate,
            check_out: checkOutDate,
            total_price: parseFloat(booking.total_price).toFixed(2),
            payment_amount: type === 'deposit' ? emailFormData.caparraAmount : emailFormData.saldoAmount,
            due_date: type === 'deposit' ? scadenzaCapArr : scadenzaSaldoArr,
            payment_link: paymentLink,
            guest_note: booking.guest_note || 'Nessuna nota fornita'
        });

        const body = encodeURIComponent(bodyText.replace(/\r?\n/g, '\r\n'));
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
                        <h2 style={{ marginTop: 0 }}>Gestione {emailModal.type === 'deposit' ? 'Caparra' : 'Saldo'}</h2>
                        <p style={{ color: 'var(--text-muted)' }}>Controlla importi e scadenze per il pagamento di {booking.guest_name}.</p>

                        <form onSubmit={handleEmailGenerate}>
                            <h4 style={{ marginBottom: '0.5rem' }}>Dati Caparra</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', opacity: emailModal.type === 'balance' ? 0.6 : 1 }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Importo Caparra (€)</label>
                                    <input type="number" step="0.01" value={emailFormData.caparraAmount} onChange={e => setEmailFormData({ ...emailFormData, caparraAmount: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required disabled={emailModal.type === 'balance'} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Scadenza Caparra</label>
                                    <input type="date" value={emailFormData.caparraDueDate} onChange={e => setEmailFormData({ ...emailFormData, caparraDueDate: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required disabled={emailModal.type === 'balance'} />
                                </div>
                            </div>

                            <h4 style={{ marginBottom: '0.5rem' }}>Dati Saldo</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Importo Saldo (€)</label>
                                    <input type="number" step="0.01" value={emailFormData.saldoAmount} onChange={e => setEmailFormData({ ...emailFormData, saldoAmount: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.2rem' }}>Scadenza Saldo</label>
                                    <input type="date" value={emailFormData.saldoDueDate} onChange={e => setEmailFormData({ ...emailFormData, saldoDueDate: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.3rem', border: '1px solid #ccc' }} required />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button type="button" onClick={() => setEmailModal({ isOpen: false, type: null })} disabled={isGenerating} className="btn" style={{ background: '#e2e8f0', color: 'black' }}>Annulla</button>
                                <button type="submit" disabled={isGenerating} className="btn btn-primary" style={{ opacity: isGenerating ? 0.7 : 1 }}>
                                    {isGenerating ? 'Generazione Link...' : `Invia Link ${emailModal.type === 'deposit' ? 'Caparra' : 'Saldo'}`}
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

                        {booking.guest_note && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#fffbeb', borderLeft: '4px solid #f59e0b', borderRadius: '0.25rem' }}>
                                <strong>Nota Cliente:</strong>
                                <p style={{ margin: '0.5rem 0 0 0', whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{booking.guest_note}</p>
                            </div>
                        )}

                        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8fafc', borderRadius: '0.5rem', fontSize: '0.9rem', border: '1px solid var(--border)' }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Data effettiva versamento caparra:</strong><br />
                                <span style={{ color: booking.caparra_paid_at ? 'var(--primary)' : 'var(--text-muted)' }}>
                                    {booking.caparra_paid_at ? new Date(booking.caparra_paid_at).toLocaleDateString() : 'Non ancora versata'}
                                </span>
                            </div>
                            <div>
                                <strong>Data effettiva versamento saldo:</strong><br />
                                <span style={{ color: booking.saldo_paid_at ? 'var(--primary)' : 'var(--text-muted)' }}>
                                    {booking.saldo_paid_at ? new Date(booking.saldo_paid_at).toLocaleDateString() : 'Non ancora versato'}
                                </span>
                            </div>
                        </div>
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
                                <button
                                    onClick={() => openEmailModal('deposit')}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem' }}
                                >
                                    ⚖️ Gestione Caparra
                                </button>
                            </div>

                            <div>
                                <button
                                    onClick={() => openEmailModal('balance')}
                                    className="btn btn-primary"
                                    style={{ width: '100%', padding: '0.8rem', fontSize: '0.9rem', background: '#3b82f6' }}
                                >
                                    ⚖️ Gestione Saldo
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
