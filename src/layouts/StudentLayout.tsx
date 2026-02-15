import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import StudentSidebar from '../components/StudentSidebar';

export default function StudentLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display">
            <StudentSidebar isCollapsed={isSidebarCollapsed} />

            <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark/50 transition-all duration-300">
                <header className="sticky top-0 z-10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-8 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <button
                            onClick={toggleSidebar}
                            className="cursor-pointer p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
                        >
                            <span className={`material-symbols-outlined toggle-icon block transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}>
                                menu_open
                            </span>
                        </button>
                        <label className="relative w-full max-w-md">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                                <span className="material-symbols-outlined">search</span>
                            </span>
                            <input
                                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-primary/50 transition-all text-sm outline-none"
                                placeholder="Search courses, lessons, or exams..."
                                type="text"
                            />
                        </label>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 relative">
                                <span className="material-symbols-outlined">notifications</span>
                                <span className="absolute top-2 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white dark:border-background-dark"></span>
                            </button>
                            <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400">
                                <span className="material-symbols-outlined">workspace_premium</span>
                            </button>
                        </div>
                        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Alex Rivers</p>
                                <p className="text-xs text-slate-500 font-medium">B.Sc Computer Science</p>
                            </div>
                            <div className="size-10 rounded-full border-2 border-primary/20 p-0.5">
                                <img
                                    alt="Student Profile Avatar"
                                    className="rounded-full size-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUZUfJ34sqTHda9fh-tRRUn0_RLr_fDgt6Bc_IQFyA5vu8mYKaWXObrhz_6PrUPp3LkS5Ts6NxWcnidc8C2KdbyIlVMG5DEUcO4xFIbexbWSno_CI3LpJp-PTae8a-uBCX5PlJo7PbYClQ_FwODwb0uxNElzM_h2rORoaNB_vR3FkmiijQys6uLnCBzNyUXxzxYTEXDhajv2gCRPDbznr3b_AjtL0Tqio34NprggbHqbZbsBU5BJ2xqBRVA_rRBrWf7DVl0h0_N-iR"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <Outlet />
            </main>
        </div>
    );
}
