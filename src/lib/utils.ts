import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, addDays } from "date-fns"

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

const WIB_OFFSET_MINUTES = 7 * 60;

export function toWIBDateTimeLocalString(date: Date = new Date()): string {
    const utc = date.getTime() + date.getTimezoneOffset() * 60000;
    const wib = new Date(utc + WIB_OFFSET_MINUTES * 60000);
    return format(wib, "yyyy-MM-dd'T'HH:mm");
}

export function parseWIBToDate(dateTimeLocal: string): Date {
    if (!dateTimeLocal) return new Date();
    const [datePart, timePart] = dateTimeLocal.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    const localDate = new Date(year, month - 1, day, hours, minutes);
    const utc = localDate.getTime() + localDate.getTimezoneOffset() * 60000 - WIB_OFFSET_MINUTES * 60000;
    return new Date(utc);
}

export function addWIBDays(dateTimeLocal: string, days: number): string {
    const date = parseWIBToDate(dateTimeLocal);
    const wibDateTime = date.getTime() + (date.getTimezoneOffset() - WIB_OFFSET_MINUTES) * 60000;
    const result = addDays(new Date(wibDateTime), days);
    return toWIBDateTimeLocalString(result);
}

export function convertToLocalWIB(isoString: string | null | undefined): string {
    if (!isoString) return '';
    return toWIBDateTimeLocalString(new Date(isoString));
}

export function convertFromLocalWIB(dateTimeLocal: string | null | undefined): string | null {
    if (!dateTimeLocal) return null;
    return parseWIBToDate(dateTimeLocal).toISOString();
}
