import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request) {
    const { pathname } = request.nextUrl;

    // Percorsi esclusi dalla manutenzione
    if (
        pathname.startsWith('/admin') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/maintenance') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.') // File statici (immagini, favicon, ecc.)
    ) {
        return NextResponse.next();
    }

    // Se non abbiamo le chiavi, proseguiamo (evita blocchi se non configurato)
    if (!supabaseUrl || !supabaseAnonKey) {
        return NextResponse.next();
    }

    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: setting } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'maintenance_mode')
            .single();

        // Se la manutenzione è attiva, reindirizza
        if (setting && setting.value === true) {
            const url = request.nextUrl.clone();
            url.pathname = '/maintenance';
            return NextResponse.rewrite(url);
        }
    } catch (error) {
        console.error('Middleware Maintenance Error:', error);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
