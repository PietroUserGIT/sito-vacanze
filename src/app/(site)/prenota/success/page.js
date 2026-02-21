'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function PaymentSuccessPage() {
    const { t } = useLanguage();

    return (
        <main style={{ padding: 'var(--space-xl) 0', minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '4rem 2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Pagamento Completato!</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Grazie! La caparra è stata ricevuta con successo. La tua prenotazione è ora confermata e le date sono state bloccate sul calendario.
                    Riceverai a breve un'email di riepilogo.
                </p>
                <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                    Torna alla Home page
                </Link>
            </div>
        </main>
    );
}
