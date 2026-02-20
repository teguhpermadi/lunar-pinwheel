import { Question } from '@/lib/api';
import MultipleChoiceDisplay from './MultipleChoiceDisplay';
import TrueFalseDisplay from './TrueFalseDisplay';
import MatchingDisplay from './MatchingDisplay';
import SequenceDisplay from './SequenceDisplay';
import ShortAnswerDisplay from './ShortAnswerDisplay';
import EssayDisplay from './EssayDisplay';

interface QuestionOptionDisplayProps {
    question: Question;
}

export default function QuestionOptionDisplay({ question }: QuestionOptionDisplayProps) {
    switch (question.type) {
        case 'multiple_choice':
        case 'multiple_selection':
            return <MultipleChoiceDisplay options={question.options} type={question.type} />;

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
            return <div className="text-sm italic text-slate-400">Math input display coming soon.</div>;

        default:
            return <div className="text-sm italic text-slate-400">Preview not available for this question type.</div>;
    }
}
