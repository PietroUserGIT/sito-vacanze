# Vacanze Mare - Sistema di Gestione Prenotazioni

Sito web per la gestione di appartamenti vacanze, comprensivo di sistema di prenotazione lato utente e pannello di controllo amministrativo con integrazione pagamenti Stripe.

## 🛠️ Requisiti Ambiente (.env.local)

Il progetto richiede le seguenti variabili d'ambiente configurate nel file `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tuo-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tua-chiave-anon-public
SUPABASE_SERVICE_ROLE_KEY=tua-chiave-service-role-secret

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> [!IMPORTANT]
> La **`SUPABASE_SERVICE_ROLE_KEY`** è necessaria per permettere al Webhook di Stripe (che opera in modo anonimo) di aggiornare lo stato delle prenotazioni bypassando le Row Level Security (RLS). È reperibile in Supabase sotto *Settings > API*.

---

## 💳 Integrazione Stripe CLI (Sviluppo Locale)

Per testare i pagamenti e la ricezione automatica delle date di versamento sul tuo computer locale, è necessario utilizzare la **Stripe CLI**.

### 1. Installazione (Linux)
Se il comando `stripe` non è presente, installalo tramite pacchetto `.deb`:

```bash
# Scarica l'ultima versione (es. 1.35.1)
wget https://github.com/stripe/stripe-cli/releases/download/v1.35.1/stripe_1.35.1_linux_amd64.deb

# Installa il pacchetto
sudo apt install ./stripe_1.35.1_linux_amd64.deb
```

### 2. Autenticazione
Collega il terminale al tuo account Stripe:
```bash
stripe login
```
Segui il link visualizzato a video e conferma il Pairing Code sul browser.

### 3. Inoltro dei Webhook (Listener)
Apri un **secondo terminale** (mentre il sito è attivo nel primo) e avvia il listener:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

> [!TIP]
> Al lancio di questo comando, vedrai un messaggio: `Your webhook signing secret is whsec_...`. 
> Copia quel codice nel campo `STRIPE_WEBHOOK_SECRET` del tuo `.env.local` e riavvia il server del sito.

---

## 🚀 Avvio Progetto

1. Installazione dipendenze: `npm install`
2. Avvio sviluppo: `npm run dev`
3. Build produzione: `npm run build && npm run start`

---

## 📋 Funzionalità Principali

### Lato Utente
- Selezione appartamento automatica tramite parametro URL (`/prenota?property=ID`).
- Form di prenotazione con informativa email via tooltip.
- Pagina di successo diversificata per il tipo di versamento.

### Pannello Admin (`/admin/bookings`)
- Lista prenotazioni fluida a tutto schermo.
- Dettaglio prenotazione con campi in sola lettura per le **Date Effettive di Versamento** (popolate automaticamente da Stripe).
- Modali di **Gestione Caparra/Saldo** per la generazione dinamica dei link di pagamento Stripe e l'invio via email precompilata.
