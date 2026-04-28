import { ReactNode, useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QuestionDifficultySelector from './QuestionDifficultySelector';
import QuestionTimerSelector from './QuestionTimerSelector';
import QuestionScoreSelector from './QuestionScoreSelector';
import QuestionTypeSelector from './QuestionTypeSelector';
import ReadingMaterialSelector from './ReadingMaterialSelector';
import ReadingMaterialSlideOver from './ReadingMaterialSlideOver';
import { readingMaterialApi, ReadingMaterial } from '@/lib/api';
import { ArrowLeft, Loader2, Save, Lightbulb, X, Info, Eye, MoreHorizontal } from 'lucide-react';

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
    bankId?: string;

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
    bankId: propBankId,
    onSave,
    isSaving,
    isEditing: _isEditing = false
}: QuestionFormLayoutProps) {
    const navigate = useNavigate();
    const { bankId: paramsBankId } = useParams();
    const bankId = propBankId || paramsBankId;
    const [isHintOpen, setIsHintOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [availableMaterials, setAvailableMaterials] = useState<ReadingMaterial[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState<ReadingMaterial | null>(null);
    const [isMaterialLoading, setIsMaterialLoading] = useState(false);

    // Fetch materials for the selector and preview
    useEffect(() => {
        if (!bankId) {
            setAvailableMaterials([]);
            return;
        }

        const fetchMaterials = async () => {
            try {
                const response = await readingMaterialApi.getMaterials({
                    per_page: 100,
                    question_bank_id: bankId
                });
                if (response.success) {
                    // Support both paginated response.data.data and direct response.data
                    const data = response.data?.data || response.data;
                    setAvailableMaterials(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to fetch materials", error);
            }
        };
        fetchMaterials();
    }, [bankId]);

    // Update selected material when ID changes
    useEffect(() => {
        if (readingMaterialId) {
            const material = availableMaterials.find(m => m.id === readingMaterialId);
            if (material) {
                setSelectedMaterial(material);
                setIsMaterialLoading(false);
            } else {
                // Fetch individually if not in list
                const fetchIndividualMaterial = async () => {
                    setIsMaterialLoading(true);
                    try {
                        const response = await readingMaterialApi.getMaterial(readingMaterialId);
                        if (response.success) {
                            setSelectedMaterial(response.data);
                        }
                    } catch (error) {
                        console.error("Failed to fetch individual material", error);
                    } finally {
                        setIsMaterialLoading(false);
                    }
                };
                fetchIndividualMaterial();
            }
        } else {
            setSelectedMaterial(null);
            setIsPreviewOpen(false);
            setIsMaterialLoading(false);
        }
    }, [readingMaterialId, availableMaterials]);

    return (
        <div className="flex flex-col h-screen relative bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display overflow-hidden">
            {/* Header */}
            <header className="min-h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-4 lg:px-6 flex items-center justify-between gap-2 lg:gap-4 z-30 shrink-0 flex-wrap lg:flex-nowrap">
                <div className="flex items-center gap-2 lg:gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400 flex items-center"
                    >
                        <ArrowLeft className="size-5" />
                    </button>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:block">{title}</span>
                        <QuestionTypeSelector
                            initialType={type}
                            onTypeChange={setType}
                            manual={true}
                        />
                    </div>
                </div>

                

                <div className="flex items-center gap-2 lg:gap-6">
                    {/* Desktop: Reading Material + Preview + Difficulty + Timer/Score */}
                    <div className="hidden lg:flex items-center gap-2 mr-2 border-r border-slate-200 dark:border-slate-800 pr-6">
                        <ReadingMaterialSelector
                            initialMaterialId={readingMaterialId}
                            onMaterialChange={(id) => {
                                if (setReadingMaterialId) setReadingMaterialId(id);
                            }}
                            availableMaterials={availableMaterials}
                            manual={true}
                            questionBankId={bankId}
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

                    {/* Desktop: Difficulty */}
                    <div className="hidden lg:block">
                        <QuestionDifficultySelector
                            initialDifficulty={difficulty}
                            onDifficultyChange={setDifficulty}
                            manual={true}
                        />
                    </div>

                    {/* Desktop: Timer & Score */}
                    <div className="hidden lg:flex items-center gap-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-1.5">
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

                    {/* Mobile: Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors text-slate-600 dark:text-slate-400 flex items-center border border-slate-200 dark:border-slate-700"
                    >
                        <MoreHorizontal className="size-5" />
                    </button>

                    {/* Save Button - Always Visible */}
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className={`
                            px-4 lg:px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold 
                            hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 whitespace-nowrap
                            ${isSaving ? 'opacity-70 cursor-wait' : ''}
                        `}
                    >
                        {isSaving ? (
                            <Loader2 className="size-5 animate-spin" />
                        ) : (
                            <Save className="size-5" />
                        )}
                        <span className="hidden sm:inline">Simpan</span>
                    </button>
                </div>
            </header>

            {/* Mobile Menu Dropdown */}
            {isMobileMenuOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 z-40"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                    {/* Slide-over Panel */}
                    <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="font-bold text-lg text-slate-800 dark:text-slate-100">Pengaturan</h2>
                            <button
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Reading Material */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Bahan Bacaan</label>
                                <ReadingMaterialSelector
                                    initialMaterialId={readingMaterialId}
                                    onMaterialChange={(id) => {
                                        if (setReadingMaterialId) setReadingMaterialId(id);
                                    }}
                                    availableMaterials={availableMaterials}
                                    manual={true}
                                    questionBankId={bankId}
                                />
                                {readingMaterialId && (
                                    <button
                                        onClick={() => {
                                            setIsPreviewOpen(!isPreviewOpen);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`
                                            w-full p-2 rounded-xl border transition-all flex items-center justify-center gap-2
                                            ${isPreviewOpen
                                                ? 'bg-primary text-white border-primary'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}
                                        `}
                                    >
                                        <Eye className="size-4" />
                                        <span className="text-sm">Lihat Bahan Bacaan</span>
                                    </button>
                                )}
                            </div>

                            {/* Difficulty */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tingkat Kesulitan</label>
                                <QuestionDifficultySelector
                                    initialDifficulty={difficulty}
                                    onDifficultyChange={setDifficulty}
                                    manual={true}
                                />
                            </div>

                            {/* Timer */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waktu</label>
                                <QuestionTimerSelector
                                    initialTimer={timer}
                                    onTimerChange={setTimer}
                                    manual={true}
                                />
                            </div>

                            {/* Score */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Skor</label>
                                <QuestionScoreSelector
                                    initialScore={score}
                                    onScoreChange={setScore}
                                    manual={true}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}

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

                    <main className="max-w-5xl mx-auto p-4 md:p-8 space-y-6 md:space-y-10 min-h-full">
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
                    bankId={bankId}
                    isLoading={isMaterialLoading}
                />
            </div>
        </div>
    );
}

const ConfirmInfo = Info;
