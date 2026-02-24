import { QuestionOption } from '@/lib/api';
import MultipleChoiceCorrection from './MultipleChoiceCorrection';
import EssayCorrection from './EssayCorrection';
import MatchingCorrection from './MatchingCorrection';
import CategorizationCorrection from './CategorizationCorrection';
import SequenceCorrection from './SequenceCorrection';

interface CorrectionDisplayProps {
    type: string;
    studentAnswer: any;
    options: QuestionOption[];
    keyAnswer?: any;
    maxScore: number;
    scoreEarned: number;
}

export default function CorrectionDisplay({ type, studentAnswer, options, keyAnswer, maxScore, scoreEarned }: CorrectionDisplayProps) {
    const renderComponent = () => {
        switch (type) {
            case 'multiple_choice':
                return <MultipleChoiceCorrection options={options} studentAnswer={studentAnswer} keyAnswer={keyAnswer} isMultiple={false} />;
            case 'multiple_selection':
                return <MultipleChoiceCorrection options={options} studentAnswer={studentAnswer} keyAnswer={keyAnswer} isMultiple={true} />;
            case 'true_false':
                return <MultipleChoiceCorrection options={options} studentAnswer={studentAnswer} keyAnswer={keyAnswer} isMultiple={false} />;
            case 'essay':
            case 'short_answer':
                return <EssayCorrection studentAnswer={studentAnswer as string} options={options} keyAnswer={keyAnswer} />;
            case 'arabic_response':
            case 'javanese_response':
            case 'math_input':
                return <EssayCorrection studentAnswer={studentAnswer as string} options={options} keyAnswer={keyAnswer} />;
            case 'matching':
                return <MatchingCorrection options={options} studentAnswer={studentAnswer} keyAnswer={keyAnswer} />;
            case 'sequence':
                return <SequenceCorrection options={options} studentAnswer={studentAnswer as string[]} keyAnswer={keyAnswer} />;
            case 'categorization':
                return <CategorizationCorrection options={options} studentAnswer={studentAnswer} keyAnswer={keyAnswer} />;
            default:
                return (
                    <div className="p-8 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400">
                        <span className="material-symbols-outlined text-4xl mb-2">extension</span>
                        <p>Visual correction for <b>{type}</b> is not yet implemented.</p>
                        <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-left overflow-auto max-h-[200px]">
                            <h6 className="text-[10px] font-bold uppercase mb-2">Raw Answer:</h6>
                            <pre className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                {JSON.stringify(studentAnswer, null, 2)}
                            </pre>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {renderComponent()}
        </div>
    );
}
