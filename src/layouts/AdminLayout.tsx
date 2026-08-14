import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/AdminSidebar';
import Header from '@/components/layout/Header';

interface AdminLayoutProps {
    hideSidebar?: boolean;
}

export default function AdminLayout({ hideSidebar = false }: AdminLayoutProps = {}) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(!isMobileSidebarOpen);
    };

    return (
        <div className="flex h-screen overflow-hidden relative bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            {/* Mobile Sidebar Backdrop */}
            {isMobileSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setIsMobileSidebarOpen(false)}
                />
            )}

            {!hideSidebar && (
                <AdminSidebar 
                    isCollapsed={isSidebarCollapsed} 
                    isMobileOpen={isMobileSidebarOpen}
                    onMobileClose={() => setIsMobileSidebarOpen(false)}
                />
            )}

            <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark/50 transition-all duration-300">
                <Header 
                    toggleSidebar={toggleSidebar} 
                    toggleMobileSidebar={toggleMobileSidebar}
                    isSidebarCollapsed={isSidebarCollapsed} 
                    hideSidebarToggle={hideSidebar}
                />

                <Outlet />
            </main>
        </div>
    );
}
