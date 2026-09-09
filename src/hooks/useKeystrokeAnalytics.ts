import { useCallback, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { TypingMetrics } from '@/lib/api';

export interface UseKeystrokeAnalyticsOptions {
    enabled: boolean;
    minCharThreshold: number;
    resetToken?: number;
}

export interface UseKeystrokeAnalyticsResult {
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
    onKeyUp: (event: KeyboardEvent<HTMLElement>) => void;
    getMetrics: (answer: string) => TypingMetrics | undefined;
    reset: () => void;
}

const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab']);
const MAX_INTERVAL_MS = 60_000;
const LONG_PAUSE_MS = 2_000;
const MAX_PAUSE_POSITIONS = 50;
const MAX_KEYSTROKES = 100_000;

const finiteNonNegative = (value: number) => Number.isFinite(value) && value >= 0;

export function isValidTypingMetrics(metrics: TypingMetrics, answerLength: number): boolean {
    const numericValues = [
        metrics.total_keystrokes,
        metrics.avg_dwell_time_ms,
        metrics.avg_flight_time_ms,
        metrics.backspace_count,
        metrics.delete_count,
        metrics.correction_ratio,
        metrics.long_pauses_count,
        metrics.capture_duration_ms,
    ];

    return metrics.schema_version === 1
        && metrics.is_analyzed === true
        && numericValues.every(finiteNonNegative)
        && metrics.correction_ratio <= 1
        && Number.isInteger(metrics.total_keystrokes)
        && Number.isInteger(metrics.backspace_count)
        && Number.isInteger(metrics.delete_count)
        && Number.isInteger(metrics.long_pauses_count)
        && Array.isArray(metrics.pause_positions)
        && metrics.pause_positions.length <= MAX_PAUSE_POSITIONS
        && metrics.pause_positions.every((position) =>
            Number.isInteger(position) && position >= 0 && position <= answerLength
        )
        && (metrics.wpm_estimated === null || finiteNonNegative(metrics.wpm_estimated))
        && metrics.capture_duration_ms <= MAX_INTERVAL_MS * 24;
}

function getTextLength(event: KeyboardEvent<HTMLElement>): number {
    const target = event.target;
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        return target.value.length;
    }
    return target instanceof HTMLElement ? target.textContent?.length ?? 0 : 0;
}

function isTypingTarget(event: KeyboardEvent<HTMLElement>): boolean {
    const target = event.target;
    return target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || (target instanceof HTMLElement && target.isContentEditable);
}

export function useKeystrokeAnalytics({
    enabled,
    minCharThreshold,
    resetToken = 0,
}: UseKeystrokeAnalyticsOptions): UseKeystrokeAnalyticsResult {
    const captureStartedAtRef = useRef<string | null>(null);
    const captureStartPerfRef = useRef<number | null>(null);
    const lastKeyDownPerfRef = useRef<number | null>(null);
    const lastKeyUpPerfRef = useRef<number | null>(null);
    const pendingKeydownsRef = useRef<number[]>([]);
    const totalKeystrokesRef = useRef(0);
    const totalDwellRef = useRef(0);
    const totalFlightRef = useRef(0);
    const dwellSamplesRef = useRef(0);
    const flightSamplesRef = useRef(0);
    const backspaceCountRef = useRef(0);
    const deleteCountRef = useRef(0);
    const longPausesRef = useRef(0);
    const pausePositionsRef = useRef<number[]>([]);

    const reset = useCallback(() => {
        captureStartedAtRef.current = null;
        captureStartPerfRef.current = null;
        lastKeyDownPerfRef.current = null;
        lastKeyUpPerfRef.current = null;
        pendingKeydownsRef.current = [];
        totalKeystrokesRef.current = 0;
        totalDwellRef.current = 0;
        totalFlightRef.current = 0;
        dwellSamplesRef.current = 0;
        flightSamplesRef.current = 0;
        backspaceCountRef.current = 0;
        deleteCountRef.current = 0;
        longPausesRef.current = 0;
        pausePositionsRef.current = [];
    }, []);

    useEffect(() => {
        if (!enabled) {
            reset();
        }
    }, [enabled, reset]);

    useEffect(() => {
        if (resetToken > 0) {
            reset();
        }
    }, [reset, resetToken]);

    const onKeyDown = useCallback((event: KeyboardEvent<HTMLElement>) => {
        if (!enabled || !isTypingTarget(event) || event.repeat || MODIFIER_KEYS.has(event.key)) return;

        const now = performance.now();
        if (captureStartPerfRef.current === null) {
            captureStartPerfRef.current = now;
            captureStartedAtRef.current = new Date().toISOString();
        }

        const previousKeyUp = lastKeyUpPerfRef.current;
        if (previousKeyUp !== null) {
            const flight = Math.min(Math.max(now - previousKeyUp, 0), MAX_INTERVAL_MS);
            totalFlightRef.current += flight;
            flightSamplesRef.current += 1;
            if (flight >= LONG_PAUSE_MS && pausePositionsRef.current.length < MAX_PAUSE_POSITIONS) {
                longPausesRef.current += 1;
                pausePositionsRef.current.push(getTextLength(event));
            }
        }

        totalKeystrokesRef.current = Math.min(totalKeystrokesRef.current + 1, MAX_KEYSTROKES);
        if (event.key === 'Backspace') backspaceCountRef.current += 1;
        if (event.key === 'Delete') deleteCountRef.current += 1;

        pendingKeydownsRef.current.push(now);
        lastKeyDownPerfRef.current = now;
    }, [enabled]);

    const onKeyUp = useCallback((event: KeyboardEvent<HTMLElement>) => {
        if (!enabled || !isTypingTarget(event) || MODIFIER_KEYS.has(event.key)) return;

        const now = performance.now();
        const keyDown = pendingKeydownsRef.current.shift();
        if (keyDown !== undefined) {
            totalDwellRef.current += Math.min(Math.max(now - keyDown, 0), MAX_INTERVAL_MS);
            dwellSamplesRef.current += 1;
        }
        lastKeyUpPerfRef.current = now;
    }, [enabled]);

    const getMetrics = useCallback((answer: string): TypingMetrics | undefined => {
        if (!enabled || answer.length < Math.max(0, minCharThreshold) || totalKeystrokesRef.current === 0) {
            return undefined;
        }

        const startPerf = captureStartPerfRef.current;
        const captureDuration = startPerf === null
            ? 0
            : Math.min(Math.max(performance.now() - startPerf, 0), MAX_INTERVAL_MS * 24);
        const durationMinutes = captureDuration / 60_000;
        const wpm = durationMinutes > 0 ? answer.length / 5 / durationMinutes : null;
        const metrics: TypingMetrics = {
            schema_version: 1,
            is_analyzed: true,
            total_keystrokes: totalKeystrokesRef.current,
            avg_dwell_time_ms: dwellSamplesRef.current ? totalDwellRef.current / dwellSamplesRef.current : 0,
            avg_flight_time_ms: flightSamplesRef.current ? totalFlightRef.current / flightSamplesRef.current : 0,
            backspace_count: backspaceCountRef.current,
            delete_count: deleteCountRef.current,
            correction_ratio: (backspaceCountRef.current + deleteCountRef.current) / Math.max(totalKeystrokesRef.current, 1),
            long_pauses_count: longPausesRef.current,
            pause_positions: [...pausePositionsRef.current],
            wpm_estimated: wpm !== null && Number.isFinite(wpm) ? wpm : null,
            capture_started_at: captureStartedAtRef.current ?? new Date().toISOString(),
            capture_duration_ms: captureDuration,
        };

        if (!isValidTypingMetrics(metrics, answer.length)) {
            console.error('Keystroke metrics validation failed; saving answer without analytics.');
            return undefined;
        }

        return metrics;
    }, [enabled, minCharThreshold]);

    return { onKeyDown, onKeyUp, getMetrics, reset };
}
