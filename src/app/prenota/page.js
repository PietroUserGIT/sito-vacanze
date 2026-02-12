'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

export default function PrenotaPage() {
    const [properties, setProperties] = useState([]);
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

    const getPropertyText = (property, field) => {
        return property[`${field}_${locale}`] || property[field];
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            alert('Errore durante la prenotazione: ' + error.message);
        } else {
            alert('Prenotazione effettuata con successo! In una fase successiva verrai reindirizzato a Stripe per il pagamento.');
            // Reset form o redirect
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
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ textAlign: 'center', marginBottom: 'var(--space-m)', fontSize: '3rem' }}>
                    {t('booking.title')}
                </h1>

                <div style={{ background: 'white', padding: 'var(--space-m)', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-s)' }}>
                            <div>
                                <label style={labelStyle}>{t('booking.checkIn')}</label>
                                <input
                                    type="date"
                                    name="checkIn"
                                    required
                                    style={inputStyle}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>{t('booking.checkOut')}</label>
                                <input
                                    type="date"
                                    name="checkOut"
                                    required
                                    style={inputStyle}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <label style={labelStyle}>{t('booking.selectApartment')}</label>
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

                        <hr style={{ margin: 'var(--space-m) 0', border: 'none', borderTop: '1px solid var(--border)' }} />

                        <h3 style={{ marginBottom: 'var(--space-s)' }}>{t('booking.personalData')}</h3>

                        <label style={labelStyle}>{t('booking.fullName')}</label>
                        <input
                            type="text"
                            name="name"
                            placeholder="Mario Rossi"
                            required
                            style={inputStyle}
                            onChange={handleChange}
                        />

                        <label style={labelStyle}>{t('booking.email')}</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="mario.rossi@esempio.it"
                            required
                            style={inputStyle}
                            onChange={handleChange}
                        />

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: 'var(--space-m)', fontSize: '1.1rem', opacity: isSubmitting ? 0.7 : 1 }}
                        >
                            {isSubmitting ? t('booking.submitting') : t('booking.submit')}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: 'var(--space-s)', fontSize: '0.875rem' }}>
                    {t('booking.stripeNote')}
                </p>
            </div>
        </main>
    );
}
