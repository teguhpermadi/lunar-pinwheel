export default function StudentDashboard() {
    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <section className="bg-primary rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-white/5 -skew-x-12 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
                    <div className="space-y-4 max-w-xl text-center md:text-left">
                        <span className="px-4 py-1.5 bg-white/20 rounded-full text-xs font-bold uppercase tracking-widest">Active Streak: 12 Days 🔥</span>
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight">Welcome back, Alex!</h2>
                        <p className="text-primary-100 text-lg opacity-80">You're just 450 XP away from reaching Level 15. Keep up the great work on your UI Design course!</p>
                        <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                                <div className="size-10 bg-amber-400 rounded-xl flex items-center justify-center text-slate-900">
                                    <span className="material-symbols-outlined">stars</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase opacity-60">Latest Badge</p>
                                    <p className="text-sm font-bold">Fast Learner</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                                <div className="size-10 bg-blue-400 rounded-xl flex items-center justify-center text-white">
                                    <span className="material-symbols-outlined">auto_awesome</span>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase opacity-60">Achievement</p>
                                    <p className="text-sm font-bold">7 Day Streak</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="w-full md:w-72 bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                        <div className="flex justify-between items-end mb-4">
                            <h4 className="font-bold">Next Rank</h4>
                            <span className="text-xs font-medium opacity-60">Master</span>
                        </div>
                        <div className="space-y-4">
                            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                                <div className="bg-yellow-400 h-full rounded-full w-2/3 shadow-[0_0_15px_rgba(250,204,21,0.5)]"></div>
                            </div>
                            <div className="flex justify-between text-xs font-bold">
                                <span>12,450 XP</span>
                                <span className="text-yellow-400">15,000 XP</span>
                            </div>
                            <button className="w-full py-3 bg-white text-primary rounded-xl font-bold text-sm hover:bg-yellow-400 hover:text-slate-900 transition-all">Claim Daily Reward</button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Course Progress Overview</h4>
                                <p className="text-sm text-slate-500 font-medium">Ongoing academic performance</p>
                            </div>
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                                <span className="material-symbols-outlined">more_horiz</span>
                            </button>
                        </div>
                        <div className="space-y-6">
                            {[
                                { title: "Graphic Design Masterclass", progress: 85, color: "blue", icon: "brush" },
                                { title: "Fullstack React 2024", progress: 42, color: "amber", icon: "code" },
                                { title: "Advanced Calculus II", progress: 12, color: "rose", icon: "functions" },
                            ].map((course) => (
                                <div key={course.title} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-8 bg-${course.color}-100 dark:bg-${course.color}-500/10 rounded-lg flex items-center justify-center text-${course.color}-600`}>
                                                <span className="material-symbols-outlined text-lg">{course.icon}</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{course.title}</span>
                                        </div>
                                        <span className="text-xs font-black text-slate-400">{course.progress}% Complete</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                        <div className={`bg-${course.color}-500 h-full rounded-full`} style={{ width: `${course.progress}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white px-2">Suggested Next Steps</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Resume Lesson", icon: "play_circle", color: "blue" },
                                { label: "Take Quiz", icon: "quiz", color: "rose" },
                                { label: "Submit Task", icon: "upload_file", color: "amber" },
                                { label: "Explore", icon: "explore", color: "primary" },
                            ].map((step) => (
                                <button key={step.label} className="group flex flex-col items-center justify-center gap-3 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-primary/50 transition-all hover:shadow-lg">
                                    <div className={`size-12 rounded-xl bg-${step.color === 'primary' ? 'primary/10' : step.color + '-100'} text-${step.color === 'primary' ? 'primary' : step.color + '-600'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                        <span className="material-symbols-outlined">{step.icon}</span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight text-center">{step.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Exams</h4>
                            <button className="text-primary text-xs font-bold hover:underline">Full Schedule</button>
                        </div>
                        <div className="space-y-6 relative flex-1">
                            <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800"></div>
                            {[
                                { title: "UI/UX Mid-Term Exam", time: "In 2 Hours", meta: "Starts at 2:00 PM • Duration: 90m", color: "rose", icon: "alarm" },
                                { title: "React Fundamentals Final", time: "Tomorrow", meta: "10:00 AM • Main Hall / Online", color: "blue", icon: "calendar_month" },
                                { title: "Mathematics Quiz III", time: "Friday", meta: "09:00 AM • 15 Questions", color: "amber", icon: "schedule" },
                            ].map((exam, idx) => (
                                <div key={idx} className="relative flex gap-4">
                                    <div className={`z-10 size-8 rounded-full bg-${exam.color === 'rose' ? 'rose-500 text-white' : exam.color + '-100 text-' + exam.color + '-600'} flex items-center justify-center ring-4 ring-white dark:ring-slate-900`}>
                                        <span className="material-symbols-outlined text-sm">{exam.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-black ${exam.color === 'rose' ? 'text-rose-600' : 'text-slate-400'} uppercase tracking-widest mb-1`}>{exam.time}</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{exam.title}</p>
                                        <p className="text-xs text-slate-500">{exam.meta}</p>
                                        {exam.color === 'rose' && (
                                            <div className="mt-2">
                                                <button className="px-4 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest">Join Waiting Room</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            <div className="mt-auto pt-8 flex flex-col items-center opacity-20 grayscale select-none">
                                <span className="material-symbols-outlined text-6xl mb-2">event_available</span>
                                <p className="text-xs font-bold text-center uppercase tracking-widest">Study hard, score big</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
