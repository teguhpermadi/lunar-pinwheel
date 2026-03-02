import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

(window as any).Pusher = Pusher;

export const echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    // forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'http') === 'https',
    // enabledTransports: ['ws', 'wss'],
    forceTLS: false, // Pastikan ini FALSE jika tidak pakai HTTPS
    enabledTransports: ['ws'], // Pakai 'ws' saja jika belum SSL
});
