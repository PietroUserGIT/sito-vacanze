import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

// IMPORTANTISSIMO: I Webhook arrivano come chiamate server-to-server anonime (no utente loggato).
// Per aggiornare Row Level Security su "bookings" serve un client di amministrazione.
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
) : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req) {
    const body = await req.text();
    const sig = headers().get('stripe-signature');

    let event;

    try {
        // Verifica la firma del webhook per sicurezza
        event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
        console.error(`❌ Errore firma Webhook: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    // Gestiamo l'evento di pagamento completato
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;

        // Recuperiamo il bookingId dai metadati che abbiamo inviato in fase di creazione sessione
        const bookingId = session.metadata.bookingId;
        const paymentType = session.metadata.paymentType; // 'deposit'

        console.log(`🔔 Pagamento ricevuto per booking: ${bookingId}`);

        // IMPORTANTISSIMO: I Webhook arrivano come chiamate server-to-server anonime (no utente loggato).
        // Per aggiornare Row Level Security su "bookings" serve un client di amministrazione.

        if (!supabaseAdmin) {
            console.error('Manca SUPABASE_SERVICE_ROLE_KEY. Update ignorato.');
            return NextResponse.json({ error: 'Manca Service Role Key' }, { status: 500 });
        }

        if (paymentType === 'deposit') {
            const { error } = await supabaseAdmin
                .from('bookings')
                .update({ caparra_paid_at: new Date().toISOString() })
                .eq('id', bookingId);

            if (error) {
                console.error('❌ Errore update caparra_paid_at su Supabase:', error);
                return NextResponse.json({ error: 'Database update deposit failed' }, { status: 500 });
            }
            console.log(`✅ Caparra registrata per la prenotazione ${bookingId}`);
        } else if (paymentType === 'balance') {
            const { error } = await supabaseAdmin
                .from('bookings')
                .update({ saldo_paid_at: new Date().toISOString() })
                .eq('id', bookingId);

            if (error) {
                console.error('❌ Errore update saldo_paid_at su Supabase:', error);
                return NextResponse.json({ error: 'Database update balance failed' }, { status: 500 });
            }
            console.log(`✅ Saldo registrato per la prenotazione ${bookingId}`);
        }
    }

    return NextResponse.json({ received: true });
}
