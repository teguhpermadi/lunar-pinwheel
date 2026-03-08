import React from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import { ReadingMaterial } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface ReadingMaterialSlideOverProps {
    isOpen: boolean;
    onClose: () => void;
    material: ReadingMaterial | null;
}

const ReadingMaterialSlideOver: React.FC<ReadingMaterialSlideOverProps> = ({
    isOpen,
    onClose,
    material
}) => {
    const pdfMedia = material?.media?.reading_materials?.[0];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60]"
                    />

                    {/* Side Panel */}
                    <motion.aside
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl z-[70] flex flex-col border-r border-slate-200 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="h-20 bg-white dark:bg-background-dark border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between z-30 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <FileText className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
                                        Material Preview
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                        Reference Content
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-white transition-all shadow-sm"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-slate-50/30 dark:bg-transparent">
                            {!material ? (
                                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                                    <FileText className="size-16" />
                                    <p className="font-bold uppercase tracking-widest text-xs">No material selected</p>
                                </div>
                            ) : (
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-8 leading-tight">
                                        {material.title}
                                    </h1>

                                    {pdfMedia ? (
                                        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center space-y-6 text-center shadow-sm">
                                            <div className="size-24 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                                                <FileText className="size-12" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">PDF Document Attached</h3>
                                                <p className="text-sm text-slate-500 mt-2 max-w-sm">
                                                    This material is stored as a PDF file. You can view the full document in a new tab for comfortable reading.
                                                </p>
                                            </div>
                                            <a
                                                href={pdfMedia.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200 dark:shadow-none"
                                            >
                                                <ExternalLink className="size-5" />
                                                <span>Open PDF in New Tab</span>
                                            </a>
                                        </div>
                                    ) : (
                                        <div
                                            className="prose prose-slate dark:prose-invert max-w-none 
                                            prose-headings:font-black prose-headings:tracking-tight 
                                            prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-lg
                                            prose-img:rounded-3xl prose-img:shadow-2xl prose-img:border prose-img:border-slate-100 dark:prose-img:border-slate-800"
                                            dangerouslySetInnerHTML={{ __html: material.content }}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer area if needed, maybe just a status indicator */}
                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-background-dark/50 flex items-center justify-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Reading Material Preview System</p>
                        </div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

export default ReadingMaterialSlideOver;
