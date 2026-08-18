import { MathPreviewQuestion } from '@/lib/api';
import MathRenderer from '@/components/ui/MathRenderer';
import MathDifficultyBadge from './MathDifficultyBadge';

interface MathQuestionCardProps {
    question: MathPreviewQuestion;
    index: number;
    isSelected?: boolean;
    onToggleSelect?: () => void;
}

export default function MathQuestionCard({ question, index, isSelected = false, onToggleSelect }: MathQuestionCardProps) {
    const correctOption = question.options.find(opt => opt.is_correct);

    return (
        <div
            className={`bg-white dark:bg-slate-900 rounded-2xl shadow-sm border-2 transition-all ${
                isSelected
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
        >
            <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {onToggleSelect && (
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={onToggleSelect}
                                className="w-4 h-4 text-primary bg-slate-100 border-slate-300 rounded focus:ring-primary"
                            />
                        )}
                        <span className="text-sm font-bold text-slate-400">Soal #{index + 1}</span>
                        <MathDifficultyBadge difficulty={question.difficulty} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        {question.score && <span>{question.score} poin</span>}
                        {question.timer && <span>{question.timer >= 60 ? `${Math.floor(question.timer / 60)} menit` : `${question.timer} detik`}</span>}
                    </div>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none mb-4">
                    <MathRenderer content={question.content} />
                </div>

                {question.hint && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            <span className="font-bold">Hint:</span> {question.hint}
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Opsi Jawaban</p>
                    {question.options.map((option) => (
                        <div
                            key={option.option_key}
                            className={`flex items-start gap-3 p-3 rounded-xl border ${
                                option.is_correct
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                option.is_correct
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                            }`}>
                                {option.option_key}
                            </span>
                            <div className="flex-1 min-w-0">
                                <MathRenderer content={option.content} />
                                {option.is_correct && correctOption && (
                                    <span className="inline-flex items-center mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                        ✓ Jawaban Benar
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {question.tags && question.tags.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {question.tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-400"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
