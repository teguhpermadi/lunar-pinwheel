import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
declare global {
    interface Window {
        Pusher: any;
        Echo: any;
    }
}

(window as any).Pusher = Pusher;

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;

export const echo = reverbKey ? new Echo({
    broadcaster: 'reverb',
    key: reverbKey,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT || 6001,
    wssPort: import.meta.env.VITE_REVERB_PORT || 6001,
    forceTLS: false,
    enabledTransports: ['ws'],
}) : null;
