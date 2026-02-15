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
    // Placeholder for logout if needed later
    logout: async () => {
        // await api.post('/logout');
    }
};
