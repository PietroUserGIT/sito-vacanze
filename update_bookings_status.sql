-- Aggiornamento stati prenotazione per supportare i nuovi requisiti
-- Stati: Approvata (visionata), Prenotata (in corso), Confermata (pagata), Cancellata

-- Nota: il campo 'status' esiste già, aggiorniamo solo i commenti e logicamente i vincoli se presenti
-- Se vogliamo essere precisi possiamo aggiungere un check constraint (opzionale ma consigliato)

ALTER TABLE bookings 
DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('pending', 'approved', 'booked', 'confirmed', 'cancelled'));

-- Mappa termini italiani -> inglesi per coerenza database
-- Approvata -> approved
-- Prenotata -> booked
-- Confermata -> confirmed
-- Cancellata -> cancelled
-- (pending rimane per le nuove richieste via form)
