
interface EssayDisplayProps {
    keywords?: string;
}

export default function EssayDisplay({ keywords }: EssayDisplayProps) {
    if (!keywords && !keywords?.length) return <div className="text-sm italic text-slate-400">No specific keywords or rubric set.</div>;

    return (
        <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Grading Keywords / Rubric</h5>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 text-sm text-slate-700 dark:text-slate-300">
                {keywords}
            </div>
        </div>
    );
}
