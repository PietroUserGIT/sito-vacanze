# MASTER CONTEXT: Progetto Vacanze Mare
> **Documento di Handover per AI Assistant**

Questo file serve ad "istruire" istantaneamente un nuovo assistente AI sullo stato attuale, l'architettura e le logiche critiche del progetto "Vacanze Mare".

## 1. Identità del Progetto
Sito full-stack per la gestione di appartamenti vacanze.
- **Frontend**: Next.js 16 (App Router) + Vanilla CSS.
- **Backend/DB**: Supabase (PostgreSQL).
- **Pagamenti**: Stripe (Checkout Sessions + Webhooks).
- **Internazionalizzazione**: Custom context (`LanguageContext.js`) con file JSON in `src/lib/i18n`.

---

## 2. Architettura e Logiche Chiave

### Stato della Prenotazione (`bookings`)
Le prenotazioni seguono questo ciclo di stati:
`pending` -> `approved` -> `booked` (caparra pagata) -> `confirmed` (saldo pagato) -> `cancelled`.

### Integrazione Stripe
- **Endpoint**: `/api/stripe/checkout` (creazione sessione) e `/api/stripe/webhook` (ascolto notifiche).
- **Novità Next.js 16**: Le API usano `await headers()` perché ora è asincrono.
- **Sicurezza**: Il Webhook usa la `SUPABASE_SERVICE_ROLE_KEY` per aggiornare il DB via server-to-server, bypassando le Row Level Security (RLS) che bloccano gli utenti anonimi.

### Dashboard Admin (`/admin/bookings`)
- Tabella fluida a tutto schermo (rimossi i `min-width` che creavano tagli grafici).
- **Stazione di Redazione Email**: Nuova pagina `/admin/settings` per modificare i template email senza toccare il codice, con supporto per tag dinamici come `{{guest_name}}`.
- Gestione pagamenti tramite modali ("Gestione Caparra" e "Gestione Saldo") che recuperano i template dal DB prima dell'invio.

---

## 3. Configurazione Locale Critica
Per lavorare sul progetto, assicurarsi che il file `.env.local` contenga:
- URL e Anon Key di Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` (fondamentale per i Webhook).
- Secret Key di Stripe e `STRIPE_WEBHOOK_SECRET`.

**Comando Listener per Webhook (Sviluppo Locale):**
`stripe listen --forward-to localhost:3000/api/stripe/webhook`

---

## 4. Ultimi Fix Rilevanti (Aggiornamento Febbraio 2026)
Se riscontri problemi in queste aree, consulta queste specifiche:
- **Status Reset**: Sistemato bug in `admin/bookings/[id]/page.js` dove lo stato tornava a "Pending" al caricamento (mancava `setStatus` nel `fetch`).
- **Webhook 500 Error**: Risolto aggiungendo `await headers()` e passando al client `supabaseAdmin`.
- **UI Admin**: Pulizia dei campi date obsoleti (`due_date` nel DB non più usati) a favore delle "Date Effettive" popolate automaticamente.

---

## 5. Istruzioni per il prossimo AI Assistant
1. Leggi questo file e `technical_spec.md`.
2. Verifica la connettività Supabase nel file `src/lib/supabase.js`.
3. Se devi modificare il database, controlla gli script `.sql` presenti nella root per capire la struttura delle tabelle.
4. L'area Admin è protetta da Middleware; controlla `src/middleware.js` per la logica di accesso.

**Stato Progetto al 22/02/2026**: Stabile, Webhook testati e funzionanti, UI Admin ottimizzata.
