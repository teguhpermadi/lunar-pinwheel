import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Modal from '@/components/ui/modal';
import { QuestionBank, Subject, subjectApi, questionBankApi } from '@/lib/api';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

const settingsSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    subject_id: z.string().min(1, 'Subject is required'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface QuestionBankSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    bank: QuestionBank;
    onSaved: (updatedBank: QuestionBank) => void;
}

export default function QuestionBankSettingsModal({ isOpen, onClose, bank, onSaved }: QuestionBankSettingsModalProps) {
    const { selectedYearId } = useAcademicYear();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<SettingsFormData>({
        resolver: zodResolver(settingsSchema),
        defaultValues: {
            name: bank.name,
            subject_id: bank.subject_id,
        },
    });

    useEffect(() => {
        if (isOpen) {
            fetchSubjects();
            reset({
                name: bank.name,
                subject_id: bank.subject_id,
            });
        }
    }, [isOpen, bank, reset]);

    const fetchSubjects = async () => {
        setIsLoadingSubjects(true);
        try {
            const res = await subjectApi.getSubjects({ per_page: 100, academic_year_id: selectedYearId });
            if (res.success && res.data) {
                const subjectData = res.data.data || res.data;
                setSubjects(Array.isArray(subjectData) ? subjectData : []);
            }
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
        } finally {
            setIsLoadingSubjects(false);
        }
    };

    const onSubmit = async (data: SettingsFormData) => {
        try {
            const response = await questionBankApi.updateQuestionBank(bank.id, data);
            if (response.success) {
                onSaved(response.data);
                onClose();
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Settings saved successfully',
                    showConfirmButton: false,
                    timer: 2000,
                });
            } else {
                Swal.fire('Error', response.message || 'Failed to save settings', 'error');
            }
        } catch (error: any) {
            console.error('Failed to save settings:', error);
            if (error.response?.data?.errors) {
                Object.keys(error.response.data.errors).forEach((key) => {
                    const fieldName = key as keyof SettingsFormData;
                    if (['name', 'subject_id'].includes(fieldName)) {
                        setError(fieldName, {
                            type: 'server',
                            message: error.response.data.errors[key][0],
                        });
                    }
                });
            } else {
                setError('root', {
                    type: 'server',
                    message: error.response?.data?.message || 'An error occurred. Please try again.',
                });
            }
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Question Bank Settings">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {errors.root && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 text-sm rounded-xl border border-red-200 dark:border-red-800">
                        {errors.root.message}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        {...register('name')}
                        type="text"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                        placeholder="Question bank name"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Subject <span className="text-red-400">*</span>
                    </label>
                    <select
                        {...register('subject_id')}
                        disabled={isLoadingSubjects}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm disabled:opacity-50"
                    >
                        <option value="">Select Subject</option>
                        {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name} {subject.code ? `(${subject.code})` : ''}
                            </option>
                        ))}
                    </select>
                    {errors.subject_id && <p className="text-red-500 text-xs mt-1">{errors.subject_id.message}</p>}
                </div>

                {isLoadingSubjects && (
                    <div className="text-sm text-slate-400 text-center flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                        Loading subjects...
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting || isLoadingSubjects}
                        className="px-6 py-2 rounded-xl bg-primary text-white font-bold hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-sm">save</span>
                                Save Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
