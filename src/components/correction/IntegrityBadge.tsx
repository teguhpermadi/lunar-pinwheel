import { AlertTriangle, CheckCircle2, HelpCircle, ShieldAlert } from 'lucide-react';

interface IntegrityBadgeProps {
    metadata?: Record<string, unknown> | null;
    integrity?: IntegritySummary | null;
    compact?: boolean;
}

interface IntegritySummary {
    status?: string;
    anomaly_score?: number | null;
    is_flagged?: boolean;
    reason_code?: string | null;
}

function getSummary(metadata: Record<string, unknown> | null | undefined): IntegritySummary | null {
    if (!metadata || typeof metadata !== 'object') return null;
    const direct = metadata.integrity;
    const antiCheating = metadata.anti_cheating;
    const summary = direct ?? antiCheating;
    return summary && typeof summary === 'object' ? summary as IntegritySummary : null;
}

export default function IntegrityBadge({ metadata, integrity, compact = false }: IntegrityBadgeProps) {
    const summary = integrity ?? getSummary(metadata);
    if (!summary) return null;

    const status = summary.status ?? 'unknown';
    const isFlagged = summary.is_flagged === true;
    const score = typeof summary.anomaly_score === 'number' ? summary.anomaly_score : null;
    const analyzed = status === 'analyzed';

    const tone = isFlagged
        ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300'
        : analyzed
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
            : status === 'invalid_metrics'
                ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300';
    const Icon = isFlagged ? ShieldAlert : analyzed ? CheckCircle2 : status === 'invalid_metrics' ? AlertTriangle : HelpCircle;
    const label = isFlagged
        ? 'Perlu ditinjau'
        : analyzed
            ? 'Pola normal'
            : status === 'bypassed_short_text'
                ? 'Teks terlalu pendek'
                : status === 'insufficient_baseline'
                    ? 'Baseline belum cukup'
                    : status === 'missing_metrics'
                        ? 'Metrics tidak tersedia'
                        : status === 'invalid_metrics'
                            ? 'Metrics tidak valid'
                            : 'Analisis tidak tersedia';

    return (
        <div className={`flex items-center gap-2 rounded-lg border ${compact ? 'px-2 py-1' : 'px-3 py-2'} ${tone}`}>
            <Icon className={compact ? 'h-3.5 w-3.5 shrink-0' : 'h-4 w-4 shrink-0'} />
            <span className={compact ? 'text-[9px] font-black uppercase tracking-wide' : 'text-xs font-bold'}>
                {label}
            </span>
            {score !== null && (
                <span className="ml-auto text-[10px] font-black tabular-nums">
                    {score.toFixed(1)}
                </span>
            )}
            {!compact && summary.reason_code && (
                <span className="text-[10px] opacity-70">
                    ({summary.reason_code.replace(/_/g, ' ')})
                </span>
            )}
        </div>
    );
}
