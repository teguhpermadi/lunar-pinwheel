import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAcademicYear } from '@/contexts/AcademicYearContext';
import { useAuth } from '@/contexts/AuthContext';
import { subjectApi, questionBankApi, Subject } from '@/lib/api';
import Swal from 'sweetalert2';
import { Skeleton } from '@/components/ui/skeleton';

const schema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    subject_id: z.string().min(1, 'Subject is required'),
});

type FormData = z.infer<typeof schema>;

export default function CreateQuestionBank() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { selectedYearId } = useAcademicYear();
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema)
    });

    useEffect(() => {
        const fetchSubjects = async () => {
            if (selectedYearId) {
                setIsSubjectsLoading(true);
                try {
                    const response = await subjectApi.getSubjects({
                        academic_year_id: selectedYearId,
                        per_page: 100 // Get all subjects
                    });
                    if (response.success) {
                        const result = response.data as any;
                        setSubjects(Array.isArray(result) ? result : (result.data || []));
                    }
                } catch (error) {
                    console.error("Failed to fetch subjects", error);
                } finally {
                    setIsSubjectsLoading(false);
                }
            }
        };
        fetchSubjects();
    }, [selectedYearId]);

    const onSubmit = async (data: FormData) => {
        if (!user || !selectedYearId) return;
        setIsLoading(true);
        try {
            const payload = {
                ...data,
                user_id: user.id,
            };

            const response = await questionBankApi.createQuestionBank(payload);
            if (response.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: 'Question Bank created successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
                // Redirect to Edit page to add questions
                navigate(`/admin/question-banks/${response.data.id}`);
            }
        } catch (error: any) {
            console.error(error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to create Question Bank'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark/50 h-full">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center gap-4">
                <Link to="/admin/question-banks" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-600 dark:text-slate-400">
                    <span className="material-symbols-outlined">arrow_back</span>
                </Link>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create Question Bank</h1>
            </header>

            <div className="max-w-2xl mx-auto p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Question Bank Name
                        </label>
                        <input
                            {...register('name')}
                            type="text"
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                            placeholder="e.g. Midterm Exam Mathematics"
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-500 font-bold">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                            Subject
                        </label>
                        {isSubjectsLoading ? (
                            <Skeleton className="w-full h-[50px] rounded-xl" />
                        ) : (
                            <select
                                {...register('subject_id')}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
                            >
                                <option value="">Select Subject</option>
                                {subjects.map(subject => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name} ({subject.code})
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.subject_id && (
                            <p className="mt-1 text-xs text-red-500 font-bold">{errors.subject_id.message}</p>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <span className="material-symbols-outlined animate-spin">refresh</span>
                            ) : (
                                <span className="material-symbols-outlined">save</span>
                            )}
                            Save & Continue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
