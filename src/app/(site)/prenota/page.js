'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';
import Calendar from '@/components/Calendar';
import Link from 'next/link';

export default function PrenotaPage() {
    const [properties, setProperties] = useState([]);
    const [dateStatuses, setDateStatuses] = useState({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { t, locale } = useLanguage();

    const [formData, setFormData] = useState({
        checkIn: '',
        checkOut: '',
        apartmentId: '',
        guests: '1',
        name: '',
        email: ''
    });

    useEffect(() => {
        async function fetchProperties() {
            const { data, error } = await supabase.from('properties').select('*');
            if (error) {
                console.error('Errore caricamento appartamenti:', error);
            } else {
                setProperties(data || []);
            }
            setLoading(false);
        }
        fetchProperties();
    }, []);

    // Fetch delle date occupate quando cambia l'appartamento
    useEffect(() => {
        if (!formData.apartmentId) {
            setDateStatuses({});
            return;
        }

        async function fetchBookings() {
            const { data, error } = await supabase
                .from('bookings')
                .select('check_in, check_out, status')
                .eq('property_id', formData.apartmentId)
                // SOLO date approvate o bloccate sono inaccessibili al pubblico. I pending restano selezionabili.
                .in('status', ['approved', 'booked', 'confirmed']);

            if (error) {
                console.error('Errore caricamento prenotazioni:', error);
            } else {
                const statuses = {};
                data.forEach(booking => {
                    // Estraiamo la sola stringa della data (YYYY-MM-DD)
                    const checkInStr = booking.check_in.split('T')[0];
                    const checkOutStr = booking.check_out.split('T')[0];

                    // Partiamo dal checkIn, forzando orario 12:00 locale per evitare sbalzi di giorno dovuti al fuso
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

                        // Trattiamo gli stati approvati/bloccati come "occupied" per il pubblico
                        const displayStatus = ['approved', 'booked', 'confirmed'].includes(booking.status) ? 'occupied' : booking.status;

                        if (dateStr === checkInStr && dateStr === checkOutStr) {
                            statuses[dateStr].morning = displayStatus;
                            statuses[dateStr].afternoon = displayStatus;
                        } else if (dateStr === checkInStr) {
                            statuses[dateStr].afternoon = displayStatus;
                        } else if (dateStr === checkOutStr) {
                            statuses[dateStr].morning = displayStatus;
                        } else {
                            statuses[dateStr].morning = displayStatus;
                            statuses[dateStr].afternoon = displayStatus;
                        }

                        current.setDate(current.getDate() + 1);
                    }
                });
                setDateStatuses(statuses);
            }
        }

        fetchBookings();
    }, [formData.apartmentId]);

    const handleDateSelect = (date) => {
        const getEffectiveStatus = (s) => (['approved', 'booked', 'confirmed'].includes(s) ? 'occupied' : 'available');

        if (!formData.checkIn || (formData.checkIn && formData.checkOut)) {
            // Selecting checkIn
            if (getEffectiveStatus(dateStatuses[date]?.afternoon) === 'occupied') {
                return; // Pomeriggio occupato, non può entrare
            }
            setFormData(prev => ({ ...prev, checkIn: date, checkOut: '' }));
        } else {
            // Selecting checkOut
            if (date <= formData.checkIn) {
                // Restart checkIn picking
                if (getEffectiveStatus(dateStatuses[date]?.afternoon) === 'occupied') {
                    return;
                }
                setFormData(prev => ({ ...prev, checkIn: date, checkOut: '' }));
            } else {
                // Validate range mapping
                if (getEffectiveStatus(dateStatuses[date]?.morning) === 'occupied') {
                    return; // Mattina occupata, non può uscire
                }

                let valid = true;
                let cur = new Date(formData.checkIn);
                cur.setDate(cur.getDate() + 1);
                const end = new Date(date);
                while (cur < end) {
                    const YYYY = cur.getFullYear();
                    const MM = String(cur.getMonth() + 1).padStart(2, '0');
                    const DD = String(cur.getDate()).padStart(2, '0');
                    const dStr = `${YYYY}-${MM}-${DD}`;

                    if (getEffectiveStatus(dateStatuses[dStr]?.morning) === 'occupied' || getEffectiveStatus(dateStatuses[dStr]?.afternoon) === 'occupied') {
                        valid = false;
                        break;
                    }
                    cur.setDate(cur.getDate() + 1);
                }

                if (!valid) {
                    alert('Attenzione, il periodo selezionato comprende date non disponibili');
                    return;
                }
                setFormData(prev => ({ ...prev, checkOut: date }));
            }
        }
    };

    const getPropertyText = (property, field) => {
        return property[`${field}_${locale}`] || property[field];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.checkIn || !formData.checkOut) {
            alert(t('calendar.selectDates') || 'Seleziona le date nel calendario');
            return;
        }

        setIsSubmitting(true);

        // --- CONTROLLO OVERLAP LATO SERVER ---
        // Verifichiamo se esistono prenotazioni incompatibili nel medesimo range
        const { data: overlaps, error: overlapError } = await supabase
            .from('bookings')
            .select('id')
            .eq('property_id', formData.apartmentId)
            .in('status', ['approved', 'booked', 'confirmed'])
            .lt('check_in', formData.checkOut)
            .gt('check_out', formData.checkIn);

        if (overlapError) {
            alert('Errore di validazione disponibilità: ' + overlapError.message);
            setIsSubmitting(false);
            return;
        }

        if (overlaps && overlaps.length > 0) {
            alert('Attenzione, il periodo selezionato comprende date non disponibili');
            setIsSubmitting(false);
            return;
        }
        // -------------------------------------

        const selectedProperty = properties.find(p => p.id === formData.apartmentId);

        // Calcolo prezzo semplificato: (Giorni) * prezzo_notte
        const checkInDate = new Date(formData.checkIn);
        const checkOutDate = new Date(formData.checkOut);
        const diffTime = Math.abs(checkOutDate - checkInDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        const total_price = diffDays * (selectedProperty?.price_per_night || 0);

        const { data, error } = await supabase.from('bookings').insert([{
            property_id: formData.apartmentId,
            check_in: formData.checkIn,
            check_out: formData.checkOut,
            guest_name: formData.name,
            guest_email: formData.email,
            total_price: total_price,
            status: 'pending' // pending non blocca il calendario
        }]);

        if (error) {
            alert((t('booking.error') || 'Errore:') + ' ' + error.message);
        } else {
            setIsSuccess(true);
        }
        setIsSubmitting(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--border)',
        marginTop: '0.5rem',
        fontFamily: 'inherit'
    };

    const labelStyle = {
        display: 'block',
        fontWeight: '600',
        color: 'var(--primary)',
        marginTop: '1rem'
    };

    if (loading) return <div className="container" style={{ padding: 'var(--space-l) 0' }}>{t('booking.loading')}</div>;

    if (isSuccess) {
        return (
            <main style={{ padding: 'var(--space-xl) 0', minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: 'white', padding: '4rem 2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' }}>
                    <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📧</div>
                    <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Email Inoltrata</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                        La tua richiesta di prenotazione è stata inviata con successo. Riceverai presto un'email di conferma con i dettagli per procedere.
                    </p>
                    <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Torna alla Home page
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main style={{ padding: 'var(--space-l) 0', minHeight: '100vh', background: 'var(--bg-main)' }}>
            <div className="container" style={{ maxWidth: '1000px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: 'var(--space-m)', fontSize: '3rem' }}>
                    {t('booking.title')}
                </h1>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(300px, 1fr) 400px',
                    gap: 'var(--space-m)',
                    alignItems: 'start'
                }}>
                    {/* Colonna Sinistra: Calendario e Selezione Appartamento */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-m)' }}>
                        <div style={{ background: 'white', padding: 'var(--space-m)', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                            <label style={{ ...labelStyle, marginTop: 0 }}>{t('booking.selectApartment')}</label>
                            <select
                                name="apartmentId"
                                required
                                style={inputStyle}
                                onChange={handleChange}
                                value={formData.apartmentId}
                            >
                                <option value="">{t('booking.chooseOption')}</option>
                                {properties.map(p => (
                                    <option key={p.id} value={p.id}>{getPropertyText(p, 'name')} (€{p.price_per_night}/notte)</option>
                                ))}
                            </select>
                        </div>

                        {formData.apartmentId && (
                            <Calendar
                                dateStatuses={dateStatuses}
                                onDateSelect={handleDateSelect}
                                selectedRange={{ start: formData.checkIn, end: formData.checkOut }}
                            />
                        )}

                        {!formData.apartmentId && (
                            <div style={{
                                background: 'white',
                                padding: '3rem',
                                borderRadius: '1rem',
                                textAlign: 'center',
                                border: '2px dashed var(--border)',
                                color: 'var(--text-muted)'
                            }}>
                                {t('booking.selectApartment')}
                            </div>
                        )}
                    </div>

                    {/* Colonna Destra: Form Dati */}
                    <div style={{ background: 'white', padding: 'var(--space-m)', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <form onSubmit={handleSubmit}>
                            <h3 style={{ marginBottom: 'var(--space-s)' }}>{t('booking.personalData')}</h3>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-s)' }}>
                                <div>
                                    <label style={labelStyle}>{t('booking.checkIn')}</label>
                                    <input
                                        type="date"
                                        name="checkIn"
                                        required
                                        style={inputStyle}
                                        value={formData.checkIn}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>{t('booking.checkOut')}</label>
                                    <input
                                        type="date"
                                        name="checkOut"
                                        required
                                        style={inputStyle}
                                        value={formData.checkOut}
                                        readOnly
                                    />
                                </div>
                            </div>

                            <label style={labelStyle}>{t('booking.guests')}</label>
                            <input
                                type="number"
                                name="guests"
                                min="1"
                                max="6"
                                required
                                style={inputStyle}
                                onChange={handleChange}
                                value={formData.guests}
                            />

                            <label style={labelStyle}>{t('booking.fullName')}</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Mario Rossi"
                                required
                                style={inputStyle}
                                onChange={handleChange}
                                value={formData.name}
                            />

                            <label style={labelStyle}>{t('booking.email')}</label>
                            <input
                                type="email"
                                name="email"
                                placeholder="mario.rossi@esempio.it"
                                required
                                style={inputStyle}
                                onChange={handleChange}
                                value={formData.email}
                            />

                            <button
                                type="submit"
                                disabled={isSubmitting || !formData.apartmentId}
                                className="btn btn-primary"
                                style={{ width: '100%', marginTop: 'var(--space-m)', fontSize: '1.1rem', opacity: (isSubmitting || !formData.apartmentId) ? 0.7 : 1 }}
                            >
                                {isSubmitting ? t('booking.submitting') : 'Invio email di prenotazione'}
                            </button>
                        </form>
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: 'var(--space-m)', fontSize: '0.875rem' }}>
                    Le tue date non verranno bloccate finché non riceverai un'approvazione via email.
                </p>
            </div>
        </main>
    );
}
