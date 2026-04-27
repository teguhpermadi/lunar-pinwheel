import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, addDays, parseISO } from "date-fns"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback implementation for non-secure contexts
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Formats a date to a string suitable for <input type="datetime-local">
 * Returns yyyy-MM-dd'T'HH:mm in the local timezone.
 */
export function formatDateToLocalInput(date: Date | string | number | null | undefined = new Date()): string {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    if (isNaN(d.getTime())) return '';
    return format(d, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Adds days to a datetime-local string value and returns a new datetime-local string.
 */
export function addDaysToDate(dateTimeLocal: string, days: number): string {
    if (!dateTimeLocal) return formatDateToLocalInput(addDays(new Date(), days));
    const date = new Date(dateTimeLocal);
    if (isNaN(date.getTime())) return '';
    const result = addDays(date, days);
    return format(result, "yyyy-MM-dd'T'HH:mm");
}
