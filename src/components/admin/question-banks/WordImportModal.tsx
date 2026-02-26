import { useState } from 'react';
import Modal from '@/components/ui/modal';
import { questionApi } from '@/lib/api';
import Swal from 'sweetalert2';

interface WordImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    questionBankId: string;
    onImportSuccess: () => void;
}

export default function WordImportModal({ isOpen, onClose, questionBankId, onImportSuccess }: WordImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const blob = await questionApi.downloadImportTemplate();
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template_import_soal.docx');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            Swal.fire('Error', 'Failed to download template', 'error');
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);
        try {
            const response = await questionApi.importWord(questionBankId, file);
            if (response.success) {
                Swal.fire('Import Successful', `Imported ${response.data.total_imported} questions.`, 'success');
                onImportSuccess();
                onClose();
                setFile(null);
            } else {
                Swal.fire('Import Failed', response.message || 'Check your file format', 'error');
            }
        } catch (error: any) {
            Swal.fire('Import Failed', error.response?.data?.message || 'Failed to upload file.', 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Import from Word">
            <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-bold">Instructions:</p>
                    <ol className="list-decimal pl-4">
                        <li>Download template</li>
                        <li>Follow table structure</li>
                        <li>Upload .docx</li>
                    </ol>
                </div>
                <div className="flex justify-center">
                    <button onClick={handleDownloadTemplate} className="px-4 py-2 border rounded-xl text-sm flex items-center gap-2">
                        <span className="material-symbols-outlined">download</span> Download Template
                    </button>
                </div>
                <div className="space-y-2">
                    <input type="file" accept=".docx" onChange={handleFileChange} />
                </div>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm">Cancel</button>
                    <button onClick={handleUpload} disabled={!file || isUploading} className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold disabled:opacity-50">
                        {isUploading ? 'Importing...' : 'Start Import'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
