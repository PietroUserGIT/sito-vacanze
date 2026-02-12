'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const { locale, t, changeLanguage } = useLanguage();
    const pathname = usePathname();

    const isHomePage = pathname === '/';

    return (
        <nav
            key={locale} // Forza il re-mount al cambio lingua per resettare stati interni
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                borderBottom: '1px solid var(--border)',
                height: '80px',
                display: 'flex',
                alignItems: 'center'
            }}
        >
            <div className="container" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%'
            }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    <Link href="/" style={{ fontFamily: 'var(--font-playfair)' }}>
                        <span style={{ color: 'var(--primary)' }}>VACANZE</span>
                        <span style={{ color: 'var(--accent)' }}>MARE</span>
                    </Link>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-m)', fontWeight: '500', alignItems: 'center' }}>
                    <Link href="/">{t('navbar.home')}</Link>

                    {/* Se siamo in home usiamo l'ancora, altrimenti torniamo in home sulla sezione */}
                    <Link href={isHomePage ? "#appartamenti" : "/#appartamenti"}>
                        {t('navbar.apartments')}
                    </Link>

                    <Link href={isHomePage ? "#contatti" : "/#contatti"}>
                        {t('navbar.contact')}
                    </Link>

                    <select
                        value={locale}
                        onChange={(e) => changeLanguage(e.target.value)}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--border)',
                            background: 'white',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            fontSize: '0.9rem',
                            marginLeft: 'var(--space-s)'
                        }}
                    >
                        <option value="it">🇮🇹 IT</option>
                        <option value="en">🇬🇧 EN</option>
                        <option value="fr">🇫🇷 FR</option>
                        <option value="de">🇩🇪 DE</option>
                    </select>

                    <Link href="/prenota" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                        {t('navbar.bookNow')}
                    </Link>
                </div>
            </div>
        </nav>
    );
}
