import React from 'react';

interface AuthLayoutProps {
    children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
    return (
        <div className="bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 h-screen w-full overflow-hidden flex font-display antialiased">
            {/* Left Decoration Section */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary to-accent-blue overflow-hidden items-center justify-center p-12">
                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-accent-pink rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                    <div className="absolute bottom-10 right-10 w-64 h-64 bg-accent-yellow rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-light rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
                </div>
                <div className="relative z-10 text-white max-w-lg">
                    <div className="mb-8 flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-primary font-bold text-xl shadow-lg">
                            L
                        </div>
                        <span className="text-3xl font-bold tracking-tight">LMS Pro</span>
                    </div>
                    <h1 className="text-5xl font-bold mb-6 leading-tight">Empowering your <br /><span className="text-accent-yellow">learning journey</span>.</h1>
                    <p className="text-lg text-white/90 mb-8 font-light">Join thousands of students and instructors today. Unlock your potential with our world-class courses and community.</p>
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-xl shadow-2xl transform translate-x-4">
                        <div className="flex items-center mb-4">
                            <div className="flex text-accent-yellow">
                                <span className="material-icons text-sm">star</span>
                                <span className="material-icons text-sm">star</span>
                                <span className="material-icons text-sm">star</span>
                                <span className="material-icons text-sm">star</span>
                                <span className="material-icons text-sm">star</span>
                            </div>
                        </div>
                        <p className="text-sm italic mb-4">"The platform is incredibly intuitive. I was able to set up my entire course curriculum in a single afternoon!"</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-300 overflow-hidden relative">
                                <img alt="Portrait of a female student smiling" className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBwS-ipuHmHBw4j4D9_yViD2MXASbht2S4IqYKTOCSJNHW6BBZg5x9B24AMlJ6tfHtdcOpE1nJJWGRbyXf_FdnEqLtjx5y1kOx5X6eU_b1aXoZtNc9zcshZtOUPb6iNUH-6O3vORBF529gG1zigyTxNE6HcbBUcayN8r6FLuBVnfTSjxHEUiUX3LIdOP3c-NK2Gx8SrMrj9Jm26LU_ZA9yXjDmopBdT1oNB-7imdYXyNU-lP2ldnDYpCG_rtuyEplCFBoWAtOHSVzol" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Sarah Jenkins</p>
                                <p className="text-xs text-white/70">Biology Instructor</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute inset-0 z-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAB6IWCouaUbRbTT3FYECVsdiBlOPCKYavC4alIpNBPM2IqZ9sVEJAIaUwgrhCKW052HP1mNMXdAoz8JT8X5NR1mnt4FSWOXZH70W-2qqvfZwruehOcOrZdf5JLBSMrWXMptNRVl2OEeBeP6JPgWv0H8auHBtjd8-DJP1cS5qA4THEgzZqc5zHw5z4FIhCUf0Sw1J4SqyQz48Nc2XFj1fh4uMtN-ve6k9WqCuCSXUUyN8O7TK0Eu195G_dTxkOew06OBBCAXHohdGPs')", backgroundSize: "200px" }}></div>
            </div>

            {/* Right Content Section */}
            <div className="w-full lg:w-1/2 h-full flex flex-col bg-background-light dark:bg-background-dark overflow-y-auto">
                <div className="lg:hidden p-6 bg-primary text-white flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-primary font-bold">L</div>
                        <span className="text-xl font-bold">LMS Pro</span>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                    {children}
                </div>
                <div className="p-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    © 2023 LMS Pro Inc. All rights reserved.
                </div>
            </div>
        </div>
    );
}
