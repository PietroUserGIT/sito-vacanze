-- Esegui questo script nel SQL Editor della dashboard di Supabase
-- per aggiungere la colonna guest_note alla tabella bookings.

ALTER TABLE bookings ADD COLUMN guest_note TEXT;
