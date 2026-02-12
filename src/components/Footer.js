'use client';
import { useLanguage } from '@/context/LanguageContext';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer style={{
            backgroundColor: 'var(--primary)',
            color: 'white',
            padding: 'var(--space-l) 0',
            marginTop: 'var(--space-l)'
        }}>
            <div className="container" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: 'var(--space-m)'
            }}>
                {/* Info Col */}
                <div>
                    <h3 style={{ color: 'white', marginBottom: 'var(--space-s)' }}>Vacanze Mare</h3>
                    <p style={{ color: '#94a3b8' }}>
                        {t('footer.tagline')}
                    </p>
                </div>

                {/* Links Col */}
                <div>
                    <h4 style={{ color: 'white', marginBottom: 'var(--space-s)' }}>{t('footer.quickLinks')}</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li style={{ marginBottom: '8px' }}><a href="#" style={{ color: '#94a3b8' }}>Privacy Policy</a></li>
                        <li style={{ marginBottom: '8px' }}><a href="#" style={{ color: '#94a3b8' }}>Termini e Condizioni</a></li>
                        <li style={{ marginBottom: '8px' }}><a href="#" style={{ color: '#94a3b8' }}>FAQ</a></li>
                    </ul>
                </div>

                {/* Contact Col */}
                <div id="contatti">
                    <h4 style={{ color: 'white', marginBottom: 'var(--space-s)' }}>{t('footer.contactUs')}</h4>
                    <p style={{ color: '#94a3b8' }}>
                        Email: info@vacanzemare.it<br />
                        Tel: +39 012 345 6789<br />
                        Indirizzo: Via Roma 123, 00100 Italia
                    </p>
                </div>
            </div>

            <div className="container" style={{
                marginTop: 'var(--space-l)',
                paddingTop: 'var(--space-s)',
                borderTop: '1px solid #334155',
                textAlign: 'center',
                fontSize: '0.875rem',
                color: '#64748b'
            }}>
                © {new Date().getFullYear()} Vacanze Mare. {t('footer.rights')}
            </div>
        </footer>
    );
}
