import { MathPreviewQuestion } from '@/lib/api';
import MathQuestionCard from './MathQuestionCard';
import { FileQuestion, CheckSquare } from 'lucide-react';

interface MathPreviewPanelProps {
    questions: MathPreviewQuestion[];
    selectedIndices: Set<number>;
    onToggleSelect: (index: number) => void;
    onSelectAll: () => void;
    onDeselectAll: () => void;
}

export default function MathPreviewPanel({
    questions,
    selectedIndices,
    onToggleSelect,
    onSelectAll,
    onDeselectAll,
}: MathPreviewPanelProps) {
    if (questions.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-800 p-12">
                <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <FileQuestion className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Belum Ada Soal</h3>
                    <p className="text-sm text-slate-500 max-w-sm">
                        Atur parameter pada panel konfigurasi, lalu klik "Generate Soal" untuk membuat preview soal matematika.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Preview Soal ({questions.length})
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">
                        {selectedIndices.size} dipilih
                    </span>
                    <button
                        onClick={onSelectAll}
                        className="text-xs text-primary hover:text-primary/80 font-medium"
                    >
                        Pilih Semua
                    </button>
                    {selectedIndices.size > 0 && (
                        <button
                            onClick={onDeselectAll}
                            className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                        >
                            Batal Pilih
                        </button>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                {questions.map((question, index) => (
                    <MathQuestionCard
                        key={`${question.id}-${index}`}
                        question={question}
                        index={index}
                        isSelected={selectedIndices.has(index)}
                        onToggleSelect={() => onToggleSelect(index)}
                    />
                ))}
            </div>
        </div>
    );
}
