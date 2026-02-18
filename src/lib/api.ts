import axios from 'axios';
import { z } from 'zod';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api/v1';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Common Interfaces ---

export interface PaginationMeta {
    current_page: number;
    from: number | null;
    last_page: number;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    path: string | null;
    per_page: number;
    to: number | null;
    total: number;
}

export interface PaginationLinks {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: T[];
    meta: PaginationMeta;
    links: PaginationLinks;
}

export interface SingleResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

export interface ActionResponse {
    success: boolean;
    message: string;
    data: null | any;
}

// --- Auth & User ---

export interface User {
    id: string;
    name: string;
    username?: string;
    email: string;
    avatar?: string;
    role?: 'admin' | 'teacher' | 'student'; // Mapped from user_type logic if needed, or check backend
    user_type?: string;
    email_verified_at?: string;
    created_at: string;
    updated_at: string;
}

export interface LoginRequest {
    email: string;
    password: string;
    remember?: boolean;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
}

export interface ResendVerificationRequest {
    email: string;
}

export const LoginSchema = z.object({
    email: z.string().min(1, 'Email or Username is required'),
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().optional(),
});

export const RegisterSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(1, 'Confirm Password is required'),
}).refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
});

export const authApi = {
    login: async (data: LoginRequest) => {
        const response = await api.post('/login', data);
        return response.data;
    },
    register: async (data: RegisterRequest) => {
        const response = await api.post('/register', data);
        return response.data;
    },
    logout: async () => {
        const response = await api.post('/logout');
        return response.data;
    },
    getUserProfile: async () => {
        const response = await api.get('/me');
        return response.data;
    },
    forgotPassword: async (data: ForgotPasswordRequest) => {
        const response = await api.post('/forgot-password', data);
        return response.data;
    },
    resetPassword: async (data: ResetPasswordRequest) => {
        const response = await api.post('/reset-password', data);
        return response.data;
    },
    verifyEmail: async (id: string, hash: string) => {
        const response = await api.post(`/email/verify/${id}/${hash}`);
        return response.data;
    },
    resendVerification: async (data: ResendVerificationRequest) => {
        const response = await api.post('/email/resend', data);
        return response.data;
    }
};

// --- Academic Resources ---

export interface AcademicYear {
    id: string;
    year: string;
    semester: string;
    user_id?: string; // integer in request, string/ulid in resource? Check schema.
    // Schema says user_id is integer in StoreRequest but user object in Resource.
    // However, usually IDs are strings in this app (ULID). 
    // Wait, StoreAcademicYearRequest: user_id: integer. This implies user IDs are integers?
    // UserResource id: string. This is a mismatch in api.json or implementation.
    // I will assume ID strings for frontend compatibility with ULIDs.
    user?: User;
    created_at: string;
    updated_at: string;
}

export interface Classroom {
    id: string;
    name: string;
    code: string;
    level: string;
    user_id?: string;
    academic_year_id: string;
    user?: User;
    academic_year?: AcademicYear;
    students_count?: number;
    students?: User[];
    created_at: string;
    updated_at: string;
}

export interface StoreClassroomRequest {
    name: string;
    code?: string | null;
    level: string;
    user_id?: string | null;
    academic_year_id: string;
}

export interface UpdateClassroomRequest {
    name?: string;
    code?: string;
    level?: string;
    user_id?: string | null;
    academic_year_id?: string;
}

// Re-using User for Teacher/Student if they share structure, or defining specific if they differ
export interface Teacher extends User {
    subjects?: Subject[];
}

export interface Student extends User {
    // Student specific fields if any
}

export const academicYearApi = {
    getAcademicYears: async (params?: any) => {
        const response = await api.get('/academic-years', { params });
        return response.data;
    },
    getAcademicYear: async (id: string) => {
        const response = await api.get(`/academic-years/${id}`);
        return response.data;
    },
    createAcademicYear: async (data: any) => {
        const response = await api.post('/academic-years', data);
        return response.data;
    },
    updateAcademicYear: async (id: string, data: any) => {
        const response = await api.put(`/academic-years/${id}`, data);
        return response.data;
    },
    deleteAcademicYear: async (id: string) => {
        const response = await api.delete(`/academic-years/${id}`);
        return response.data;
    },
    bulkDeleteAcademicYears: async (ids: string[], force = false) => {
        const response = await api.post('/academic-years/bulk-delete', { ids, force });
        return response.data;
    },
    bulkUpdateAcademicYears: async (data: any) => {
        const response = await api.post('/academic-years/bulk-update', data);
        return response.data;
    },
    getTrashed: async (params?: any) => {
        const response = await api.get('/academic-years/trashed', { params });
        return response.data;
    },
    restore: async (id: string) => {
        const response = await api.post(`/academic-years/${id}/restore`);
        return response.data;
    },
    forceDelete: async (id: string) => {
        const response = await api.delete(`/academic-years/${id}/force-delete`);
        return response.data;
    }
};

export const classroomApi = {
    getClassrooms: async (params?: any) => {
        const response = await api.get('/classrooms', { params });
        return response.data;
    },
    getClassroom: async (id: string) => {
        const response = await api.get(`/classrooms/${id}`);
        return response.data;
    },
    createClassroom: async (data: StoreClassroomRequest) => {
        const response = await api.post('/classrooms', data);
        return response.data;
    },
    updateClassroom: async (id: string, data: UpdateClassroomRequest) => {
        const response = await api.put(`/classrooms/${id}`, data);
        return response.data;
    },
    deleteClassroom: async (id: string) => {
        const response = await api.delete(`/classrooms/${id}`);
        return response.data;
    },
    bulkDeleteClassrooms: async (ids: string[], force = false) => {
        const response = await api.post('/classrooms/bulk-delete', { ids, force });
        return response.data;
    },
    bulkUpdateClassrooms: async (data: any) => {
        const response = await api.post('/classrooms/bulk-update', data);
        return response.data;
    },
    getTrashed: async (params?: any) => {
        const response = await api.get('/classrooms/trashed', { params });
        return response.data;
    },
    restore: async (id: string) => {
        const response = await api.post(`/classrooms/${id}/restore`);
        return response.data;
    },
    forceDelete: async (id: string) => {
        const response = await api.delete(`/classrooms/${id}/force-delete`);
        return response.data;
    },
    getMyClassrooms: async (params?: any) => {
        const response = await api.get('/classrooms/mine', { params });
        return response.data;
    },
    syncStudents: async (classroomId: string, studentIds: string[], academicYearId: string) => {
        const response = await api.post(`/classrooms/${classroomId}/sync`, {
            student_ids: studentIds,
            academic_year_id: academicYearId
        });
        return response.data;
    }
};

export const teacherApi = {
    getTeachers: async (params?: any) => {
        const response = await api.get('/teachers', { params });
        return response.data;
    },
    getTeacher: async (id: string) => {
        const response = await api.get(`/teachers/${id}`);
        return response.data;
    },
    createTeacher: async (data: any) => {
        const response = await api.post('/teachers', data);
        return response.data;
    },
    updateTeacher: async (id: string, data: any) => {
        const response = await api.put(`/teachers/${id}`, data);
        return response.data;
    },
    deleteTeacher: async (id: string) => {
        const response = await api.delete(`/teachers/${id}`);
        return response.data;
    },
    bulkDeleteTeachers: async (ids: string[], force = false) => {
        const response = await api.post('/teachers/bulk-delete', { ids, force });
        return response.data;
    },
    bulkUpdateTeachers: async (data: any) => {
        const response = await api.post('/teachers/bulk-update', data);
        return response.data;
    },
    getTrashed: async (params?: any) => {
        const response = await api.get('/teachers/trashed', { params });
        return response.data;
    },
    restore: async (id: string) => {
        const response = await api.post(`/teachers/${id}/restore`);
        return response.data;
    },
    forceDelete: async (id: string) => {
        const response = await api.delete(`/teachers/${id}/force-delete`);
        return response.data;
    },
    importTeachers: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/teachers/import', formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },
    downloadTemplate: async () => {
        const response = await api.get('/teachers/export/template', { responseType: 'blob' });
        return response.data;
    }
};

export const studentApi = {
    getStudents: async (params?: any) => {
        const response = await api.get('/students', { params });
        return response.data;
    },
    getStudent: async (id: string) => {
        const response = await api.get(`/students/${id}`);
        return response.data;
    },
    createStudent: async (data: any) => {
        const response = await api.post('/students', data);
        return response.data;
    },
    updateStudent: async (id: string, data: any) => {
        const response = await api.put(`/students/${id}`, data);
        return response.data;
    },
    deleteStudent: async (id: string) => {
        const response = await api.delete(`/students/${id}`);
        return response.data;
    },
    bulkDeleteStudents: async (ids: string[], force = false) => {
        const response = await api.post('/students/bulk-delete', { ids, force });
        return response.data;
    },
    bulkUpdateStudents: async (data: any) => {
        const response = await api.post('/students/bulk-update', data);
        return response.data;
    },
    getTrashed: async (params?: any) => {
        const response = await api.get('/students/trashed', { params });
        return response.data;
    },
    restore: async (id: string) => {
        const response = await api.post(`/students/${id}/restore`);
        return response.data;
    },
    forceDelete: async (id: string) => {
        const response = await api.delete(`/students/${id}/force-delete`);
        return response.data;
    },
    importStudents: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/students/import', formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    },
    downloadTemplate: async () => {
        const response = await api.get('/students/export/template', { responseType: 'blob' });
        return response.data;
    },
    getAvailable: async (params?: any) => {
        const response = await api.get('/students/available', { params });
        return response.data;
    },
    getExamResults: async (params?: any) => {
        const response = await api.get('/students/exam-results', { params });
        return response.data;
    },
    getStudentExams: async (params?: any) => {
        const response = await api.get('/students/exams', { params });
        return response.data;
    },
    startExam: async (id: string) => {
        const response = await api.post(`/students/exams/${id}/start`);
        return response.data;
    },
    takeExam: async (id: string) => {
        const response = await api.get(`/students/exams/${id}/take`);
        return response.data;
    },
    answerQuestion: async (id: string, data: any) => {
        const response = await api.post(`/students/exams/${id}/answer`, data);
        return response.data;
    },
    finishExam: async (id: string) => {
        const response = await api.post(`/students/exams/${id}/finish`);
        return response.data;
    }
};

// --- Assessment Resources ---

export interface Subject {
    id: string;
    name: string;
    code?: string;
    description?: string;
    image_url?: string;
    logo_url?: string;
    color?: string;
    class_name?: string;
    user_id: string;
    academic_year_id: string;
    classroom_id: string;
    user?: User;
    academic_year?: AcademicYear;
    classroom?: Classroom;
    created_at: string;
    updated_at: string;
}

export const subjectApi = {
    getSubjects: async (params?: any) => {
        const response = await api.get('/subjects', { params });
        return response.data;
    },
    getSubject: async (id: string) => {
        const response = await api.get(`/subjects/${id}`);
        return response.data;
    },
    createSubject: async (data: any) => {
        const response = await api.post('/subjects', data);
        return response.data;
    },
    updateSubject: async (id: string, data: any) => {
        const response = await api.put(`/subjects/${id}`, data);
        return response.data;
    },
    deleteSubject: async (id: string) => {
        const response = await api.delete(`/subjects/${id}`);
        return response.data;
    },
    bulkDeleteSubjects: async (ids: string[], force = false) => {
        const response = await api.post('/subjects/bulk-delete', { ids, force });
        return response.data;
    },
    bulkUpdateSubjects: async (data: any) => {
        const response = await api.post('/subjects/bulk-update', data);
        return response.data;
    },
    getTrashed: async (params?: any) => {
        const response = await api.get('/subjects/trashed', { params });
        return response.data;
    },
    restore: async (id: string) => {
        const response = await api.post(`/subjects/${id}/restore`);
        return response.data;
    },
    forceDelete: async (id: string) => {
        const response = await api.delete(`/subjects/${id}/force-delete`);
        return response.data;
    },
    getMySubjects: async (params?: any) => {
        const response = await api.get('/subjects/mine', { params });
        return response.data;
    }
};

export interface QuestionBank {
    id: string;
    name: string;
    subject_id: string;
    user_id: string;
    questions_count?: number;
    created_at: string;
    updated_at: string;
}

export const questionBankApi = {
    getQuestionBanks: async (params?: any) => {
        const response = await api.get('/question-banks', { params });
        return response.data;
    },
    getQuestionBank: async (id: string) => {
        const response = await api.get(`/question-banks/${id}`);
        return response.data;
    },
    createQuestionBank: async (data: any) => {
        const response = await api.post('/question-banks', data);
        return response.data;
    },
    updateQuestionBank: async (id: string, data: any) => {
        const response = await api.put(`/question-banks/${id}`, data);
        return response.data;
    },
    deleteQuestionBank: async (id: string) => {
        const response = await api.delete(`/question-banks/${id}`);
        return response.data;
    },
    getTrashed: async (params?: any) => {
        const response = await api.get('/question-banks/trashed', { params });
        return response.data;
    },
    restore: async (id: string) => {
        const response = await api.post(`/question-banks/${id}/restore`);
        return response.data;
    },
    forceDelete: async (id: string) => {
        const response = await api.delete(`/question-banks/${id}/force-delete`);
        return response.data;
    },
    importQuestions: async (id: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post(`/question-banks/${id}/import`, formData, {
            headers: { 'Content-Type': undefined },
        });
        return response.data;
    }
};

export interface QuestionOption {
    id: string;
    question_id: string;
    option_key: string;
    content: string;
    order: number;
    is_correct: boolean;
    media?: { option_media?: string };
}

export interface Question {
    id: string;
    content: string;
    type: string;
    difficulty: string;
    timer: number;
    score: number;
    hint?: string;
    tags?: string; // or array? Schema says string for QuestionResource, array in StoreRequest? Resource: tags: string.
    media?: { content?: string };
    options?: QuestionOption[];
    created_at: string;
    updated_at: string;
}

export const questionApi = {
    getQuestions: async (params?: any) => {
        const response = await api.get('/questions', { params });
        return response.data;
    },
    getQuestion: async (id: string) => {
        const response = await api.get(`/questions/${id}`);
        return response.data;
    },
    createQuestion: async (data: any) => {
        const response = await api.post('/questions', data);
        return response.data;
    },
    updateQuestion: async (id: string, data: any) => {
        const response = await api.put(`/questions/${id}`, data);
        return response.data;
    },
    deleteQuestion: async (id: string) => {
        const response = await api.delete(`/questions/${id}`);
        return response.data;
    },
    bulkDeleteQuestions: async (ids: string[], force = false) => {
        const response = await api.post('/questions/bulk-delete', { ids, force });
        return response.data;
    },
    bulkUpdateQuestions: async (data: any) => {
        const response = await api.post('/questions/bulk-update', data);
        return response.data;
    },
    getTrashed: async (params?: any) => {
        const response = await api.get('/questions/trashed', { params });
        return response.data;
    },
    restore: async (id: string) => {
        const response = await api.post(`/questions/${id}/restore`);
        return response.data;
    },
    forceDelete: async (id: string) => {
        const response = await api.delete(`/questions/${id}/force-delete`);
        return response.data;
    },
    deleteMedia: async (id: string, mediaId: string) => {
        const response = await api.delete(`/questions/${id}/media/${mediaId}`);
        return response.data;
    }
};

export interface Exam {
    id: string;
    title: string;
    type: string;
    duration: number;
    description?: string;
    start_time?: string;
    end_time?: string;
    is_published: boolean;
    token?: string;
    subject?: Subject;
    academic_year?: AcademicYear;
    user?: User;
    created_at: string;
    updated_at: string;
    // Add other fields from ExamResource
}

export const examApi = {
    getExams: async (params?: any) => {
        const response = await api.get('/exams', { params });
        return response.data;
    },
    getExam: async (id: string) => {
        const response = await api.get(`/exams/${id}`);
        return response.data;
    },
    createExam: async (data: any) => {
        const response = await api.post('/exams', data);
        return response.data;
    },
    updateExam: async (id: string, data: any) => {
        const response = await api.put(`/exams/${id}`, data);
        return response.data;
    },
    deleteExam: async (id: string) => {
        const response = await api.delete(`/exams/${id}`);
        return response.data;
    },
    bulkDeleteExams: async (ids: string[], force = false) => {
        const response = await api.post('/exams/bulk-delete', { ids, force });
        return response.data;
    },
    bulkUpdateExams: async (data: any) => {
        const response = await api.post('/exams/bulk-update', data);
        return response.data;
    },
    getTrashed: async (params?: any) => {
        const response = await api.get('/exams/trashed', { params });
        return response.data;
    },
    restore: async (id: string) => {
        const response = await api.post(`/exams/${id}/restore`);
        return response.data;
    },
    forceDelete: async (id: string) => {
        const response = await api.delete(`/exams/${id}/force-delete`);
        return response.data;
    },
    getExamSessions: async (id: string, params?: any) => {
        const response = await api.get(`/exams/${id}/sessions`, { params });
        return response.data;
    },
    regenerateToken: async (id: string) => {
        const response = await api.post(`/exams/${id}/regenerate-token`);
        return response.data;
    },
    resetExam: async (id: string) => {
        const response = await api.post(`/exams/${id}/reset`);
        return response.data;
    },
    forceFinish: async (id: string) => {
        const response = await api.post(`/exams/${id}/force-finish`);
        return response.data;
    },
    liveScore: async (id: string) => {
        const response = await api.get(`/exams/${id}/live-score`);
        return response.data;
    }
};

export const questionSuggestionApi = {
    getSuggestions: async (params?: any) => {
        const response = await api.get('/question-suggestions', { params });
        return response.data;
    },
    getMySuggestions: async (params?: any) => {
        const response = await api.get('/question-suggestions/mine', { params });
        return response.data;
    },
    getSuggestion: async (id: string) => {
        const response = await api.get(`/question-suggestions/${id}`);
        return response.data;
    },
    approveSuggestion: async (id: string) => {
        const response = await api.post(`/question-suggestions/${id}/approve`);
        return response.data;
    },
    rejectSuggestion: async (id: string) => {
        const response = await api.post(`/question-suggestions/${id}/reject`);
        return response.data;
    }
};

// --- Learning Materials ---

export interface ReadingMaterial {
    id: string;
    title: string;
    content: string;
    user_id: string;
    media?: { reading_materials?: string };
    created_at: string;
    updated_at: string;
}

export const readingMaterialApi = {
    getMaterials: async (params?: any) => {
        const response = await api.get('/reading-materials', { params });
        return response.data;
    },
    getMaterial: async (id: string) => {
        const response = await api.get(`/reading-materials/${id}`);
        return response.data;
    },
    createMaterial: async (data: any) => {
        const response = await api.post('/reading-materials', data);
        return response.data;
    },
    updateMaterial: async (id: string, data: any) => {
        const response = await api.put(`/reading-materials/${id}`, data);
        return response.data;
    },
    deleteMaterial: async (id: string) => {
        const response = await api.delete(`/reading-materials/${id}`);
        return response.data;
    },
    bulkDeleteMaterials: async (ids: string[], force = false) => {
        const response = await api.post('/reading-materials/bulk-delete', { ids, force });
        return response.data;
    },
    getTrashed: async (params?: any) => {
        const response = await api.get('/reading-materials/trashed', { params });
        return response.data;
    },
    restore: async (id: string) => {
        const response = await api.post(`/reading-materials/${id}/restore`);
        return response.data;
    },
    forceDelete: async (id: string) => {
        const response = await api.delete(`/reading-materials/${id}/force-delete`);
        return response.data;
    },
    deleteMedia: async (id: string, mediaId: string) => {
        const response = await api.delete(`/reading-materials/${id}/media/${mediaId}`);
        return response.data;
    }
};

export const activityLogApi = {
    getLogs: async (params?: any) => {
        const response = await api.get('/activity-logs', { params });
        return response.data;
    },
    getMyLogs: async (params?: any) => {
        const response = await api.get('/activity-logs/mine', { params });
        return response.data;
    }
};

export const optionsApi = {
    getOptions: async (params?: any) => {
        // Assuming '/options' refers to general options/settings if it exists
        const response = await api.get('/options', { params });
        return response.data;
    },
    getOption: async (id: string) => {
        const response = await api.get(`/options/${id}`);
        return response.data;
    },
    deleteMedia: async (id: string, mediaId: string) => {
        const response = await api.delete(`/options/${id}/media/${mediaId}`);
        return response.data;
    }
};
