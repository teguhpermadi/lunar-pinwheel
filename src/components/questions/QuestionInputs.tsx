import MultipleChoiceInput from '@/components/questions/inputs/MultipleChoiceInput';
import MultipleSelectionInput from '@/components/questions/inputs/MultipleSelectionInput';
import TrueFalseInput from '@/components/questions/inputs/TrueFalseInput';
import ShortAnswerInput from '@/components/questions/inputs/ShortAnswerInput';
import MatchingInput from '@/components/questions/inputs/MatchingInput';
import SequenceInput from '@/components/questions/inputs/SequenceInput';
import EssayInput from '@/components/questions/inputs/EssayInput';
import MathInput from '@/components/questions/inputs/MathInput';
import ArabicInput from '@/components/questions/inputs/ArabicInput';
import JavaneseInput from '@/components/questions/inputs/JavaneseInput';
import CategorizationInput from '@/components/questions/inputs/CategorizationInput';


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
    mathContent: string;
    setMathContent: (content: string) => void;
    arabicContent: string;
    setArabicContent: (content: string) => void;
    javaneseContent: string;
    setJavaneseContent: (content: string) => void;
    categorizationGroups: any[];
    setCategorizationGroups: (groups: any[]) => void;
    isEditing?: boolean;

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
    setEssayKeywords,
    mathContent,
    setMathContent,
    arabicContent,
    setArabicContent,
    javaneseContent,
    setJavaneseContent,
    categorizationGroups,
    setCategorizationGroups,
    isEditing
}: QuestionInputsProps) {

    switch (type) {
        case 'multiple_choice':
            return <MultipleChoiceInput options={options} onChange={setOptions} onDeleteMedia={handleDeleteOptionMedia} isEditing={isEditing} />;
        case 'multiple_selection':
            return <MultipleSelectionInput options={options} onChange={setOptions} onDeleteMedia={handleDeleteOptionMedia} isEditing={isEditing} />;
        case 'true_false':
            return <TrueFalseInput options={options} onChange={setOptions} />;
        case 'short_answer':
            return <ShortAnswerInput options={options} onChange={setOptions} />;
        case 'matching':
            return <MatchingInput pairs={matchingPairs} onChange={setMatchingPairs} />;
        case 'sequence':
            return <SequenceInput items={sequenceItems} onChange={setSequenceItems} />;
        case 'essay':
            return <EssayInput keywords={essayKeywords} onKeywordsChange={setEssayKeywords} />;
        case 'math_input':
            return <MathInput value={mathContent} onChange={setMathContent} />;
        case 'arabic_response':
            return <ArabicInput value={arabicContent} onChange={setArabicContent} />;
        case 'javanese_response':
            return <JavaneseInput value={javaneseContent} onChange={setJavaneseContent} />;
        case 'categorization':
            return <CategorizationInput groups={categorizationGroups} onChange={setCategorizationGroups} onDeleteMedia={handleDeleteOptionMedia} />;
        default:

            return null;
    }
}
