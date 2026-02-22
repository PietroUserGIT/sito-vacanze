# Specifica Tecnica: Progetto Vacanze Mare

Questo documento descrive l'architettura, le scelte tecnologiche e la logica di business implementata per il sito "Vacanze Mare". È redatto per facilitare la manutenzione ed evoluzione del codice.

## 1. Stack Tecnologico
Il progetto è costruito su un'architettura **Full-stack Moderna**:
- **Framework**: [Next.js](https://nextjs.org/) (App Router, v16+) - Gestione rotte, SEO side-rendering e ottimizzazione performance.
- **Backend / Database**: [Supabase](https://supabase.com/) - Postgres managed per persistenza dati e autenticazione.
- **Pagamenti**: [Stripe](https://stripe.com/) - Integrazione completa con Checkout Sessions e Webhooks per la gestione di Caparra e Saldo.
- **Styling**: **Vanilla CSS** con variabili globali per un design leggero e reattivo.

## 2. Architettura del Progetto
- `src/app/`: Rotte dell'applicazione (Home, Prenota, Admin).
- `src/app/api/`: Endpoint API server-side per Stripe (Checkout e Webhook).
- `src/components/`: Componenti React (Navbar, Footer, Calendar).
- `src/context/`: Stato globale (LanguageContext).
- `src/lib/`: Configurazioni (Supabase client) e dizionari i18n.

## 3. Requisiti Ambiente (.env.local)
Il progetto richiede le seguenti variabili d'ambiente:

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
> La **`SUPABASE_SERVICE_ROLE_KEY`** è necessaria per permettere al Webhook di Stripe di aggiornare lo stato delle prenotazioni bypassando le RLS.

## 4. Modello Dati (Supabase)

### `properties` (Appartamenti)
- Liste e dettagli alloggi con supporto multilingua dinamico.

### `bookings` (Prenotazioni)
- **Stati**: `pending`, `approved`, `booked` (caparra pagata), `confirmed` (saldo pagato), `cancelled`.
- **Campi Pagamento**:
  - `caparra_paid_at`: Popolata dal Webhook.
  - `saldo_paid_at`: Popolata dal Webhook.

### `settings` (Impostazioni)
- Memorizza i template delle email (`email_deposit_template`, `email_balance_template`).
- Permette la personalizzazione dei testi tramite Tag dinamici.

## 5. Flusso di Prenotazione e Pagamenti
1. **Selezione**: Supporto parametro `?property=ID` per pre-selezione appartamento.
2. **Richiesta**: Form con tooltip informativo sull'utilizzo dell'email.
3. **Approvazione**: Cambio stato admin in `Approved`.
4. **Link Stripe**: Generazione dinamica link Caparra/Saldo.
5. **Webhook**: Endpoint `/api/stripe/webhook` asincrono (Next.js 16) che aggiorna il DB all'incasso.

## 6. Integrazione Stripe CLI (Sviluppo Locale)
Per testare i webhook localmente:

1. **Installazione**: `wget` del pacchetto `.deb` da GitHub e `sudo apt install`.
2. **Login**: `stripe login`.
3. **Listen**: `stripe listen --forward-to localhost:3000/api/stripe/webhook`.
4. **Secret**: Aggiornare `STRIPE_WEBHOOK_SECRET` con il valore `whsec_...` fornito dal comando `listen`.

## 7. Area Riservata (Admin Dashboard)
- Tabella prenotazioni fluida a tutto schermo.
- Dati di versamento in sola lettura nel riepilogo a sinistra.
- Modali specifiche per la gestione di Caparra e Saldo.

## 8. Sicurezza
- **RLS**: Protezione tabelle bypassata solo dal Webhook tramite Service Role Key.
- **Auth**: Gestito via Supabase Auth.

---

*Documento aggiornato al: 22/02/2026*
