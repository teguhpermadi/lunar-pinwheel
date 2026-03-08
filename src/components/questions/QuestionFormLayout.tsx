import { ReactNode, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QuestionDifficultySelector from './QuestionDifficultySelector';
import QuestionTimerSelector from './QuestionTimerSelector';
import QuestionScoreSelector from './QuestionScoreSelector';
import QuestionTypeSelector from './QuestionTypeSelector';
import QuestionToolbar from './QuestionToolbar';
import ReadingMaterialSelector from './ReadingMaterialSelector';
import ReadingMaterialSlideOver from './ReadingMaterialSlideOver';
import { readingMaterialApi, ReadingMaterial } from '@/lib/api';
import { ArrowLeft, Loader2, Save, Lightbulb, X, Info, Eye } from 'lucide-react';

interface QuestionFormLayoutProps {
    children: ReactNode;
    title: string;

    // State for selectors
    type: string;
    setType: (type: string) => void;
    difficulty: string;
    setDifficulty: (diff: string) => void;
    timer: number;
    setTimer: (timer: number) => void;
    score: number;
    setScore: (score: number) => void;
    readingMaterialId?: string | null;
    setReadingMaterialId?: (id: string | null) => void;

    // Hint
    hint: string;
    setHint: (hint: string) => void;

    // Actions
    onSave: () => void;
    isSaving: boolean;
    isEditing?: boolean;
}

export default function QuestionFormLayout({
    children,
    title,
    type,
    setType,
    difficulty,
    setDifficulty,
    timer,
    setTimer,
    score,
    setScore,
    hint,
    setHint,
    readingMaterialId,
    setReadingMaterialId,
    onSave,
    isSaving,
    isEditing: _isEditing = false
}: QuestionFormLayoutProps) {
    const navigate = useNavigate();
    const [isHintOpen, setIsHintOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [availableMaterials, setAvailableMaterials] = useState<ReadingMaterial[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState<ReadingMaterial | null>(null);

    // Fetch materials for the selector and preview
    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const response = await readingMaterialApi.getMaterials({ per_page: 100 });
                if (response.success) {
                    setAvailableMaterials(Array.isArray(response.data?.data) ? response.data.data : []);
                }
            } catch (error) {
                console.error("Failed to fetch materials", error);
            }
        };
        fetchMaterials();
    }, []);

    // Update selected material when ID changes
    useEffect(() => {
        if (readingMaterialId && Array.isArray(availableMaterials)) {
            const material = availableMaterials.find(m => m.id === readingMaterialId);
            if (material) {
                setSelectedMaterial(material);
            }
        } else {
            setSelectedMaterial(null);
            setIsPreviewOpen(false);
        }
    }, [readingMaterialId, availableMaterials]);

    return (
        <div className="flex flex-col h-screen relative bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display overflow-hidden">
            {/* Header */}
            <header className="h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-30 shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400 flex items-center"
                    >
                        <ArrowLeft className="size-5" />
                    </button>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</span>
                        <QuestionTypeSelector
                            initialType={type}
                            onTypeChange={setType}
                            manual={true}
                        />
                    </div>
                </div>

                <div className="flex-1 flex justify-center px-4">
                    <QuestionToolbar />
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 mr-2 border-r border-slate-200 dark:border-slate-800 pr-6">
                        <ReadingMaterialSelector
                            initialMaterialId={readingMaterialId}
                            onMaterialChange={(id) => {
                                if (setReadingMaterialId) setReadingMaterialId(id);
                            }}
                            availableMaterials={availableMaterials}
                            manual={true}
                        />

                        {readingMaterialId && (
                            <button
                                onClick={() => setIsPreviewOpen(!isPreviewOpen)}
                                className={`
                                    p-2 rounded-xl border transition-all flex items-center gap-2
                                    ${isPreviewOpen
                                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}
                                `}
                                title="Preview Material"
                            >
                                <Eye className="size-4" />
                            </button>
                        )}
                    </div>

                    <QuestionDifficultySelector
                        initialDifficulty={difficulty}
                        onDifficultyChange={setDifficulty}
                        manual={true}
                    />

                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-1.5">
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Time</span>
                            <QuestionTimerSelector
                                initialTimer={timer}
                                onTimerChange={setTimer}
                                manual={true}
                            />
                        </div>
                        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Score</span>
                            <QuestionScoreSelector
                                initialScore={score}
                                onScoreChange={setScore}
                                manual={true}
                            />
                        </div>
                    </div>

                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className={`
                            px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold 
                            hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2
                            ${isSaving ? 'opacity-70 cursor-wait' : ''}
                        `}
                    >
                        {isSaving ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            <Save className="size-5" />
                        )}
                        Simpan
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative flex">
                <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-background-dark/30 scroll-smooth relative">
                    {/* Hint Toggle */}
                    <div className="absolute top-6 right-6 z-20">
                        <button
                            onClick={() => setIsHintOpen(true)}
                            className="size-10 bg-white dark:bg-slate-800 shadow-md rounded-full flex items-center justify-center text-primary cursor-pointer hover:scale-110 transition-transform border border-slate-100 dark:border-slate-700"
                        >
                            <Lightbulb className="size-6" />
                        </button>
                    </div>

                    <main className="max-w-5xl mx-auto p-8 space-y-10 min-h-full">
                        {children}
                    </main>
                </div>

                {/* Hint Sidebar */}
                <aside
                    className={`
                        fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 z-50 
                        transform transition-transform duration-300 ease-in-out p-6 pt-20
                        ${isHintOpen ? 'translate-x-0' : 'translate-x-full'}
                    `}
                >
                    <div className="absolute top-4 right-4">
                        <button
                            onClick={() => setIsHintOpen(false)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2 mb-8 text-slate-800 dark:text-slate-100">
                        <Lightbulb className="size-6 text-yellow-500" />
                        <h2 className="font-bold text-lg">Question Hint</h2>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-500 leading-relaxed italic">Add a hint to help students when they get stuck.</p>
                        <textarea
                            value={hint}
                            onChange={(e) => setHint(e.target.value)}
                            className="w-full h-40 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-sm focus:ring-primary focus:border-primary transition-all resize-none outline-none border"
                            placeholder="Type hint here..."
                        />
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-slate-100 dark:border-slate-800">
                            <ConfirmInfo className="size-3" />
                            Optional Feature
                        </div>
                    </div>
                </aside>

                {/* Backdrop for mobile/when sidebar open if needed, tailored for desktop mostly now */}
                {isHintOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                        onClick={() => setIsHintOpen(false)}
                    />
                )}

                <ReadingMaterialSlideOver
                    isOpen={isPreviewOpen}
                    onClose={() => setIsPreviewOpen(false)}
                    material={selectedMaterial}
                />
            </div>
        </div>
    );
}

const ConfirmInfo = Info;
