'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function PaymentCancelPage() {
    const { t } = useLanguage();

    return (
        <main style={{ padding: 'var(--space-xl) 0', minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: 'white', padding: '4rem 2rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '500px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
                <h2 style={{ marginBottom: '1rem', color: '#ef4444' }}>Pagamento Annullato</h2>
                <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: '1.6' }}>
                    Il processo di pagamento è stato interrotto. La tua prenotazione rimane in attesa di approvazione/pagamento.
                    Se hai avuto problemi con la carta, puoi riprovare cliccando sul link ricevuto via email.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link href="/prenota" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Vai a Prenota
                    </Link>
                    <Link href="/" className="btn" style={{ display: 'inline-block', textDecoration: 'none', border: '1px solid var(--border)' }}>
                        Home
                    </Link>
                </div>
            </div>
        </main>
    );
}
