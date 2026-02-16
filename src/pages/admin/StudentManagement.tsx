import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import StudentTable from '@/components/admin/student/StudentTable';
import StudentModal from '@/components/admin/student/StudentModal';
import { studentApi, Student } from '@/lib/api';

const MySwal = withReactContent(Swal);

const Toast = MySwal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

export default function StudentManagement() {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [pagination, setPagination] = useState({
        currentPage: 1,
        lastPage: 1,
        total: 0,
        from: 0,
        to: 0
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const fetchStudents = async (page = 1) => {
        setIsLoading(true);
        try {
            const response = await studentApi.getStudents({ page: page });
            if (response.success && response.data) {
                const result = response.data;
                setStudents(result.data || []);
                setPagination({
                    currentPage: result.meta?.current_page || result.current_page || 1,
                    lastPage: result.meta?.last_page || result.last_page || 1,
                    total: result.meta?.total || result.total || 0,
                    from: result.meta?.from || result.from || 0,
                    to: result.meta?.to || result.to || 0
                });
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error("Failed to fetch students:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.lastPage) {
            fetchStudents(newPage);
        }
    };

    const handleCreate = () => {
        setSelectedStudent(null);
        setIsModalOpen(true);
    };

    const handleEdit = (student: Student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const handleSave = async (data: any) => {
        try {
            if (selectedStudent) {
                await studentApi.updateStudent(selectedStudent.id, data);
                Toast.fire({
                    icon: 'success',
                    title: 'Student updated successfully'
                });
            } else {
                await studentApi.createStudent(data);
                Toast.fire({
                    icon: 'success',
                    title: 'Student created successfully'
                });
            }
            fetchStudents(pagination.currentPage);
        } catch (error) {
            console.error("Failed to save student:", error);
            Toast.fire({
                icon: 'error',
                title: 'Failed to save student'
            });
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await studentApi.deleteStudent(id);
                MySwal.fire(
                    'Deleted!',
                    'Student has been deleted.',
                    'success'
                );
                fetchStudents(pagination.currentPage);
            } catch (error) {
                console.error("Failed to delete student:", error);
                MySwal.fire(
                    'Error!',
                    'Failed to delete student.',
                    'error'
                );
            }
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        const result = await MySwal.fire({
            title: 'Are you sure?',
            text: `You are about to delete ${ids.length} students. This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete them!'
        });

        if (result.isConfirmed) {
            try {
                await studentApi.bulkDeleteStudents(ids);
                MySwal.fire(
                    'Deleted!',
                    `${ids.length} students have been deleted.`,
                    'success'
                );
                fetchStudents(pagination.currentPage);
            } catch (error) {
                console.error("Failed to delete students:", error);
                MySwal.fire(
                    'Error!',
                    'Failed to delete students.',
                    'error'
                );
            }
        }
    };

    const handleImport = async () => {
        const { value: file } = await MySwal.fire({
            title: 'Import Students',
            html: (
                <div className="flex flex-col gap-4 text-left">
                    <p className="text-sm text-gray-500">
                        Upload an Excel file to import students.
                        Please use the template to ensure correct format.
                    </p>
                    <button
                        onClick={async (e) => {
                            e.preventDefault();
                            try {
                                const blob = await studentApi.downloadTemplate();
                                const url = window.URL.createObjectURL(new Blob([blob]));
                                const link = document.createElement('a');
                                link.href = url;
                                link.setAttribute('download', 'students_template.xlsx');
                                document.body.appendChild(link);
                                link.click();
                                link.parentNode?.removeChild(link);
                                Toast.fire({ icon: 'success', title: 'Template downloaded' });
                            } catch (error) {
                                console.error("Download failed", error);
                                Toast.fire({ icon: 'error', title: 'Failed to download template' });
                            }
                        }}
                        className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        Download Template
                    </button>
                    <div className="border-t border-slate-200 pt-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Select File</label>
                        <input
                            id="swal-input-file"
                            type="file"
                            accept=".xlsx, .xls"
                            className="block w-full text-sm text-slate-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-full file:border-0
                                file:text-xs file:font-semibold
                                file:bg-primary file:text-white
                                hover:file:bg-primary/90"
                        />
                    </div>
                </div>
            ),
            showCancelButton: true,
            confirmButtonText: 'Import',
            showLoaderOnConfirm: true,
            preConfirm: () => {
                const input = document.getElementById('swal-input-file') as HTMLInputElement;
                const file = input?.files?.[0];
                if (!file) {
                    MySwal.showValidationMessage('Please select a file');
                }
                return file;
            },
            allowOutsideClick: () => !MySwal.isLoading()
        });

        if (file) {
            try {
                await studentApi.importStudents(file);
                MySwal.fire({
                    icon: 'success',
                    title: 'Import Successful',
                    text: 'Students have been imported successfully.'
                });
                fetchStudents(pagination.currentPage);
            } catch (error: any) {
                console.error("Import failed:", error);

                const responseData = error.response?.data;
                let errorMessage = responseData?.message || 'Failed to import students.';

                if (responseData?.errors) {
                    const validationErrors = responseData.errors;
                    if (Array.isArray(validationErrors)) {
                        errorMessage += '\n\n' + validationErrors.join('\n');
                    } else if (typeof validationErrors === 'object') {
                        errorMessage += '\n\n' + Object.values(validationErrors).flat().join('\n');
                    } else {
                        errorMessage += '\n\n' + String(validationErrors);
                    }
                }

                MySwal.fire({
                    icon: 'error',
                    title: 'Import Failed',
                    text: errorMessage,
                    customClass: {
                        popup: 'swal2-wide'
                    }
                });
            }
        }
    };

    const handleDownload = async () => {
        try {
            const blob = await studentApi.exportStudents();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'students.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 space-y-6 max-w-7xl mx-auto"
        >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Student Management</h2>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Manage student accounts, enrollments, and progress.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleImport}
                        className="px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg text-white">upload_file</span>
                        Import Excel
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">add</span>
                        New Student
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-bold hover:shadow-sm transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-lg">download</span>
                        Export
                    </button>
                </div>
            </div>

            <StudentTable
                students={students}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDelete}
                pagination={pagination}
                onPageChange={handlePageChange}
                onBulkDelete={handleBulkDelete}
            />

            <StudentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                student={selectedStudent}
                onSave={handleSave}
            />
        </motion.div>
    );
}
