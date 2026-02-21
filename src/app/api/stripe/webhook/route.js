import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
});

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

        if (paymentType === 'deposit') {
            // Aggiorniamo lo stato su Supabase a 'booked'
            // NB: Come stabilito, 'booked' blocca le date sul calendario pubblico
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'booked' })
                .eq('id', bookingId);

            if (error) {
                console.error('❌ Errore aggiornamento Supabase via Webhook:', error);
                return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
            }

            console.log(`✅ Prenotazione ${bookingId} spostata in stato BOOKED.`);
        }
    }

    return NextResponse.json({ received: true });
}
