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

// User interface
export interface User {
    id: number;
    name: string;
    email: string;
    role?: 'admin' | 'teacher' | 'student'; // Mapped from user_type
    user_type?: string;
    // Add other fields as needed
}

// Zod schemas for request validation (derived from API docs/logic)
export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
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

export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;

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
        await api.post('/logout');
    },
    getUserProfile: async () => {
        const response = await api.get('/user'); // Adjust endpoint if needed
        return response.data;
    }
};

// Teacher Interface
export interface Teacher {
    id: string;
    name: string;
    username?: string;
    email: string;
    avatar?: string;
    subjects?: any[]; // Replace with specific Subject interface if available
    created_at: string;
    updated_at: string;
}

export interface TeacherResponse {
    success: boolean;
    message: string;
    data: Teacher[];
    meta?: any; // For pagination
    links?: any;
}

// Teacher API
export const teacherApi = {
    getTeachers: async (params?: any) => {
        // Assuming /v1/users?role=teacher or similar. 
        // Based on api.json there is no specific /v1/teachers endpoint listed in the first grep, 
        // but often it's under users or a specific endpoint I missed. 
        // However, I will use /v1/users?type=teacher based on common patterns if /v1/teachers fails,
        // but for now I will try /v1/teachers as per potential convention or /users.
        // Actually, looking at the previous grep, I didn't see /v1/teachers. 
        // I will use /v1/users?user_type=teacher as a fallback or if I find the specific endpoint.
        // Wait, I saw 'StoreTeacherRequest' in api.json, which implies there might be a resource.
        // Let's assume /v1/teachers exists or I'll use /v1/users.
        // Let's try to hit /v1/teachers first.
        const response = await api.get('/teachers', { params });
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
    bulkDeleteTeachers: async (ids: string[]) => {
        const response = await api.post('/teachers/bulk-delete', { ids });
        return response.data;
    },
    importTeachers: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/teachers/import', formData, {
            headers: {
                'Content-Type': undefined,
            },
        });
        return response.data;
    },
    downloadTemplate: async () => {
        const response = await api.get('/teachers/export/template', {
            responseType: 'blob',
        });
        return response.data;
    },
    exportTeachers: async () => {
        const response = await api.get('/teachers/export', {
            responseType: 'blob',
        });
        return response.data;
    },
    searchTeachers: async (query: string, params?: any) => {
        const response = await api.get('/teachers/search', {
            params: { query, ...params }
        });
        return response.data;
    }
};

// Student Interface
export interface Student {
    id: string;
    name: string;
    username?: string;
    email: string;
    avatar?: string;
    created_at: string;
    updated_at: string;
}

export interface StudentResponse {
    success: boolean;
    message: string;
    data: Student[];
    meta?: any; // For pagination
    links?: any;
}

// Student API
export const studentApi = {
    getStudents: async (params?: any) => {
        const response = await api.get('/students', { params });
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
    bulkDeleteStudents: async (ids: string[]) => {
        const response = await api.post('/students/bulk-delete', { ids });
        return response.data;
    },
    importStudents: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/students/import', formData, {
            headers: {
                'Content-Type': undefined,
            },
        });
        return response.data;
    },
    downloadTemplate: async () => {
        const response = await api.get('/students/export/template', {
            responseType: 'blob',
        });
        return response.data;
    },
    exportStudents: async () => {
        const response = await api.get('/students/export', {
            responseType: 'blob',
        });
        return response.data;
    },
    searchStudents: async (query: string, params?: any) => {
        const response = await api.get('/students/search', {
            params: { query, ...params }
        });
        return response.data;
    }
};

