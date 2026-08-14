import { useState, useEffect } from 'react';
import { questionBankApi, QuestionBank } from '@/lib/api';
import { X, Loader2, Save, ChevronDown } from 'lucide-react';

interface MathSaveDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (questionBankId: string) => void;
    selectedCount: number;
    isLoading: boolean;
    preselectedBankId?: string;
}

export default function MathSaveDialog({ isOpen, onClose, onSave, selectedCount, isLoading, preselectedBankId }: MathSaveDialogProps) {
    const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
    const [selectedBankId, setSelectedBankId] = useState(preselectedBankId || '');
    const [isFetchingBanks, setIsFetchingBanks] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchBanks = async () => {
                setIsFetchingBanks(true);
                try {
                    const response = await questionBankApi.getQuestionBanks({ per_page: 50 });
                    if (response.success) {
                        setQuestionBanks(response.data.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch question banks:', error);
                } finally {
                    setIsFetchingBanks(false);
                }
            };
            fetchBanks();
        }
    }, [isOpen]);

    useEffect(() => {
        if (preselectedBankId) {
            setSelectedBankId(preselectedBankId);
        }
    }, [preselectedBankId]);

    const handleSave = () => {
        if (selectedBankId) {
            onSave(selectedBankId);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl w-full max-w-md mx-4 p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Simpan Soal</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <p className="text-sm text-slate-500">
                    Anda akan menyimpan <span className="font-bold text-primary">{selectedCount} soal</span> ke Question Bank.
                </p>

                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Pilih Question Bank
                    </label>
                    {isFetchingBanks ? (
                        <div className="flex items-center justify-center h-12">
                            <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="relative">
                            <select
                                value={selectedBankId}
                                onChange={(e) => setSelectedBankId(e.target.value)}
                                className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="">Pilih Question Bank...</option>
                                {questionBanks.map(bank => (
                                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!selectedBankId || isLoading}
                        className="flex-1 px-4 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Simpan
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
