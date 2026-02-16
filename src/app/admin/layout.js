'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }) {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        // Controllo sessione iniziale
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (!session && pathname !== '/admin/login') {
                router.push('/admin/login');
            }
            setLoading(false);
        });

        // Ascolta cambiamenti di autenticazione
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (!session && pathname !== '/admin/login') {
                router.push('/admin/login');
            }
        });

        return () => subscription.unsubscribe();
    }, [pathname, router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    if (loading) {
        return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>Caricamento...</div>;
    }

    // Se non c'è sessione e non siamo al login, non mostriamo nulla (il router reindirizzerà)
    if (!session && pathname !== '/admin/login') {
        return null;
    }

    // Se siamo alla pagina di login, non mostriamo il layout admin
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
            {/* Sidebar */}
            <aside style={{
                width: '260px',
                background: 'var(--primary)',
                color: 'white',
                padding: 'var(--space-l)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'white' }}>Admin Panel</h2>
                    <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Vacanze Mare</p>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-s)', flex: 1 }}>
                    <Link href="/admin" style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        background: pathname === '/admin' ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: 'white',
                        textDecoration: 'none'
                    }}>
                        📊 Dashboard
                    </Link>
                    <Link href="/admin/bookings" style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        background: pathname === '/admin/bookings' ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: 'white',
                        textDecoration: 'none'
                    }}>
                        📅 Prenotazioni
                    </Link>
                    <Link href="/admin/calendar" style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        background: pathname === '/admin/calendar' ? 'rgba(255,255,255,0.1)' : 'transparent',
                        color: 'white',
                        textDecoration: 'none'
                    }}>
                        🗓️ Calendario
                    </Link>
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--space-m)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'none',
                            border: '1px solid rgba(255,255,255,0.3)',
                            color: 'white',
                            borderRadius: '0.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        Esci
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ flex: 1, padding: 'var(--space-xl)', overflowY: 'auto' }}>
                {children}
            </main>
        </div>
    );
}
