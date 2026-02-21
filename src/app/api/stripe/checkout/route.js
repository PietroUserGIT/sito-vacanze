import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

// Inizializza Stripe con la Secret Key del server
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16', // Usa una versione fissa per stabilità
});

export async function POST(request) {
    try {
        const body = await request.json();
        const { bookingId, amount, customerEmail, propertyName } = body;

        if (!bookingId || !amount) {
            return NextResponse.json({ error: 'Dati mancanti per il pagamento' }, { status: 400 });
        }

        // Recuperiamo il dominio base del sito per i redirect di successo o annullamento
        // In locale sarà localhost:3000, in produzione il dominio di Vercel
        const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

        // Creiamo la sessione di Checkout su Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: customerEmail, // Pre-compila l'email del cliente
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: `Caparra Prenotazione: ${propertyName || 'Appartamento VacanzeMare'}`,
                            description: `Pagamento caparra per la prenotazione #${bookingId.split('-')[0]}`,
                        },
                        // Stripe usa i centesimi. Esempio: 150 EUR = 15000
                        unit_amount: Math.round(amount * 100), 
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment', // Tipo di pagamento: singolo ('payment'), non abbonamento
            // Passiamo il booking_id nei metadati per recuperarlo dal Webhook una volta pagato
            metadata: {
                bookingId: bookingId,
                paymentType: 'deposit', // "caparra"
            },
            // Dove rimandare l'utente finito il pagamento
            success_url: `${origin}/prenota/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/prenota/cancel`,
        });

        // Rispondiamo al nostro frontend con l'URL segreto generato da Stripe
        return NextResponse.json({ url: session.url });
        
    } catch (error) {
        console.error('Errore creazione Stripe Checkout:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
