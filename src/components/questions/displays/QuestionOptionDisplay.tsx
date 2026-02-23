import { Question } from '@/lib/api';
import MultipleChoiceDisplay from './MultipleChoiceDisplay';
import TrueFalseDisplay from './TrueFalseDisplay';
import MatchingDisplay from './MatchingDisplay';
import SequenceDisplay from './SequenceDisplay';
import ShortAnswerDisplay from './ShortAnswerDisplay';
import EssayDisplay from './EssayDisplay';
import MathInputDisplay from './MathInputDisplay';
import ArabicInputDisplay from '@/components/questions/displays/ArabicInputDisplay';
import JavaneseInputDisplay from '@/components/questions/displays/JavaneseInputDisplay';
import CategorizationDisplay from './CategorizationDisplay';


interface QuestionOptionDisplayProps {
    question: Question;
    onMediaClick?: (url: string) => void;
}

export default function QuestionOptionDisplay({ question, onMediaClick }: QuestionOptionDisplayProps) {
    switch (question.type) {
        case 'multiple_choice':
        case 'multiple_selection':
            return <MultipleChoiceDisplay options={question.options} type={question.type} onMediaClick={onMediaClick} />;

        case 'true_false':
            return <TrueFalseDisplay options={question.options} />;

        case 'matching':
            // Check for matching_pairs in extended data if exists, otherwise try options or standard mapping
            return <MatchingDisplay options={question.options} matchingPairs={(question as any).matching_pairs} />;

        case 'sequence':
            return <SequenceDisplay options={question.options} sequenceItems={(question as any).sequence_items} />;

        case 'short_answer':
            return <ShortAnswerDisplay options={question.options} />;

        case 'essay':
            return (
                <EssayDisplay
                    options={question.options}
                    keywords={(question as any).keywords}
                />
            );

        case 'arrange_words':
            return <div className="text-sm italic text-slate-400">Arrange words display coming soon.</div>;

        case 'math_input':
            return <MathInputDisplay options={question.options} />;

        case 'arabic_response':
            return <ArabicInputDisplay options={question.options} />;
        case 'javanese_response':
            return <JavaneseInputDisplay options={question.options} />;
        case 'categorization':
            return <CategorizationDisplay options={question.options} onMediaClick={onMediaClick} />;

        default:

            return <div className="text-sm italic text-slate-400">Preview not available for this question type.</div>;
    }
}
