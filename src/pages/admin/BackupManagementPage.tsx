import { useState, useRef } from 'react';
import { 
    HardDrive, 
    Upload, 
    Download, 
    Loader2, 
    CheckCircle2, 
    AlertTriangle,
    FileArchive,
    RotateCcw,
    FileJson
} from 'lucide-react';
import { backupAssetsApi } from '@/lib/api';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

interface ExamRestoreResult {
    examSessionId: string;
    examTitle: string;
    studentName: string;
    totalQuestions: number;
    restoredCount: number;
    skippedCount: number;
    newTotalScore: number;
    restoredAt: string;
}

interface ExamBackupPreview {
    examTitle: string;
    studentName: string;
    totalQuestions: number;
    pendingCount: number;
    answeredCount: number;
    exportedAt: string;
}

export default function BackupManagementPage() {
    const [loading, setLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [examRestoreLoading, setExamRestoreLoading] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [restoreResult, setRestoreResult] = useState<{ success: boolean; extracted_files: number } | null>(null);
    const [examRestoreResult, setExamRestoreResult] = useState<ExamRestoreResult | null>(null);
    const [examBackupPreview, setExamBackupPreview] = useState<ExamBackupPreview | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const examFileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3500);
    };

    const handleBackup = async () => {
        setLoading(true);
        try {
            const blob = await backupAssetsApi.backupAssets();
            const today = new Date().toISOString().split('T')[0];
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `assets_backup_${today}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            showToast('success', 'Backup downloaded successfully.');
        } catch (error: any) {
            console.error('Backup failed:', error);
            const message = error?.response?.data?.message || 'Failed to backup assets.';
            showToast('error', message);
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            showToast('error', 'Please select a ZIP file.');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.zip')) {
            showToast('error', 'Only ZIP files are allowed.');
            return;
        }

        setRestoreLoading(true);
        setRestoreResult(null);
        try {
            const res = await backupAssetsApi.restoreAssets(file);
            setRestoreResult(res.data);
            showToast('success', res.message || 'Assets restored successfully.');
        } catch (error: any) {
            console.error('Restore failed:', error);
            const message = error?.response?.data?.message || error?.response?.data?.errors?.file?.[0] || 'Failed to restore assets.';
            showToast('error', message);
        } finally {
            setRestoreLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleExamFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setExamBackupPreview(null);
            return;
        }

        if (!file.name.toLowerCase().endsWith('.json')) {
            showToast('error', 'Only JSON files are allowed.');
            setExamBackupPreview(null);
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            setExamBackupPreview({
                examTitle: data.examTitle || 'Unknown',
                studentName: data.studentName || 'Unknown',
                totalQuestions: data.totalQuestions || 0,
                pendingCount: data.pendingCount || 0,
                answeredCount: data.answeredCount || 0,
                exportedAt: data.exportedAt || new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to parse JSON:', error);
            showToast('error', 'Failed to read JSON file.');
            setExamBackupPreview(null);
        }
    };

    const handleExamRestore = async () => {
        const file = examFileInputRef.current?.files?.[0];
        if (!file) {
            showToast('error', 'Please select a JSON file.');
            return;
        }

        if (!examBackupPreview) {
            showToast('error', 'Please select a valid JSON file first.');
            return;
        }

        const result = await MySwal.fire({
            title: 'Konfirmasi Restore?',
            html: `
                <div style="text-align: left;">
                    <p>Anda akan me-restore jawaban untuk:</p>
                    <p style="margin: 10px 0;"><strong>Ujian:</strong> ${examBackupPreview.examTitle}</p>
                    <p style="margin: 10px 0;"><strong>Siswa:</strong> ${examBackupPreview.studentName}</p>
                    <p style="margin: 10px 0;"><strong>Total Soal:</strong> ${examBackupPreview.totalQuestions}</p>
                    <p style="margin: 10px 0;"><strong>Pending Sync:</strong> ${examBackupPreview.pendingCount}</p>
                    <hr style="margin: 15px 0; border-color: #ddd;" />
                    <p style="color: #d32f2f; font-weight: bold;">PERHATIAN: Semua jawaban yang ada akan DITIMPAS!</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Restore!',
            cancelButtonText: 'Batal',
            reverseButtons: true,
            width: '500px'
        });

        if (!result.isConfirmed) {
            return;
        }

        setExamRestoreLoading(true);
        setExamRestoreResult(null);
        try {
            const res = await backupAssetsApi.restoreExamAnswers(file);
            setExamRestoreResult(res.data);
            showToast('success', res.message || 'Exam answers restored successfully.');
            
            if (examFileInputRef.current) {
                examFileInputRef.current.value = '';
            }
            setExamBackupPreview(null);
        } catch (error: any) {
            console.error('Exam restore failed:', error);
            const message = error?.response?.data?.message || 'Failed to restore exam answers.';
            showToast('error', message);
        } finally {
            setExamRestoreLoading(false);
        }
    };

    return (
        <div className="p-6">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-in slide-in-from-right-5 fade-in duration-200
                    ${toast.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700'
                        : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'
                    }`}
                >
                    {toast.type === 'success'
                        ? <CheckCircle2 className="size-4 shrink-0" />
                        : <AlertTriangle className="size-4 shrink-0" />
                    }
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <HardDrive className="size-6 text-primary" />
                    Backup & Restore
                </h1>
                <p className="text-slate-500 mt-1">Manage and backup image assets, or restore exam answers from student backups.</p>
            </div>

            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Backup Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                            <Download className="size-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Backup Assets</h2>
                            <p className="text-sm text-slate-500">Download all assets as ZIP</p>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <FileArchive className="size-5 text-slate-400 mt-0.5" />
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                <p className="font-medium mb-1">What gets backed up:</p>
                                <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-1">
                                    <li>All files in <code className="text-xs bg-slate-200 dark:bg-slate-600 px-1.5 py-0.5 rounded">storage/app/public/</code></li>
                                    <li>Files organized by folder ID (e.g., 98/, 99/, 124/)</li>
                                    <li>Includes images, documents, and media files</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleBackup}
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="size-5 animate-spin" />
                                Preparing Backup...
                            </>
                        ) : (
                            <>
                                <Download className="size-5" />
                                Download Backup (ZIP)
                            </>
                        )}
                    </button>
                </div>

                {/* Restore Assets Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-12 rounded-xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center">
                            <Upload className="size-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Restore Assets</h2>
                            <p className="text-sm text-slate-500">Upload and restore from ZIP</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="size-5 text-amber-500 mt-0.5" />
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                <p className="font-medium mb-1 text-amber-700 dark:text-amber-400">Important notes:</p>
                                <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-1">
                                    <li>Restore <strong>adds</strong> files (does not delete existing)</li>
                                    <li>Existing files will be overwritten</li>
                                    <li>Only ZIP format is accepted</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {restoreResult && (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-3 mb-4">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                                <CheckCircle2 className="size-4" />
                                <span className="text-sm font-medium">
                                    Successfully restored {restoreResult.extracted_files} files.
                                </span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleRestore}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".zip"
                            className="w-full text-sm text-slate-500 dark:text-slate-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-xl file:border-0
                                file:text-sm file:font-medium
                                file:bg-slate-100 dark:file:bg-slate-700
                                file:text-slate-700 dark:file:text-slate-300
                                file:hover:bg-slate-200 dark:file:hover:bg-slate-600
                                file:cursor-pointer
                                mb-4"
                        />
                        <button
                            type="submit"
                            disabled={restoreLoading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {restoreLoading ? (
                                <>
                                    <Loader2 className="size-5 animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <Upload className="size-5" />
                                    Restore Assets
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Restore Exam Answers Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-700 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                            <RotateCcw className="size-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Restore Exam Answers</h2>
                            <p className="text-sm text-slate-500">Restore from student JSON backup</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="size-5 text-amber-500 mt-0.5" />
                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                <p className="font-medium mb-1 text-amber-700 dark:text-amber-400">Emergency Restore:</p>
                                <ul className="list-disc list-inside text-slate-500 dark:text-slate-400 space-y-1">
                                    <li>Use when students have sync issues</li>
                                    <li>Restore <strong>all answers</strong> from JSON backup</li>
                                    <li>Only for <strong>active</strong> sessions</li>
                                    <li>Only JSON format is accepted</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {examBackupPreview && (
                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3 mb-4">
                            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                                <FileJson className="size-4" />
                                <span className="text-sm font-semibold">Backup File Information</span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                                <p><strong>Exam:</strong> {examBackupPreview.examTitle}</p>
                                <p><strong>Student:</strong> {examBackupPreview.studentName}</p>
                                <p><strong>Total Questions:</strong> {examBackupPreview.totalQuestions}</p>
                                <p><strong>Pending Sync:</strong> {examBackupPreview.pendingCount}</p>
                                <p><strong>Exported:</strong> {new Date(examBackupPreview.exportedAt).toLocaleString()}</p>
                            </div>
                        </div>
                    )}

                    {examRestoreResult && (
                        <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-3 mb-4">
                            <div className="flex items-center gap-2 text-green-700 dark:text-green-400 mb-2">
                                <CheckCircle2 className="size-4" />
                                <span className="text-sm font-semibold">Restore Successful!</span>
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-300 space-y-1">
                                <p><strong>Exam:</strong> {examRestoreResult.examTitle}</p>
                                <p><strong>Student:</strong> {examRestoreResult.studentName}</p>
                                <p><strong>Restored:</strong> {examRestoreResult.restoredCount} answers</p>
                                <p><strong>Skipped:</strong> {examRestoreResult.skippedCount} questions</p>
                                <p><strong>New Score:</strong> {examRestoreResult.newTotalScore}</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <input
                            ref={examFileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleExamFileSelect}
                            className="w-full text-sm text-slate-500 dark:text-slate-400
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-xl file:border-0
                                file:text-sm file:font-medium
                                file:bg-amber-100 dark:file:bg-amber-800
                                file:text-amber-700 dark:file:text-amber-200
                                file:hover:bg-amber-200 dark:file:hover:bg-amber-700
                                file:cursor-pointer"
                        />
                        <button
                            onClick={handleExamRestore}
                            disabled={examRestoreLoading || !examBackupPreview}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {examRestoreLoading ? (
                                <>
                                    <Loader2 className="size-5 animate-spin" />
                                    Restoring...
                                </>
                            ) : (
                                <>
                                    <RotateCcw className="size-5" />
                                    Restore Exam Answers
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
