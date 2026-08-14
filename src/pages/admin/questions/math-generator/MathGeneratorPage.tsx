import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { MathPreviewConfig, MathPreviewQuestion, mathGeneratorApi } from '@/lib/api';
import MathConfigPanel from './MathConfigPanel';
import MathPreviewPanel from './MathPreviewPanel';
import MathSaveDialog from './MathSaveDialog';

const MySwal = withReactContent(Swal);

export default function MathGeneratorPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const preselectedBankId = location.state?.questionBankId;
    const [previews, setPreviews] = useState<MathPreviewQuestion[]>([]);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

    const handleGenerate = async (config: MathPreviewConfig) => {
        setIsGenerating(true);
        try {
            const response = await mathGeneratorApi.preview(config);
            if (response.success) {
                setPreviews(response.data.previews);
                setSelectedIndices(new Set());
                MySwal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: `${response.data.total_generated} soal berhasil di-generate!`,
                    showConfirmButton: false,
                    timer: 3000,
                });
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Gagal generate soal';
            MySwal.fire({
                icon: 'error',
                title: 'Gagal Generate Soal',
                html: `<div class="text-left text-sm">
                    <p class="mb-2">${message}</p>
                    <p class="text-slate-400 text-xs">Periksa kembali konfigurasi (level, tipe bilangan, operasi) lalu coba lagi.</p>
                </div>`,
                confirmButtonColor: '#6366f1',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleToggleSelect = (index: number) => {
        setSelectedIndices(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const handleSelectAll = () => {
        setSelectedIndices(new Set(previews.map((_, i) => i)));
    };

    const handleDeselectAll = () => {
        setSelectedIndices(new Set());
    };

    const handleSave = async (questionBankId: string) => {
        setIsSaving(true);
        try {
            const selectedPreviews = previews.filter((_, index) => selectedIndices.has(index));
            const response = await mathGeneratorApi.save(questionBankId, selectedPreviews);

            if (response.success) {
                MySwal.fire({
                    icon: 'success',
                    title: 'Berhasil Disimpan!',
                    text: `${response.data.saved_count} soal berhasil disimpan ke Question Bank.`,
                    confirmButtonColor: '#6366f1',
                });
                setIsSaveDialogOpen(false);
                setPreviews([]);
                setSelectedIndices(new Set());
                if (preselectedBankId) {
                    navigate(`/admin/question-banks/${preselectedBankId}/edit`);
                }
            }
        } catch (error: any) {
            const message = error.response?.data?.message || 'Gagal menyimpan soal';
            MySwal.fire({
                icon: 'error',
                title: 'Gagal Menyimpan',
                text: message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1400px] mx-auto"
        >
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-3 mb-1 sm:mb-2">
                        <Link
                            to="/admin/questions"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-500" />
                        </Link>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Math Generator</h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 ml-11">
                        Generate soal matematika secara otomatis dengan Python Math Engine
                    </p>
                </div>
                {previews.length > 0 && selectedIndices.size > 0 && (
                    <button
                        onClick={() => setIsSaveDialogOpen(true)}
                        className="bg-primary text-white rounded-xl text-sm font-bold px-5 sm:px-6 py-2.5 sm:py-3 hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center justify-center gap-2 self-start"
                    >
                        <Save className="w-4 h-4" />
                        Simpan ({selectedIndices.size})
                    </button>
                )}
            </div>

            {/* Content: 1 col mobile, 2 cols desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                <div className="lg:col-span-4">
                    <div className="lg:sticky lg:top-4">
                        <MathConfigPanel onGenerate={handleGenerate} isLoading={isGenerating} />
                    </div>
                </div>
                <div className="lg:col-span-8">
                    <MathPreviewPanel
                        questions={previews}
                        selectedIndices={selectedIndices}
                        onToggleSelect={handleToggleSelect}
                        onSelectAll={handleSelectAll}
                        onDeselectAll={handleDeselectAll}
                    />
                </div>
            </div>

            {/* Save Dialog */}
            <MathSaveDialog
                isOpen={isSaveDialogOpen}
                onClose={() => setIsSaveDialogOpen(false)}
                onSave={handleSave}
                selectedCount={selectedIndices.size}
                isLoading={isSaving}
                preselectedBankId={preselectedBankId}
            />
        </motion.div>
    );
}
