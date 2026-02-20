-- Abilitazione della Row Level Security (RLS) per tutte le tabelle
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- POLICY PER LA TABELLA 'site_settings'
-- --------------------------------------------------------
-- Tutti possono leggere (necessario al middleware per sapere se c'è manutenzione)
CREATE POLICY "Lettura pubblica impostazioni" ON site_settings FOR SELECT USING (true);

-- Solo gli amministratori (utenti loggati in Supabase Auth) possono modificare/inserire
CREATE POLICY "Modifica impostazioni solo admin" ON site_settings FOR ALL USING (auth.role() = 'authenticated');


-- --------------------------------------------------------
-- POLICY PER LA TABELLA 'properties'
-- --------------------------------------------------------
-- Tutti i visitatori del sito devono poter vedere gli appartamenti
CREATE POLICY "Lettura pubblica appartamenti" ON properties FOR SELECT USING (true);

-- Solo gli amministratori possono aggiungere, modificare o cancellare appartamenti
CREATE POLICY "Modifica appartamenti solo admin" ON properties FOR ALL USING (auth.role() = 'authenticated');


-- --------------------------------------------------------
-- POLICY PER LA TABELLA 'bookings'
-- --------------------------------------------------------
-- Tutti devono poter leggere le prenotazioni esistenti affinché il calendario blocchi le date occupate
CREATE POLICY "Lettura pubblica prenotazioni" ON bookings FOR SELECT USING (true);

-- Chiunque compili il modulo pubblico deve poter inserire una nuova prenotazione
CREATE POLICY "Inserimento pubblico prenotazioni" ON bookings FOR INSERT WITH CHECK (true);

-- Solo gli amministratori possono approvare, modificare o cancellare le prenotazioni ricevute
CREATE POLICY "Aggiornamento prenotazioni solo admin" ON bookings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Cancellazione prenotazioni solo admin" ON bookings FOR DELETE USING (auth.role() = 'authenticated');
