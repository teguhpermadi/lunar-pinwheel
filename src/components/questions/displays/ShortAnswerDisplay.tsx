import { QuestionOption } from '@/lib/api';

interface ShortAnswerDisplayProps {
    options?: QuestionOption[];
    // Short answer might store correct answer in options or content itself, based on API.
    // Assuming options has one correct entry or similar.
}

export default function ShortAnswerDisplay({ options = [] }: ShortAnswerDisplayProps) {
    // Often short answers just check against a key string.
    // If options are used, they contain valid answers.

    if (!options || options.length === 0) return <div className="text-sm italic text-slate-400">No answer key provided.</div>;

    return (
        <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Accepted Answers</h5>
            <div className="flex flex-wrap gap-2">
                {options.map((opt, idx) => (
                    <div key={opt.id || idx} className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-lg border border-emerald-200 dark:border-emerald-800">
                        {opt.content}
                    </div>
                ))}
            </div>
        </div>
    );
}
