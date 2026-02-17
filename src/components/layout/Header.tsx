import { useAuth } from '@/contexts/AuthContext';
import AcademicYearSelector from '../common/AcademicYearSelector';

interface HeaderProps {
    toggleSidebar: () => void;
    isSidebarCollapsed: boolean;
}

export default function Header({ toggleSidebar, isSidebarCollapsed }: HeaderProps) {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-6 flex-1">
                <button
                    onClick={toggleSidebar}
                    className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                >
                    <span className={`material-symbols-outlined toggle-icon block transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                        menu_open
                    </span>
                </button>

                {/* Replaced Search Bar with Academic Year Selector */}
                <AcademicYearSelector />
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 relative transition-transform hover:scale-105 active:scale-95">
                        <span className="material-symbols-outlined">notifications</span>
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-background-dark animate-pulse"></span>
                    </button>
                    <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-transform hover:scale-105 active:scale-95">
                        <span className="material-symbols-outlined">chat_bubble</span>
                    </button>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
                <div className="flex items-center gap-3 group cursor-pointer">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none group-hover:text-primary transition-colors">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-500 font-medium capitalize">{user?.role || 'Admin'}</p>
                    </div>
                    <div className="size-10 rounded-full border-2 border-primary/20 p-0.5 group-hover:border-primary transition-colors">
                        <img
                            alt="Profile Avatar"
                            className="rounded-full size-full object-cover"
                            src={user?.avatar || "https://ui-avatars.com/api/?name=" + (user?.name || 'User') + "&background=random"}
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
