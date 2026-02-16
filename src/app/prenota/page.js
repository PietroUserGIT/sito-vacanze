'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';
import Calendar from '@/components/Calendar';

export default function PrenotaPage() {
    const [properties, setProperties] = useState([]);
    const [bookedDates, setBookedDates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
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
            setBookedDates([]);
            return;
        }

        async function fetchBookings() {
            const { data, error } = await supabase
                .from('bookings')
                .select('check_in, check_out')
                .eq('property_id', formData.apartmentId)
                .neq('status', 'cancelled');

            if (error) {
                console.error('Errore caricamento prenotazioni:', error);
            } else {
                const dates = [];
                data.forEach(booking => {
                    let current = new Date(booking.check_in);
                    const end = new Date(booking.check_out);
                    while (current <= end) {
                        dates.push(current.toISOString().split('T')[0]);
                        current.setDate(current.getDate() + 1);
                    }
                });
                setBookedDates(dates);
            }
        }
        fetchBookings();
    }, [formData.apartmentId]);

    const handleDateSelect = (date) => {
        if (!formData.checkIn || (formData.checkIn && formData.checkOut)) {
            setFormData(prev => ({ ...prev, checkIn: date, checkOut: '' }));
        } else {
            if (date < formData.checkIn) {
                setFormData(prev => ({ ...prev, checkIn: date, checkOut: '' }));
            } else {
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
            alert(t('calendar.selectDates'));
            return;
        }

        setIsSubmitting(true);

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
            status: 'pending'
        }]);

        if (error) {
            alert(t('booking.error') + error.message);
        } else {
            alert(t('booking.success') + ' ' + t('booking.stripeNote'));
            setFormData({
                checkIn: '',
                checkOut: '',
                apartmentId: '',
                guests: '1',
                name: '',
                email: ''
            });
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
                                bookedDates={bookedDates}
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
                                {isSubmitting ? t('booking.submitting') : t('booking.submit')}
                            </button>
                        </form>
                    </div>
                </div>

                <p style={{ textAlign: 'center', marginTop: 'var(--space-m)', fontSize: '0.875rem' }}>
                    {t('booking.stripeNote')}
                </p>
            </div>
        </main>
    );
}
