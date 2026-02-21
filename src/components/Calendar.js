'use client';
import { useState, useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export default function Calendar({ dateStatuses = {}, isAdmin = false, onDateSelect, selectedRange = { start: null, end: null } }) {
    const { t, locale } = useLanguage();
    const [viewDate, setViewDate] = useState(new Date());

    const months = t('calendar.months') || ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
    const days = t('calendar.days') || ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Helper per stringa oggi
    const today = new Date();
    const todayYYYY = today.getFullYear();
    const todayMM = String(today.getMonth() + 1).padStart(2, '0');
    const todayDD = String(today.getDate()).padStart(2, '0');
    const todayString = `${todayYYYY}-${todayMM}-${todayDD}`;

    // Helper per calcolare i giorni del mese
    const calendarDays = useMemo(() => {
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        // Giorni del mese precedente per riempire l'inizio
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push({ day: null, date: null });
        }

        // Helper interno per stato effettivo
        const getEffectiveStatus = (s) => {
            if (!s || s === 'available') return 'available';
            if (s === 'occupied') return 'occupied'; // Supporto per hardcoded occupied da frontend
            if (['approved', 'booked', 'confirmed'].includes(s)) return isAdmin ? s : 'occupied';
            if (s === 'pending') return isAdmin ? 'pending' : 'available';
            return 'occupied';
        };

        // Giorni del mese attuale
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const YYYY = date.getFullYear();
            const MM = String(date.getMonth() + 1).padStart(2, '0');
            const DD = String(date.getDate()).padStart(2, '0');
            const dateString = `${YYYY}-${MM}-${DD}`;

            const dStatus = dateStatuses[dateString] || { morning: 'available', afternoon: 'available' };
            const isPast = dateString < todayString;

            const isCurrentDay = dateString === todayString;
            // La mattina della data odierna è sempre considerata passata/occupata
            const morningStatus = isCurrentDay ? 'occupied' : getEffectiveStatus(dStatus.morning);
            const afternoonStatus = getEffectiveStatus(dStatus.afternoon);

            days.push({
                day: i,
                date: dateString,
                morningStatus,
                afternoonStatus,
                isPast,
                isCurrent: dateString === todayString,
                isSelected: (selectedRange.start === dateString) || (selectedRange.end === dateString),
                isInRange: selectedRange.start && selectedRange.end && dateString > selectedRange.start && dateString < selectedRange.end
            });
        }

        return days;
    }, [year, month, dateStatuses, selectedRange, todayString, isAdmin]);

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
                {calendarDays.map((d, i) => {
                    const isFullyOccupied = d.morningStatus === 'occupied' && d.afternoonStatus === 'occupied';
                    const isDisabled = isFullyOccupied || d.isPast;

                    const getBgColor = (effStatus) => {
                        if (effStatus === 'occupied') return '#e2e8f0'; // Grigio più scuro per miglior contrasto
                        if (effStatus === 'pending') return '#fef3c7';
                        if (effStatus === 'approved') return '#dbeafe';
                        if (effStatus === 'booked') return '#ede9fe';
                        if (effStatus === 'confirmed') return '#d1fae5';
                        return 'transparent';
                    };

                    const getBorderColor = (effStatus) => {
                        if (effStatus === 'pending') return '#f59e0b';
                        if (effStatus === 'approved') return '#3b82f6';
                        if (effStatus === 'booked') return '#8b5cf6';
                        if (effStatus === 'confirmed') return '#10b981';
                        return 'transparent';
                    };

                    let cMorning = getBgColor(d.morningStatus);
                    let cAfternoon = getBgColor(d.afternoonStatus);

                    let bgStyle = 'transparent';
                    let textColor = 'var(--text)';
                    let borderStyle = 'none';

                    if (d.isSelected || d.isInRange) {
                        bgStyle = 'var(--primary)';
                        textColor = 'white';
                    } else if (d.isPast) {
                        bgStyle = '#e2e8f0'; // Grigio più scuro per date passate
                        textColor = '#94a3b8'; // Testo grigio visibile
                    } else {
                        if (cMorning === cAfternoon) {
                            bgStyle = cMorning;
                        } else {
                            bgStyle = `linear-gradient(to right, ${cMorning} 50%, ${cAfternoon} 50%)`;
                        }

                        if (isFullyOccupied) {
                            textColor = '#64748b'; // Grigio molto leggibile per giorni indisponibili completi
                        } else if (d.morningStatus !== 'available' || d.afternoonStatus !== 'available') {
                            textColor = 'var(--text)'; // Se almeno mezza giornata è colorata ma non occupata (testo scuro invece di chiaro)
                        }

                        // Border styling per admin view
                        if (isAdmin && !d.isSelected && !d.isInRange) {
                            const bM = getBorderColor(d.morningStatus);
                            const bA = getBorderColor(d.afternoonStatus);
                            if (bM !== 'transparent' || bA !== 'transparent') {
                                // Semplifichiamo: se c'è un match al mattino usiamo quello, altrimenti pomeriggio
                                const primaryBorderColor = bM !== 'transparent' ? bM : bA;
                                borderStyle = `2px dashed ${primaryBorderColor}`;
                            }
                        }
                    }

                    return (
                        <div
                            key={i}
                            onClick={() => d.date && !isDisabled && onDateSelect(d.date)}
                            style={{
                                aspectRatio: '1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.5rem',
                                cursor: d.day && !isDisabled ? 'pointer' : 'default',
                                fontSize: '0.9rem',
                                position: 'relative',
                                transition: 'all 0.2s ease',
                                background: bgStyle,
                                color: textColor,
                                opacity: d.isInRange ? 0.8 : 1,
                                fontWeight: d.isCurrent || d.isSelected ? 'bold' : 'normal',
                                border: d.isCurrent && !d.isSelected ? '2px solid var(--primary)' : borderStyle,
                                textDecoration: isFullyOccupied && !d.isPast ? 'line-through' : 'none',
                                transform: d.isSelected ? 'scale(1.1)' : 'scale(1)',
                                boxShadow: d.isSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            {d.day}
                        </div>
                    );
                })}
            </div>

            {/* Legenda (aggiornata in base all'utente) */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '2px' }}></div>
                    {t('calendar.available') || 'Disponibile'}
                </div>
                {!isAdmin && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <div style={{ width: '10px', height: '10px', background: '#e2e8f0', borderRadius: '2px' }}></div>
                        {t('calendar.occupied') || 'Occupato'}
                    </div>
                )}
                {isAdmin && (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: '10px', height: '10px', background: '#fef3c7', border: '1px dashed #f59e0b', borderRadius: '2px' }}></div>
                            In attesa
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: '10px', height: '10px', background: '#dbeafe', border: '1px dashed #3b82f6', borderRadius: '2px' }}></div>
                            Approvato
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: '10px', height: '10px', background: '#ede9fe', border: '1px dashed #8b5cf6', borderRadius: '2px' }}></div>
                            Bloccato/In Pag.
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <div style={{ width: '10px', height: '10px', background: '#d1fae5', border: '1px dashed #10b981', borderRadius: '2px' }}></div>
                            Confermato
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
