import { motion } from "framer-motion"
import { Play, TrendingUp, Star, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function Dashboard() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-8"
        >
            {/* Welcome Section */}
            <motion.div variants={item} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, Student!</h1>
                    <p className="text-muted-foreground">Ready to continue your learning streak?</p>
                </div>
                <Button size="lg" variant="game" className="w-full md:w-auto">
                    <Play className="mr-2 w-5 h-5" /> Continue Learning
                </Button>
            </motion.div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Stats Cards */}
                {[
                    { label: "Total XP", value: "1,204", icon: Star, color: "text-yellow-500" },
                    { label: "Day Streak", value: "12", icon: TrendingUp, color: "text-rose-500" },
                    { label: "Lessons Completed", value: "48", icon: Play, color: "text-blue-500" },
                    { label: "League Rank", value: "#4", icon: Calendar, color: "text-green-500" }, // specific icon for league?
                ].map((stat, i) => (
                    <motion.div key={i} variants={item}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.label}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">
                                    +20% from last month
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <motion.div variants={item} className="col-span-4">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Current Course</CardTitle>
                            <CardDescription>Mastering React Fundamentals</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                                            Progress
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-primary">
                                            65%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-primary/20">
                                    <div style={{ width: "65%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"></div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-4">
                                    Next Lesson: <strong>Advanced Hooks</strong>
                                </p>
                                <Button className="mt-4 w-full" variant="secondary">Resume Course</Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={item} className="col-span-3">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Leaderboard</CardTitle>
                            <CardDescription>Top Learners this week</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[1, 2, 3, 4, 5].map((place) => (
                                    <div key={place} className="flex items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-3 ${place === 1 ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {place}
                                        </div>
                                        <div className="ml-2 space-y-1">
                                            <p className="text-sm font-medium leading-none">User {place}</p>
                                            <p className="text-xs text-muted-foreground">{1000 - (place * 50)} XP</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    )
}
