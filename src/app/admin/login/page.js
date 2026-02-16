'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/admin');
        }
    };

    return (
        <main style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-main)',
            padding: 'var(--space-m)'
        }}>
            <div style={{
                maxWidth: '400px',
                width: '100%',
                background: 'white',
                padding: 'var(--space-l)',
                borderRadius: '1rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-l)' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Area Admin</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Accedi per gestire il tuo sito</p>
                </div>

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 'var(--space-m)' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)'
                            }}
                            placeholder="tua@email.it"
                        />
                    </div>

                    <div style={{ marginBottom: 'var(--space-l)' }}>
                        <label style={{ display: 'block', fontWeight: '600', marginBottom: '0.5rem' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border)'
                            }}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            borderRadius: '0.5rem',
                            marginBottom: 'var(--space-m)',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '0.75rem', fontSize: '1.1rem', opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? 'Accesso in corso...' : 'Accedi'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 'var(--space-l)', fontSize: '0.875rem' }}>
                    <a href="/" style={{ color: 'var(--primary)' }}>← Torna al sito</a>
                </p>
            </div>
        </main>
    );
}
