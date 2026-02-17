import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import Header from '@/components/layout/Header';

export default function AdminLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="flex h-screen overflow-hidden relative bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <AdminSidebar isCollapsed={isSidebarCollapsed} />

            <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark/50 transition-all duration-300">
                <Header toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />

                <Outlet />
            </main>
        </div>
    );
}
