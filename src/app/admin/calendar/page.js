'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Calendar from '@/components/Calendar';

export default function AdminCalendarPage() {
    const [properties, setProperties] = useState([]);
    const [selectedPropertyId, setSelectedPropertyId] = useState('');
    const [dateStatuses, setDateStatuses] = useState({});
    const [selectedDateRange, setSelectedDateRange] = useState({ start: '', end: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingInfo, setLoadingInfo] = useState('');

    // Fetch appartamenti
    useEffect(() => {
        async function fetchProperties() {
            const { data, error } = await supabase.from('properties').select('*');
            if (error) {
                console.error('Errore caricamento appartamenti:', error);
            } else {
                setProperties(data || []);
                if (data && data.length > 0) {
                    setSelectedPropertyId(data[0].id);
                }
            }
        }
        fetchProperties();
    }, []);

    useEffect(() => {
        if (!selectedPropertyId) return;

        async function fetchBookings() {
            const { data, error } = await supabase
                .from('bookings')
                .select('check_in, check_out, status')
                .eq('property_id', selectedPropertyId)
                .neq('status', 'cancelled');

            if (error) {
                console.error('Errore caricamento prenotazioni:', error);
            } else {
                const statuses = {};
                data.forEach(booking => {
                    const checkInStr = booking.check_in.split('T')[0];
                    const checkOutStr = booking.check_out.split('T')[0];

                    let current = new Date(`${checkInStr}T12:00:00`);
                    const end = new Date(`${checkOutStr}T12:00:00`);

                    while (current <= end) {
                        const YYYY = current.getFullYear();
                        const MM = String(current.getMonth() + 1).padStart(2, '0');
                        const DD = String(current.getDate()).padStart(2, '0');
                        const dateStr = `${YYYY}-${MM}-${DD}`;

                        if (!statuses[dateStr]) {
                            statuses[dateStr] = { morning: 'available', afternoon: 'available' };
                        }

                        if (dateStr === checkInStr && dateStr === checkOutStr) {
                            statuses[dateStr].morning = booking.status;
                            statuses[dateStr].afternoon = booking.status;
                        } else if (dateStr === checkInStr) {
                            statuses[dateStr].afternoon = booking.status;
                        } else if (dateStr === checkOutStr) {
                            statuses[dateStr].morning = booking.status;
                        } else {
                            statuses[dateStr].morning = booking.status;
                            statuses[dateStr].afternoon = booking.status;
                        }

                        current.setDate(current.getDate() + 1);
                    }
                });
                setDateStatuses(statuses);
            }
        }
        fetchBookings();
    }, [selectedPropertyId]);

    const handleDateSelect = (date) => {
        if (!selectedDateRange.start || (selectedDateRange.start && selectedDateRange.end)) {
            setSelectedDateRange({ start: date, end: '' });
        } else {
            if (date < selectedDateRange.start) {
                setSelectedDateRange({ start: date, end: '' });
            } else {
                setSelectedDateRange(prev => ({ ...prev, end: date }));
            }
        }
    };

    const handleBlockDates = async (e) => {
        e.preventDefault();
        if (!selectedDateRange.start || !selectedDateRange.end) {
            alert('Devi selezionare una data di inizio e una di fine.');
            return;
        }

        setIsSubmitting(true);
        setLoadingInfo('Blocco date in corso...');

        // Creiamo una "prenotazione fittizia" con stato 'booked' per bloccare le date sul calendario pubblico
        const { error } = await supabase.from('bookings').insert([{
            property_id: selectedPropertyId,
            check_in: selectedDateRange.start,
            check_out: selectedDateRange.end,
            guest_name: 'BLOCCO MANUALE (Admin)',
            guest_email: 'admin@vacanzemare.local',
            total_price: 0,
            status: 'booked'
        }]);

        if (error) {
            alert('Errore durante il blocco date: ' + error.message);
        } else {
            alert('Date bloccate con successo!');
            // Aggiorna il calendario locale
            const newStatuses = { ...dateStatuses };

            // Fix orario anche per blocco manuale
            const checkInStr = selectedDateRange.start.split('T')[0];
            const checkOutStr = selectedDateRange.end.split('T')[0];

            let current = new Date(`${checkInStr}T12:00:00`);
            const end = new Date(`${checkOutStr}T12:00:00`);

            while (current <= end) {
                const YYYY = current.getFullYear();
                const MM = String(current.getMonth() + 1).padStart(2, '0');
                const DD = String(current.getDate()).padStart(2, '0');
                const dateStr = `${YYYY}-${MM}-${DD}`;

                if (!newStatuses[dateStr]) {
                    newStatuses[dateStr] = { morning: 'available', afternoon: 'available' };
                }

                if (dateStr === checkInStr && dateStr === checkOutStr) {
                    newStatuses[dateStr].morning = 'booked';
                    newStatuses[dateStr].afternoon = 'booked';
                } else if (dateStr === checkInStr) {
                    newStatuses[dateStr].afternoon = 'booked';
                } else if (dateStr === checkOutStr) {
                    newStatuses[dateStr].morning = 'booked';
                } else {
                    newStatuses[dateStr].morning = 'booked';
                    newStatuses[dateStr].afternoon = 'booked';
                }
                current.setDate(current.getDate() + 1);
            }
            setDateStatuses(newStatuses);
            setSelectedDateRange({ start: '', end: '' });
        }

        setIsSubmitting(false);
        setLoadingInfo('');
    };

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-l)' }}>
                <h1>Calendario e Blocco Date</h1>
                <p style={{ color: 'var(--text-muted)' }}>Visualizza le prenotazioni e blocca manualmente periodi per uso privato o manutenzione.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 400px', gap: 'var(--space-m)', alignItems: 'start' }}>
                {/* Colonna Sinistra: Calendario */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
                    <div style={{ background: 'white', padding: 'var(--space-m)', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Seleziona Appartamento:</label>
                        <select
                            value={selectedPropertyId}
                            onChange={(e) => {
                                setSelectedPropertyId(e.target.value);
                                setSelectedDateRange({ start: '', end: '' });
                            }}
                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}
                        >
                            {properties.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedPropertyId && (
                        <div style={{ pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.6 : 1 }}>
                            <Calendar
                                dateStatuses={dateStatuses}
                                isAdmin={true}
                                onDateSelect={handleDateSelect}
                                selectedRange={selectedDateRange}
                            />
                        </div>
                    )}
                </div>

                {/* Colonna Destra: Controlli di Blocco */}
                <div style={{ background: 'white', padding: 'var(--space-m)', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <form onSubmit={handleBlockDates}>
                        <h3 style={{ marginBottom: 'var(--space-s)' }}>Inserisci Blocco Manuale</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 'var(--space-s)' }}>
                            Le date selezionate appariranno come "Occupate" ai visitatori del sito senza generare richieste di prenotazione.
                        </p>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Inizio Blocco</label>
                            <input
                                type="date"
                                value={selectedDateRange.start}
                                readOnly
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: '#f8fafc' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem' }}>Fine Blocco</label>
                            <input
                                type="date"
                                value={selectedDateRange.end}
                                readOnly
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)', backgroundColor: '#f8fafc' }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!selectedDateRange.start || !selectedDateRange.end || isSubmitting}
                            className="btn btn-primary"
                            style={{
                                width: '100%',
                                background: 'var(--accent)', // Usa il colore rosso/warm per azioni distruttive/bloccanti
                                opacity: (!selectedDateRange.start || !selectedDateRange.end || isSubmitting) ? 0.5 : 1
                            }}
                        >
                            {isSubmitting ? loadingInfo : 'Conferma Blocco Date'}
                        </button>

                        <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#64748b' }}>
                            <strong>Suggerimento:</strong> Clicca su due giorni liberi nel calendario a sinistra per definire l'intervallo temporale da oscurare. Per sbloccare queste date in futuro, vai nella sezione "Prenotazioni", cerca la voce "BLOCCO MANUALE" e impostala su "Cancelled".
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
