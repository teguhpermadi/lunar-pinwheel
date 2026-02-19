import MultipleChoiceInput from '@/components/questions/inputs/MultipleChoiceInput';
import MultipleSelectionInput from '@/components/questions/inputs/MultipleSelectionInput';
import TrueFalseInput from '@/components/questions/inputs/TrueFalseInput';
import MatchingInput from '@/components/questions/inputs/MatchingInput';
import SequenceInput from '@/components/questions/inputs/SequenceInput';
import EssayInput from '@/components/questions/inputs/EssayInput';

interface QuestionInputsProps {
    type: string;
    options: any[];
    setOptions: (options: any[]) => void;
    handleDeleteOptionMedia: (uuid: string, mediaId?: string) => void;
    matchingPairs: any[];
    setMatchingPairs: (pairs: any[]) => void;
    sequenceItems: any[];
    setSequenceItems: (items: any[]) => void;
    essayKeywords: string;
    setEssayKeywords: (keywords: string) => void;
}

export default function QuestionInputs({
    type,
    options,
    setOptions,
    handleDeleteOptionMedia,
    matchingPairs,
    setMatchingPairs,
    sequenceItems,
    setSequenceItems,
    essayKeywords,
    setEssayKeywords
}: QuestionInputsProps) {
    switch (type) {
        case 'multiple_choice':
            return <MultipleChoiceInput options={options} onChange={setOptions} onDeleteMedia={handleDeleteOptionMedia} />;
        case 'multiple_selection':
            return <MultipleSelectionInput options={options} onChange={setOptions} />;
        case 'true_false':
            return <TrueFalseInput options={options} onChange={setOptions} />;
        case 'matching':
            return <MatchingInput pairs={matchingPairs} onChange={setMatchingPairs} />;
        case 'sequence':
            return <SequenceInput items={sequenceItems} onChange={setSequenceItems} />;
        case 'essay':
            return <EssayInput keywords={essayKeywords} onKeywordsChange={setEssayKeywords} />;
        default:
            return null;
    }
}
