import { useState, useRef, useEffect } from 'react';
import { readingMaterialApi, questionApi, ReadingMaterial } from '@/lib/api';
import Swal from 'sweetalert2';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, FileText, ChevronDown, Check, X } from 'lucide-react';

interface ReadingMaterialSelectorProps {
    questionId?: string;
    initialMaterialId?: string | null;
    onMaterialChange?: (newMaterialId: string | null) => void;
    availableMaterials?: ReadingMaterial[];
    disabled?: boolean;
    questionBankId?: string;
}

export default function ReadingMaterialSelector({
    questionId,
    initialMaterialId,
    onMaterialChange,
    availableMaterials = [],
    disabled = false,
    manual = false,
    questionBankId
}: ReadingMaterialSelectorProps & { manual?: boolean }) {
    const [selectedId, setSelectedId] = useState<string | null>(initialMaterialId || null);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchedMaterials, setFetchedMaterials] = useState<ReadingMaterial[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch materials if not provided and not disabled
    useEffect(() => {
        if ((!availableMaterials || availableMaterials.length === 0) && !disabled) {
            if (!questionBankId) {
                setFetchedMaterials([]);
                return;
            }
            const fetchMaterials = async () => {
                setIsLoading(true);
                try {
                    const response = await readingMaterialApi.getMaterials({
                        per_page: 100,
                        question_bank_id: questionBankId
                    });
                    if (response.success) {
                        // Support both paginated response.data.data and direct response.data
                        const data = response.data?.data || response.data;
                        setFetchedMaterials(Array.isArray(data) ? data : []);
                    }
                } catch (error) {
                    console.error("Failed to fetch materials in selector", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMaterials();
        }
    }, [availableMaterials?.length, disabled, questionBankId]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync prop changes
    useEffect(() => {
        setSelectedId(initialMaterialId || null);
    }, [initialMaterialId]);

    const handleSelect = async (newMaterialId: string | null) => {
        if (newMaterialId === selectedId) {
            setIsOpen(false);
            return;
        }

        if (manual) {
            setSelectedId(newMaterialId);
            setIsOpen(false);
            if (onMaterialChange) {
                onMaterialChange(newMaterialId);
            }
            return;
        }

        const oldId = selectedId;
        setSelectedId(newMaterialId);
        setIsOpen(false);
        setIsLoading(true);

        try {
            if (!questionId) throw new Error("Question ID is required");
            const response = await questionApi.updateQuestion(questionId, { reading_material_id: newMaterialId });

            if (response.success) {
                if (onMaterialChange) {
                    onMaterialChange(newMaterialId);
                }

                const Toast = Swal.mixin({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });
                Toast.fire({
                    icon: 'success',
                    title: 'Material updated'
                });
            } else {
                throw new Error(response.message || 'Failed to update');
            }
        } catch (error) {
            console.error("Failed to update material", error);
            setSelectedId(oldId); // Revert
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Failed to update material',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setIsLoading(false);
        }
    };

    const materials = Array.isArray(availableMaterials) && availableMaterials.length > 0
        ? availableMaterials
        : (Array.isArray(fetchedMaterials) ? fetchedMaterials : []);
    const selectedMaterial = materials.find(m => m.id === selectedId);

    return (
        <div className="relative inline-block" ref={containerRef}>
            <button
                type="button"
                onClick={() => !isLoading && !disabled && setIsOpen(!isOpen)}
                className={`
                    group relative flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all duration-200 outline-none
                    ${selectedId
                        ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                        : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800'}
                    ${disabled ? 'opacity-80 cursor-default' : 'hover:border-primary/30 cursor-pointer'}
                    ${isLoading ? 'opacity-70 cursor-wait' : ''}
                    ${isOpen ? 'ring-2 ring-offset-1 ring-primary/20 dark:ring-offset-slate-900' : ''}
                `}
                disabled={isLoading || disabled}
                title={selectedId ? `Attached to: ${selectedMaterial?.title}` : 'No reading material'}
            >
                {isLoading ? (
                    <Loader2 className="size-[14px] animate-spin" />
                ) : (
                    <FileText className="size-[14px]" />
                )}
                <span className="max-w-[120px] truncate">
                    {selectedId ? selectedMaterial?.title || 'Selected Material' : 'No Material'}
                </span>
                {!disabled && (
                    <ChevronDown className={`size-[14px] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                )}
            </button>

            <AnimatePresence>
                {isOpen && !disabled && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute z-50 top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/50 overflow-hidden"
                    >
                        <div className="p-1 max-h-60 overflow-y-auto custom-scrollbar">
                            <button
                                onClick={() => handleSelect(null)}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors
                                    ${!selectedId
                                        ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2">
                                    <X className="size-[14px]" />
                                    <span>None (Clear)</span>
                                </div>
                                {!selectedId && (
                                    <Check className="size-[14px] text-primary" />
                                )}
                            </button>

                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1"></div>

                            {materials.length > 0 ? (
                                materials.map((material) => {
                                    const isActive = material.id === selectedId;
                                    return (
                                        <button
                                            key={material.id}
                                            onClick={() => handleSelect(material.id)}
                                            className={`
                                                w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left
                                                ${isActive
                                                    ? 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white'
                                                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <FileText className="size-[14px] shrink-0" />
                                                <span className="truncate">{material.title}</span>
                                            </div>
                                            {isActive && (
                                                <Check className="size-[14px] text-primary shrink-0" />
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="px-3 py-4 text-center">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">No materials available</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
