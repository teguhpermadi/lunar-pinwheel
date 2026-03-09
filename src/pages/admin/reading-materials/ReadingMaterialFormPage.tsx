import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import { readingMaterialApi } from '@/lib/api';
import RichTextEditor from '@/components/ui/RichTextEditor';
import QuestionToolbar from '@/components/questions/QuestionToolbar';
import {
    ArrowLeft, Save, FileText, Type, Upload, X, File, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { useEditorStore } from '@/store/useEditorStore';
import MediaModal from '@/components/questions/MediaModal';

export default function ReadingMaterialFormPage() {
    const { bankId, materialId } = useParams();
    const navigate = useNavigate();
    const isEditing = !!materialId;
    const { activeEditor } = useEditorStore();

    const [isLoading, setIsLoading] = useState(isEditing);
    const [isSaving, setIsSaving] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [mode, setMode] = useState<'text' | 'pdf'>('text');
    const [localMaterialId, setLocalMaterialId] = useState<string | null>(materialId || null);

    const isEditingEffective = !!localMaterialId;
    // PDF State
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [existingPdf, setExistingPdf] = useState<any>(null);
    const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

    const hasRichTextContent = !!(content && content !== '<p></p>' && content.trim() !== '');
    const hasPdfContent = !!(pdfFile || existingPdf);

    useEffect(() => {
        if (materialId) {
            fetchMaterial();
        }
    }, [materialId]);

    const fetchMaterial = async () => {
        try {
            const response = await readingMaterialApi.getMaterial(materialId!);
            if (response.success) {
                const m = response.data;
                setTitle(m.title);
                setContent(m.content || '');

                // Check if has PDF in media
                const pdf = m.media?.reading_materials?.[0];
                if (pdf) {
                    setExistingPdf(pdf);
                    setMode('pdf');
                }
            }
        } catch (error) {
            console.error("Failed to fetch material", error);
            Swal.fire('Error', 'Failed to load reading material', 'error');
            navigate(-1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInsertImage = async (file: File) => {
        if (!activeEditor) return;

        try {
            let currentMaterialId = localMaterialId;

            // If new material, we need to save it first to get an ID for media attachment
            if (!currentMaterialId) {
                if (!title.trim()) {
                    Swal.fire('Info', 'Please enter a title first before inserting images', 'info');
                    setIsMediaModalOpen(false);
                    return;
                }

                setIsSaving(true);
                const response = await readingMaterialApi.createMaterial({
                    title,
                    content: '',
                    question_bank_id: bankId
                });

                if (response.success) {
                    currentMaterialId = response.data.id;
                    setLocalMaterialId(currentMaterialId!);
                    // Update URL without reloading to keep state
                    window.history.replaceState(null, '', `/admin/question-banks/${bankId}/reading-materials/${currentMaterialId}/edit`);
                } else {
                    throw new Error("Failed to create draft for image upload");
                }
            }

            Swal.fire({
                title: 'Uploading image...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Upload to 'reading_images' collection
            const uploadRes = await readingMaterialApi.uploadMedia(currentMaterialId!, file, 'reading_images');

            if (uploadRes.success) {
                const imageUrl = uploadRes.data.url;
                activeEditor.chain().focus().setImage({ src: imageUrl }).run();
                Swal.close();
            } else {
                throw new Error(uploadRes.message || "Upload failed");
            }

        } catch (error: any) {
            console.error("Image upload error", error);
            Swal.fire('Error', error.message || 'Failed to upload image', 'error');
        } finally {
            setIsSaving(false);
            setIsMediaModalOpen(false);
        }
    };

    const handleSave = async () => {
        if (!title.trim()) {
            Swal.fire('Error', 'Title is required', 'error');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                title,
                content: mode === 'text' ? content : '',
                question_bank_id: bankId,
            };

            let response;
            if (isEditingEffective) {
                response = await readingMaterialApi.updateMaterial(localMaterialId!, payload);
            } else {
                response = await readingMaterialApi.createMaterial(payload);
            }

            if (response.success) {
                const savedId = response.data.id;

                // Handle PDF upload if in PDF mode
                if (mode === 'pdf' && pdfFile) {
                    await readingMaterialApi.uploadMedia(savedId, pdfFile, 'reading_materials');
                }

                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `Material ${isEditing ? 'updated' : 'created'} successfully`,
                    showConfirmButton: false,
                    timer: 1500
                });

                navigate(`/admin/question-banks/${bankId}`);
            } else {
                throw new Error(response.message);
            }
        } catch (error: any) {
            console.error("Save error", error);
            Swal.fire('Error', error.message || 'Failed to save material', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col font-display">
            {/* Header */}
            <header className="h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-20 shrink-0 sticky top-0">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                        <ArrowLeft className="size-5" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {isEditing ? 'Edit Reading Material' : 'Create Reading Material'}
                        </h1>
                        <p className="text-xs text-slate-400 font-medium">Add text or PDF content for your questions</p>
                    </div>
                </div>

                {mode === 'text' && (
                    <div className="flex-1 flex justify-center">
                        <QuestionToolbar />
                    </div>
                )}

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <Save className="size-4" />
                        )}
                        {isEditing ? 'Update Material' : 'Save Material'}
                    </button>
                </div>
            </header>

            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Mode Selector */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setMode('text')}
                            disabled={hasPdfContent}
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative group ${mode === 'text'
                                ? 'bg-primary/5 border-primary text-primary shadow-sm'
                                : hasPdfContent
                                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-300 cursor-not-allowed opacity-60'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className={`size-12 rounded-2xl flex items-center justify-center ${mode === 'text' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                <Type className="size-6" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold">Rich Text</span>
                                <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                                    {hasPdfContent ? 'Clear PDF to switch' : 'Write content with images'}
                                </span>
                            </div>
                        </button>

                        <button
                            onClick={() => setMode('pdf')}
                            disabled={hasRichTextContent}
                            className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 relative group ${mode === 'pdf'
                                ? 'bg-primary/5 border-primary text-primary shadow-sm'
                                : hasRichTextContent
                                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800 text-slate-300 cursor-not-allowed opacity-60'
                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                                }`}
                        >
                            <div className={`size-12 rounded-2xl flex items-center justify-center ${mode === 'pdf' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                <FileText className="size-6" />
                            </div>
                            <div className="text-center">
                                <span className="block font-bold">PDF Document</span>
                                <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">
                                    {hasRichTextContent ? 'Clear text to switch' : 'Upload existing PDF file'}
                                </span>
                            </div>
                        </button>
                    </div>

                    {/* Form Fields */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-800 p-10 space-y-8">
                        <section className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Material Title</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter material title (e.g. Reading Section A)"
                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-3xl text-lg font-bold focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            />
                        </section>

                        {mode === 'text' ? (
                            <section className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Content</label>
                                    <button
                                        onClick={() => setIsMediaModalOpen(true)}
                                        className="flex items-center gap-2 px-4 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-primary/10 hover:text-primary rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all"
                                    >
                                        <ImageIcon className="size-3.5" />
                                        Insert Image Between Text
                                    </button>
                                </div>
                                <div className="border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden bg-slate-50/30 dark:bg-slate-800/20">
                                    <RichTextEditor
                                        value={content}
                                        onChange={setContent}
                                        minHeight="min-h-[400px]"
                                        placeholder="Start writing your material here..."
                                        className="p-8 text-lg"
                                    />
                                </div>
                            </section>
                        ) : (
                            <section className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">PDF File</label>

                                <div className="space-y-4">
                                    {pdfFile || existingPdf ? (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg flex items-center justify-center">
                                                        <File className="size-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-xs">
                                                            {pdfFile ? pdfFile.name : existingPdf.name}
                                                        </p>
                                                        <p className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">
                                                            {pdfFile ? 'Previewing selected file' : 'Currently stored document'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setPdfFile(null);
                                                        setExistingPdf(null);
                                                    }}
                                                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center gap-2"
                                                >
                                                    <X className="size-3" /> Change File
                                                </button>
                                            </div>

                                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 h-[800px] shadow-inner">
                                                <iframe
                                                    src={pdfFile ? URL.createObjectURL(pdfFile) : `${existingPdf.url}#toolbar=1&navpanes=0&scrollbar=1`}
                                                    className="w-full h-full border-none"
                                                    title="PDF Preview"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center gap-6 bg-slate-50/50 dark:bg-slate-800/30">
                                            <div className="size-20 bg-primary/10 text-primary rounded-[2rem] flex items-center justify-center shadow-inner">
                                                <Upload className="size-10" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Click to upload PDF</h3>
                                                <p className="text-xs text-slate-400 font-medium">Max size: 10MB • Format: PDF Only</p>
                                            </div>
                                            <input
                                                type="file"
                                                accept=".pdf"
                                                id="pdf-upload"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setPdfFile(file);
                                                }}
                                            />
                                            <label
                                                htmlFor="pdf-upload"
                                                className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-primary hover:text-primary transition-all cursor-pointer shadow-sm hover:shadow-md"
                                            >
                                                Choose File
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* AI Assistance Mock */}
                    <div className="bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-3xl border border-primary/20 p-8 flex items-center gap-6">
                        <div className="size-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm text-primary shrink-0">
                            <Sparkles className="size-8" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-1 italic">Premium Feature: AI Summary</h4>
                            <p className="text-xs text-slate-500 font-medium leading-relaxed">Coming soon! Use AI to summarize long reading texts or extract questions automatically from your uploaded PDF material.</p>
                        </div>
                    </div>
                </div>
            </main>

            <MediaModal
                isOpen={isMediaModalOpen}
                onClose={() => setIsMediaModalOpen(false)}
                onUpload={handleInsertImage}
                title="Insert Image"
            />
        </div>
    );
}
