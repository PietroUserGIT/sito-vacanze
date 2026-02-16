'use client';
import { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function Calendar({ bookedDates = [], onDateSelect, selectedRange = { start: null, end: null } }) {
    const { t, locale } = useLanguage();
    const [viewDate, setViewDate] = useState(new Date());

    const months = t('calendar.months');
    const days = t('calendar.days');

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Helper per calcolare i giorni del mese
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Giorni del mese precedente per riempire l'inizio
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ day: null, date: null });
        }

        // Giorni del mese attuale
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateString = date.toISOString().split('T')[0];
            const isBooked = bookedDates.includes(dateString);

            days.push({
                day: i,
                date: dateString,
                isBooked,
                isCurrent: i === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear(),
                isSelected: (selectedRange.start === dateString) || (selectedRange.end === dateString),
                isInRange: selectedRange.start && selectedRange.end && dateString > selectedRange.start && dateString < selectedRange.end
            });
        }

        return days;
    }, [year, month, bookedDates, selectedRange]);

    const changeMonth = (offset) => {
        setViewDate(new Date(year, month + offset, 1));
    };

    return (
        <div style={{
            background: 'white',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            border: '1px solid var(--border)',
            userSelect: 'none'
        }}>
            {/* Header Calendario */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => changeMonth(-1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}
                >
                    ←
                </button>
                <h3 style={{ margin: 0, textTransform: 'capitalize' }}>
                    {months[month]} {year}
                </h3>
                <button
                    onClick={() => changeMonth(1)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0.5rem' }}
                >
                    →
                </button>
            </div>

            {/* Giorni della settimana */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '5px',
                textAlign: 'center',
                fontWeight: '600',
                color: 'var(--text-muted)',
                fontSize: '0.8rem',
                marginBottom: '0.5rem'
            }}>
                {days.map(d => <div key={d}>{d}</div>)}
            </div>

            {/* Griglia giorni */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '5px'
            }}>
                {calendarDays.map((d, i) => (
                    <div
                        key={i}
                        onClick={() => d.date && !d.isBooked && onDateSelect(d.date)}
                        style={{
                            aspectRatio: '1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.5rem',
                            cursor: d.day && !d.isBooked ? 'pointer' : 'default',
                            fontSize: '0.9rem',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            backgroundColor: d.isSelected || d.isInRange ? 'var(--primary)' :
                                d.isBooked ? '#f8fafc' : 'transparent',
                            color: d.isSelected || d.isInRange ? 'white' :
                                d.isBooked ? '#cbd5e1' : 'var(--text)',
                            opacity: d.isInRange ? 0.8 : 1,
                            fontWeight: d.isCurrent || d.isSelected ? 'bold' : 'normal',
                            border: d.isCurrent && !d.isSelected ? '2px solid var(--primary)' : 'none',
                            textDecoration: d.isBooked ? 'line-through' : 'none',
                            transform: d.isSelected ? 'scale(1.1)' : 'scale(1)',
                            boxShadow: d.isSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {d.day}
                    </div>
                ))}
            </div>

            {/* Legenda */}
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                    {t('calendar.available')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{ width: '10px', height: '10px', background: '#f1f5f9', borderRadius: '2px' }}></div>
                    {t('calendar.occupied')}
                </div>
            </div>
        </div>
    );
}
