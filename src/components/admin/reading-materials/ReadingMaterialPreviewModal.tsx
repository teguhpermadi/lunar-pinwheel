import React from 'react';
import { X, Pencil, FileText, ExternalLink } from 'lucide-react';
import { ReadingMaterial } from '@/lib/api';

interface ReadingMaterialPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    material: ReadingMaterial | null;
    onEdit?: (materialId: string) => void;
}

const ReadingMaterialPreviewModal: React.FC<ReadingMaterialPreviewModalProps> = ({
    isOpen,
    onClose,
    material,
    onEdit
}) => {
    if (!isOpen || !material) return null;

    const pdfMedia = material.media?.reading_materials?.[0];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText className="size-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                                {material.title}
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">
                                Reading Material Preview
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <button
                                onClick={() => onEdit(material.id)}
                                className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-primary transition-all flex items-center gap-2 px-4 text-sm font-semibold"
                            >
                                <Pencil className="size-4" />
                                <span>Edit</span>
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition-all"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {pdfMedia ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-6 py-12">
                            <div className="size-24 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                <FileText className="size-12" />
                            </div>
                            <div className="text-center">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">PDF Document Attached</h3>
                                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                                    This material is stored as a PDF file. You can view it by clicking the button below.
                                </p>
                            </div>
                            <a
                                href={pdfMedia.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                            >
                                <ExternalLink className="size-5" />
                                <span>View PDF Document</span>
                            </a>
                        </div>
                    ) : (
                        <div
                            className="prose prose-slate dark:prose-invert max-w-none 
                            prose-headings:font-bold prose-p:text-slate-600 dark:prose-p:text-slate-300
                            prose-img:rounded-2xl prose-img:shadow-lg prose-img:border prose-img:border-slate-100 dark:prose-img:border-slate-800"
                            dangerouslySetInnerHTML={{ __html: material.content }}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 px-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700 transition-all"
                    >
                        Close Preview
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReadingMaterialPreviewModal;
