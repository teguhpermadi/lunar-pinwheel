import { useState, useEffect } from 'react';
import { examApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface DistractorDetail {
    option_id: string;
    chosen_all: number;
    chosen_top: number;
    chosen_bottom: number;
    is_functional: boolean;
}

interface ItemAnalysisData {
    question_id: string;
    question_number: number;
    question_type: string;
    content: string;
    difficulty: {
        score: number;
        category: string; // 'Mudah' | 'Sedang' | 'Sukar'
    };
    discrimination: {
        score: number;
        category: string; // 'Jelek' | 'Cukup' | 'Baik' | 'Sangat Baik'
    };
    distractor: {
        status: string; // "Tidak Berlaku" | "Sangat Baik" | "Berfungsi" | "Kurang Berfungsi"
        details: DistractorDetail[];
    };
    conclusion: {
        status: string; // "Diterima" | "Direvisi" | "Ditolak"
        recommendation: string;
    };
}

interface ItemAnalysisResponse {
    exam_id: string;
    total_students: number;
    top_group_size: number;
    bottom_group_size: number;
    summary: {
        total_questions: number;
        accepted: number;
        revised: number;
        rejected: number;
        general_recommendation: string;
    };
    item_analysis: ItemAnalysisData[];
}

interface ItemAnalysisTabProps {
    examId: string;
}

export default function ItemAnalysisTab({ examId }: ItemAnalysisTabProps) {
    const [data, setData] = useState<ItemAnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAnalysis = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await examApi.getItemAnalysis(examId);
                if (response.success && response.data) {
                    setData(response.data);
                } else {
                    setError('Gagal memuat data telaah soal.');
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Gagal memuat data telaah soal.');
            } finally {
                setIsLoading(false);
            }
        };

        if (examId) {
            fetchAnalysis();
        }
    }, [examId]);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 md:p-8">
                <div className="flex flex-col gap-4">
                    <Skeleton className="h-8 w-1/3 rounded-xl mb-4" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                    <Skeleton className="h-14 w-full rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="size-16 rounded-3xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-6 border border-rose-100 dark:border-rose-500/20">
                    <span className="material-symbols-outlined text-3xl text-rose-500">error</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Telaah Soal Gagal</h3>
                <p className="text-slate-500 text-center max-w-sm">{error}</p>
            </div>
        );
    }

    if (!data || data.item_analysis.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-8 flex flex-col items-center justify-center min-h-[400px]">
                <div className="size-16 rounded-3xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-700">
                    <span className="material-symbols-outlined text-3xl text-slate-400">analytics</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Belum Ada Data</h3>
                <p className="text-slate-500 text-center max-w-sm">Data telaah soal belum tersedia atau tidak cukup siswa yang telah menyelesaikan ujian.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Info Banner */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex-1">
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                        <span className="material-symbols-outlined text-3xl">analytics</span>
                        Analisis Butir Soal (Klasikal)
                    </h2>
                    <p className="opacity-90 max-w-2xl text-sm leading-relaxed mb-6">
                        Data ini membantu mengevaluasi kualitas instrumen tes. Berdasarkan jawaban {data.total_students} upaya siswa yang telah dikoreksi.
                    </p>

                    {/* Ringkasan Kesimpulan */}
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/20 inline-block w-full max-w-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-2">Kesimpulan Ujian</p>
                        <p className="text-sm md:text-base font-medium leading-relaxed mb-4">
                            {data.summary.general_recommendation}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="size-2.5 rounded-full bg-emerald-400 shrink-0 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">{data.summary.accepted} Diterima</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-2.5 rounded-full bg-amber-400 shrink-0 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div>
                                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">{data.summary.revised} Direvisi</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-2.5 rounded-full bg-rose-400 shrink-0 shadow-[0_0_8px_rgba(251,113,133,0.5)]"></div>
                                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">{data.summary.rejected} Ditolak</span>
                            </div>
                            <div className="hidden sm:block w-px h-5 bg-white/20 ml-auto"></div>
                            <div className="ml-auto sm:ml-0 text-right">
                                <span className="text-xs font-bold text-white/70">Total Ujian: {data.summary.total_questions} Soal</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-4 relative z-10 shrink-0 mt-2 md:mt-0">
                    <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-3xl border border-white/20 text-center flex-1 md:flex-auto flex justify-center flex-col items-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Total Sampel</p>
                        <p className="text-2xl font-black">{data.total_students} <span className="text-xs sm:text-sm font-normal opacity-80 block sm:inline">upaya siswa</span></p>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-3xl border border-white/20 text-center flex-1 md:flex-auto flex justify-center flex-col items-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Keputusan Ekstrim</p>
                        <p className="text-2xl font-black">{data.top_group_size} <span className="text-xs sm:text-sm font-normal opacity-80 block sm:inline">siswa (27%)</span></p>
                    </div>
                </div>
            </div>

            {/* Analysis Data */}
            <div className="space-y-4">
                {data.item_analysis.map((item) => (
                    <div id={`analysis-question-${item.question_id}`} key={item.question_id} className={cn(
                        "border rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow",
                        item.conclusion.status === 'Direvisi'
                            ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/40"
                            : item.conclusion.status === 'Ditolak'
                                ? "bg-rose-50/50 dark:bg-rose-900/10 border-rose-200/60 dark:border-rose-800/40"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                    )}>
                        <div className="flex flex-col gap-5">

                            {/* Question Info & Content */}
                            <div className="flex flex-col border-b border-slate-100 dark:border-slate-800 pb-5">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                                        {item.question_number}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Tipe Soal</p>
                                        <p className="text-xs font-black text-slate-700 dark:text-slate-300 capitalize">{item.question_type.replace(/_/g, ' ')}</p>
                                    </div>
                                    <div className="ml-auto flex items-center">
                                        <span className={cn(
                                            "px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-xl border",
                                            item.conclusion.status === 'Diterima' ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800" :
                                                item.conclusion.status === 'Direvisi' ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800" :
                                                    "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800"
                                        )}>
                                            {item.conclusion.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-600 dark:text-slate-400 prose dark:prose-invert max-w-none prose-p:my-1 line-clamp-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl" dangerouslySetInnerHTML={{ __html: item.content || '<em>[Tanpa Konten]</em>' }} />
                            </div>

                            {/* Metrics Columns */}
                            <div className="flex flex-col md:flex-row gap-4">

                                {/* Keterangan / Rekomendasi */}
                                <div className="flex-[2] bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-2xl flex flex-col justify-center min-h-[100px]">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-blue-500/70 dark:text-blue-400/70 mb-2">Keterangan / Rekomendasi</p>
                                    <div className="flex gap-3 items-start">
                                        <span className="material-symbols-outlined text-blue-500 text-xl shrink-0">lightbulb</span>
                                        <p className="text-sm text-blue-800 dark:text-blue-300 font-medium leading-relaxed italic">{item.conclusion.recommendation}</p>
                                    </div>
                                </div>

                                {/* Kesukaran (P) */}
                                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-center flex flex-col justify-center relative overflow-hidden">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 relative z-10">Tingkat Kesukaran (P)</p>
                                    <p className="text-3xl font-black text-slate-800 dark:text-white mb-1 relative z-10">{item.difficulty.score.toFixed(2)}</p>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider mx-auto relative z-10",
                                        item.difficulty.category === 'Sedang' ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300" :
                                            item.difficulty.category === 'Mudah' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" :
                                                "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
                                    )}>
                                        {item.difficulty.category}
                                    </span>
                                </div>

                                {/* Daya Beda (D) */}
                                <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-center flex flex-col justify-center relative overflow-hidden">
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 relative z-10">Daya Beda (D)</p>
                                    <p className="text-3xl font-black text-slate-800 dark:text-white mb-1 relative z-10">{item.discrimination.score.toFixed(2)}</p>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider mx-auto relative z-10",
                                        ['Sangat Baik', 'Baik'].includes(item.discrimination.category) ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" :
                                            item.discrimination.category === 'Cukup' ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" :
                                                "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300"
                                    )}>
                                        {item.discrimination.category}
                                    </span>
                                </div>

                                {/* Pengecoh (Optional for MC) */}
                                {item.question_type === 'multiple_choice' && (
                                    <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 text-center flex flex-col justify-center relative overflow-hidden">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 relative z-10">Efektivitas Pengecoh</p>
                                        <span className={cn(
                                            "material-symbols-outlined text-3xl mb-1 relative z-10",
                                            ['Sangat Baik', 'Berfungsi'].includes(item.distractor.status) ? "text-emerald-500" : "text-rose-500"
                                        )}>
                                            {['Sangat Baik', 'Berfungsi'].includes(item.distractor.status) ? 'rule' : 'warning'}
                                        </span>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider mx-auto relative z-10",
                                            ['Sangat Baik', 'Berfungsi'].includes(item.distractor.status) ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                                        )}>
                                            {item.distractor.status}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
