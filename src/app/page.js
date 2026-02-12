'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

export default function Home() {
  const [properties, setProperties] = useState([]);
  const { t, locale } = useLanguage();

  useEffect(() => {
    async function fetchProperties() {
      const { data, error } = await supabase
        .from('properties')
        .select('*');

      if (error) {
        console.error('Errore nel caricamento appartamenti:', error);
      } else {
        setProperties(data || []);
      }
    }
    fetchProperties();
  }, []);

  // Helper per mostrare il testo tradotto della proprietà (quando avremo le colonne nel DB)
  const getPropertyText = (property, field) => {
    return property[`${field}_${locale}`] || property[field];
  };

  return (
    <main>
      {/* Hero Section */}
      <section style={{
        padding: 'var(--space-xl) 0',
        background: 'linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.7)), url("https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        color: 'white',
        textAlign: 'center'
      }}>
        <div className="container">
          <h1 style={{ color: 'white', fontSize: '4rem', marginBottom: 'var(--space-s)' }}>
            {t('hero.title1')} <br />{t('hero.title2')}
          </h1>
          <p style={{ color: '#e2e8f0', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto var(--space-m)' }}>
            {t('hero.subtitle')}
          </p>
          <a href="#appartamenti" className="btn btn-primary">
            {t('hero.cta')}
          </a>
        </div>
      </section>

      {/* Featured Properties Section */}
      <section id="appartamenti" style={{ padding: 'var(--space-l) 0' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-m)', fontSize: '2.5rem' }}>
            {t('home.title')}
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 'var(--space-m)'
          }}>
            {properties && properties.map((property) => (
              <div key={property.id} style={{ background: 'white', borderRadius: '1rem', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                <div style={{ height: '250px', background: '#e2e8f0' }}>
                  <img src={property.image_url} alt={getPropertyText(property, 'name')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ padding: 'var(--space-s)' }}>
                  <h3>{getPropertyText(property, 'name')}</h3>
                  <p>{getPropertyText(property, 'description')}</p>
                  <div style={{ marginTop: 'var(--space-s)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: '700', color: 'var(--accent)', fontSize: '1.2rem' }}>
                      {t('home.priceFrom').replace('{price}', property.price_per_night)}
                    </span>
                    <a href="/prenota" className="btn btn-primary">{t('home.book')}</a>
                  </div>
                </div>
              </div>
            ))}

            {(!properties || properties.length === 0) && (
              <p style={{ textAlign: 'center', gridColumn: '1 / -1' }}>{t('home.noProperties')}</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
