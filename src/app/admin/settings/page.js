'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
    const [templates, setTemplates] = useState({
        email_deposit_template: '',
        email_balance_template: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('settings')
            .select('*')
            .in('id', ['email_deposit_template', 'email_balance_template']);

        if (error) {
            console.error('Errore caricamento impostazioni:', error);
            setMessage({ text: 'Errore nel caricamento delle impostazioni', type: 'error' });
        } else if (data) {
            const newTemplates = {};
            data.forEach(item => {
                newTemplates[item.id] = item.value;
            });
            setTemplates(prev => ({ ...prev, ...newTemplates }));
        }
        setLoading(false);
    };

    const handleSave = async (id) => {
        setSaving(true);
        setMessage({ text: '', type: '' });

        const { error } = await supabase
            .from('settings')
            .update({ value: templates[id], updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Errore durante il salvataggio:', error);
            setMessage({ text: 'Errore durante il salvataggio', type: 'error' });
        } else {
            setMessage({ text: 'Impostazioni salvate con successo!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
        setSaving(false);
    };

    const tags = [
        { name: '{{guest_name}}', desc: 'Nome dell\'ospite' },
        { name: '{{property_name}}', desc: 'Nome dell\'appartamento' },
        { name: '{{check_in}}', desc: 'Data check-in' },
        { name: '{{check_out}}', desc: 'Data check-out' },
        { name: '{{total_price}}', desc: 'Prezzo totale soggiorno' },
        { name: '{{payment_amount}}', desc: 'Importo da pagare (caparra o saldo)' },
        { name: '{{due_date}}', desc: 'Data di scadenza pagamento' },
        { name: '{{payment_link}}', desc: 'Link Stripe per il pagamento' },
        { name: '{{guest_note}}', desc: 'Nota aggiunta dal cliente in fase di prenotazione' },
    ];

    if (loading) return <div>Caricamento in corso...</div>;

    return (
        <div>
            <div style={{ marginBottom: 'var(--space-l)' }}>
                <h1 style={{ margin: 0 }}>⚙️ Impostazioni Gestionali</h1>
                <p style={{ color: 'var(--text-muted)' }}>Configura i template delle email e le preferenze del sistema.</p>
            </div>

            {message.text && (
                <div style={{
                    padding: '1rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
                    color: message.type === 'success' ? '#166534' : '#991b1b',
                    border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                    transition: 'all 0.3s ease'
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Template Caparra */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0 }}>Template Email: Approvazione e Caparra</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Inviata quando approvi una prenotazione e richiedi il versamento della caparra.
                        </p>
                        <textarea
                            value={templates.email_deposit_template}
                            onChange={(e) => setTemplates({ ...templates, email_deposit_template: e.target.value })}
                            style={{
                                width: '100%',
                                minHeight: '300px',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                marginBottom: '1rem',
                                resize: 'vertical'
                            }}
                        />
                        <button
                            onClick={() => handleSave('email_deposit_template')}
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ width: 'fit-content' }}
                        >
                            {saving ? 'Salvataggio...' : 'Salva Template Caparra'}
                        </button>
                    </div>

                    {/* Template Saldo */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <h3 style={{ marginTop: 0 }}>Template Email: Richiesta Saldo</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Inviata in prossimità del soggiorno per richiedere il saldo finale.
                        </p>
                        <textarea
                            value={templates.email_balance_template}
                            onChange={(e) => setTemplates({ ...templates, email_balance_template: e.target.value })}
                            style={{
                                width: '100%',
                                minHeight: '300px',
                                padding: '1rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)',
                                fontFamily: 'monospace',
                                fontSize: '0.9rem',
                                marginBottom: '1rem',
                                resize: 'vertical'
                            }}
                        />
                        <button
                            onClick={() => handleSave('email_balance_template')}
                            disabled={saving}
                            className="btn btn-primary"
                            style={{ width: 'fit-content', background: '#3b82f6' }}
                        >
                            {saving ? 'Salvataggio...' : 'Salva Template Saldo'}
                        </button>
                    </div>
                </div>

                {/* Guida ai Tag */}
                <div style={{ alignSelf: 'start' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', position: 'sticky', top: '20px' }}>
                        <h3 style={{ marginTop: 0 }}>Guida ai Tag</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                            Usa questi tag nel testo per inserire automaticamente i dati della prenotazione.
                        </p>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {tags.map(tag => (
                                <li key={tag.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                                    <code style={{
                                        color: 'var(--primary)',
                                        fontWeight: 'bold',
                                        fontSize: '0.9rem',
                                        background: '#f1f5f9',
                                        padding: '0.2rem 0.4rem',
                                        borderRadius: '0.25rem',
                                        width: 'fit-content'
                                    }}>{tag.name}</code>
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{tag.desc}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
