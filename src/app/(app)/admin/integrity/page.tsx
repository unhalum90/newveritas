"use client";

import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Loader2, ShieldAlert } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from "recharts";

type IntegrityReport = {
    school_id: string;
    school_name: string;
    teacher_id: string;
    teacher_name: string;
    class_id: string;
    class_name: string;
    event_type: string;
    event_count: number;
    report_week: string;
};

type EngagementReport = {
    submissionId: string;
    studentName: string;
    assessmentTitle: string;
    submittedAt: string;
    totalTimeSpentMinutes: number;
    reEngagementCount: number;
};

export default function IntegrityDashboard() {
    const [reports, setReports] = useState<IntegrityReport[]>([]);
    const [engagementReports, setEngagementReports] = useState<EngagementReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filterType, setFilterType] = useState<string>("all");

    useEffect(() => {
        async function fetchData() {
            try {
                const [integrityRes, engagementRes] = await Promise.all([
                    fetch("/api/admin/reports/integrity"),
                    fetch("/api/admin/reports/engagement")
                ]);

                if (!integrityRes.ok || !engagementRes.ok) throw new Error("Failed to fetch reports");

                const [integrityData, engagementData] = await Promise.all([
                    integrityRes.json(),
                    engagementRes.json()
                ]);

                setReports(integrityData.reports);
                setEngagementReports(engagementData.reports);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const filteredReports = filterType === "all"
        ? reports
        : reports.filter(r => r.event_type === filterType);

    const chartData = reports.reduce((acc: any[], curr) => {
        const week = new Date(curr.report_week).toLocaleDateString();
        const existing = acc.find(a => a.week === week);
        if (existing) {
            existing[curr.event_type] = (existing[curr.event_type] || 0) + curr.event_count;
            existing.total += curr.event_count;
        } else {
            acc.push({
                week,
                [curr.event_type]: curr.event_count,
                total: curr.event_count
            });
        }
        return acc;
    }, []).sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());

    const exportToCSV = () => {
        const headers = ["Week", "Teacher", "Class", "Type", "Count"];
        const rows = reports.map(r => [
            new Date(r.report_week).toLocaleDateString(),
            r.teacher_name,
            r.class_name,
            r.event_type,
            r.event_count
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "integrity_report.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-12 text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive opacity-50 mb-4" />
                <h3 className="text-lg font-medium">Failed to load dashboard</h3>
                <p className="text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <ShieldAlert className="h-8 w-8 text-indigo-600" />
                        Oversight Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Monitor academic integrity and engagement trends across your school.
                    </p>
                </div>
                <Button onClick={exportToCSV} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export Integrity CSV
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-slate-50/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Integrity Flags (30d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">
                            {reports.reduce((sum, r) => sum + r.event_count, 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-50/50">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium text-muted-foreground">Protracted Interactions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-amber-600">
                            {engagementReports.length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-500" />
                        <CardTitle>Engagement Monitoring (Protracted Interactions)</CardTitle>
                    </div>
                    <CardDescription>
                        Students spending over 30 minutes or with 5+ re-engagements. These may require welfare follow-up.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Assessment</TableHead>
                                <TableHead>Total Time</TableHead>
                                <TableHead>Re-engagements</TableHead>
                                <TableHead className="text-right">Submitted At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {engagementReports.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                                        No protracted interactions detected.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                engagementReports.map((report, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{report.studentName}</TableCell>
                                        <TableCell>{report.assessmentTitle}</TableCell>
                                        <TableCell>
                                            <span className={report.totalTimeSpentMinutes > 60 ? "text-destructive font-bold" : ""}>
                                                {report.totalTimeSpentMinutes}m
                                            </span>
                                        </TableCell>
                                        <TableCell>{report.reEngagementCount}</TableCell>
                                        <TableCell className="text-right">
                                            {new Date(report.submittedAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader>
                    <CardTitle>Integrity Trends</CardTitle>
                    <CardDescription>Weekly volume of recorded integrity events.</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="week" />
                            <YAxis />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="tab_switch" name="Tab Switch" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="screenshot_attempt" name="Screenshot" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="total" name="Total Events" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle>Detailed Integrity Breakdown</CardTitle>
                        <CardDescription>Metrics segmented by teacher and class.</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                        <Select value={filterType} onValueChange={setFilterType}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Event Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Events</SelectItem>
                                <SelectItem value="tab_switch">Tab Switch</SelectItem>
                                <SelectItem value="screenshot_attempt">Screenshot</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Week</TableHead>
                                <TableHead>Teacher</TableHead>
                                <TableHead>Class</TableHead>
                                <TableHead>Event Type</TableHead>
                                <TableHead className="text-right">Flags</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredReports.map((report, i) => (
                                <TableRow key={i}>
                                    <TableCell className="font-medium">
                                        {new Date(report.report_week).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{report.teacher_name}</TableCell>
                                    <TableCell>{report.class_name}</TableCell>
                                    <TableCell className="capitalize">{report.event_type.replace('_', ' ')}</TableCell>
                                    <TableCell className="text-right font-bold">{report.event_count}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
