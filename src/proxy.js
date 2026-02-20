import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request) {
    const { pathname } = request.nextUrl;

    // 1. Percorsi sempre liberi (API, file statici, pagina di manutenzione stessa)
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/maintenance') ||
        pathname.startsWith('/_next') ||
        pathname.includes('.') // File statici (immagini, favicon, ecc.)
    ) {
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Se mancano chiavi, non blocchiamo il sito
    if (!supabaseUrl || !supabaseAnonKey) {
        return response;
    }

    try {
        // Creazione client SSR per middleware (gestisce i cookie)
        const supabase = createServerClient(
            supabaseUrl,
            supabaseAnonKey,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value }) =>
                            request.cookies.set(name, value)
                        );
                        response = NextResponse.next({
                            request,
                        });
                        cookiesToSet.forEach(({ name, value, options }) =>
                            response.cookies.set(name, value, options)
                        );
                    },
                },
            }
        );

        // 2. Controllo Sessione Utente (Admin)
        const { data: { session } } = await supabase.auth.getSession();
        const isAdmin = !!session;

        // 3. Gestione Protezione /admin
        if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
            if (!isAdmin) {
                const redirectUrl = request.nextUrl.clone();
                redirectUrl.pathname = '/admin/login';
                return NextResponse.redirect(redirectUrl);
            }
        }

        // 4. Se è Admin, non applicare la manutenzione, pass-through totale
        if (isAdmin) {
            return response;
        }

        // Eccezione fondamentale: anche se non sei Admin, devi poter VEDERE la pagina di login
        if (pathname === '/admin/login') {
            return response;
        }

        // 5. Controllo Modalità Manutenzione per utenti normali
        const { data: setting, error } = await supabase
            .from('site_settings')
            .select('value')
            .eq('key', 'maintenance_mode')
            .single();

        if (!error && setting && setting.value === true) {
            // Se manutenzione attiva e path non è /maintenance
            if (pathname !== '/maintenance') {
                const url = request.nextUrl.clone();
                url.pathname = '/maintenance';
                return NextResponse.rewrite(url);
            }
        }

    } catch (error) {
        console.error('Middleware Processing Error:', error);
    }

    return response;
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
