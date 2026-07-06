"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { DollarSign, Users, CalendarCheck, TrendingUp, Download } from "lucide-react"

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    type ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { downloadCsv } from "@/lib/export"

// Mock monthly data for the trailing 12 months.
const financeData = [
    { month: "2025-07", revenue: 24800, expenses: 15200 },
    { month: "2025-08", revenue: 23100, expenses: 14700 },
    { month: "2025-09", revenue: 27600, expenses: 16100 },
    { month: "2025-10", revenue: 29200, expenses: 16800 },
    { month: "2025-11", revenue: 26400, expenses: 15900 },
    { month: "2025-12", revenue: 31500, expenses: 18200 },
    { month: "2026-01", revenue: 28700, expenses: 17100 },
    { month: "2026-02", revenue: 30100, expenses: 17600 },
    { month: "2026-03", revenue: 32800, expenses: 18900 },
    { month: "2026-04", revenue: 34200, expenses: 19400 },
    { month: "2026-05", revenue: 33600, expenses: 19000 },
    { month: "2026-06", revenue: 36900, expenses: 20500 },
]

const patientData = [
    { month: "2025-07", newPatients: 32, returning: 148 },
    { month: "2025-08", newPatients: 28, returning: 152 },
    { month: "2025-09", newPatients: 41, returning: 161 },
    { month: "2025-10", newPatients: 37, returning: 170 },
    { month: "2025-11", newPatients: 33, returning: 165 },
    { month: "2025-12", newPatients: 45, returning: 182 },
    { month: "2026-01", newPatients: 39, returning: 176 },
    { month: "2026-02", newPatients: 43, returning: 188 },
    { month: "2026-03", newPatients: 48, returning: 195 },
    { month: "2026-04", newPatients: 52, returning: 201 },
    { month: "2026-05", newPatients: 46, returning: 198 },
    { month: "2026-06", newPatients: 55, returning: 210 },
]

const financeConfig = {
    revenue: { label: "Revenue", color: "var(--primary)" },
    expenses: { label: "Expenses", color: "var(--muted-foreground)" },
} satisfies ChartConfig

const patientConfig = {
    newPatients: { label: "New Patients", color: "var(--primary)" },
    returning: { label: "Returning Patients", color: "var(--muted-foreground)" },
} satisfies ChartConfig

function filterByRange<T extends { month: string }>(data: T[], range: string) {
    const months = range === "3m" ? 3 : range === "6m" ? 6 : 12
    return data.slice(-months)
}

function formatMonth(value: string) {
    const date = new Date(`${value}-01`)
    return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

export default function ReportsPage() {
    const [range, setRange] = React.useState("12m")

    const finance = filterByRange(financeData, range)
    const patients = filterByRange(patientData, range)

    const totalRevenue = finance.reduce((sum, m) => sum + m.revenue, 0)
    const totalExpenses = finance.reduce((sum, m) => sum + m.expenses, 0)
    const totalNewPatients = patients.reduce((sum, m) => sum + m.newPatients, 0)
    const netMargin = totalRevenue
        ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100)
        : 0

    const kpis = [
        {
            title: "Total Revenue",
            value: `${totalRevenue.toLocaleString()} TND`,
            icon: DollarSign,
        },
        {
            title: "Net Margin",
            value: `${netMargin}%`,
            icon: TrendingUp,
        },
        {
            title: "New Patients",
            value: totalNewPatients.toLocaleString(),
            icon: Users,
        },
        {
            title: "Appointments Completed",
            value: patients.reduce((sum, m) => sum + m.returning + m.newPatients, 0).toLocaleString(),
            icon: CalendarCheck,
        },
    ]

    const exportReport = (format: "csv" | "pdf") => {
        if (format === "csv") {
            const completedAppointments = patients.reduce(
                (sum, m) => sum + m.returning + m.newPatients,
                0
            )
            const rows = [
                ["Summary", "Total Revenue", `${totalRevenue.toLocaleString()} TND`, "", ""],
                ["Summary", "Net Margin", `${netMargin}%`, "", ""],
                ["Summary", "New Patients", totalNewPatients.toLocaleString(), "", ""],
                ["Summary", "Appointments Completed", completedAppointments.toLocaleString(), "", ""],
                ...finance.map((m, index) => [
                    "Monthly",
                    m.month,
                    m.revenue,
                    m.expenses,
                    `${patients[index]?.newPatients ?? 0}/${patients[index]?.returning ?? 0}`,
                ]),
            ]

            downloadCsv({
                filename: `global-report-${new Date().toISOString().split("T")[0]}.csv`,
                headers: ["Section", "Label", "Value 1", "Value 2", "Value 3"],
                rows,
            })
            return
        }

        window.print()
    }

    return (
        <div className="space-y-6 px-4 lg:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Global Reports</h1>
                    <p className="text-muted-foreground">
                        Practice-wide performance across revenue, expenses, and patient growth.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <ToggleGroup
                        type="single"
                        value={range}
                        onValueChange={(v) => v && setRange(v)}
                        variant="outline"
                    >
                        <ToggleGroupItem value="3m" className="cursor-pointer">3M</ToggleGroupItem>
                        <ToggleGroupItem value="6m" className="cursor-pointer">6M</ToggleGroupItem>
                        <ToggleGroupItem value="12m" className="cursor-pointer">12M</ToggleGroupItem>
                    </ToggleGroup>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="cursor-pointer">
                                <Download className="mr-2 size-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem className="cursor-pointer" onClick={() => exportReport("csv")}>
                                Export as CSV
                            </DropdownMenuItem>
                            <DropdownMenuItem className="cursor-pointer" onClick={() => exportReport("pdf")}>
                                Export as PDF
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.title} className="border">
                        <CardContent className="space-y-3">
                            <kpi.icon className="text-muted-foreground size-6" />
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-sm font-medium">{kpi.title}</p>
                                <div className="text-2xl font-bold">{kpi.value}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Revenue vs. Expenses</CardTitle>
                    <CardDescription>Monthly totals, stacked</CardDescription>
                    <CardAction className="text-sm text-muted-foreground">
                        {finance.length} months
                    </CardAction>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    <ChartContainer config={financeConfig} className="aspect-auto h-[280px] w-full">
                        <AreaChart data={finance}>
                            <defs>
                                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={1.0} />
                                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={24}
                                tickFormatter={formatMonth}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent labelFormatter={(v) => formatMonth(v as string)} indicator="dot" />}
                            />
                            <ChartLegend
                                content={({ payload, verticalAlign }) => (
                                    <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />
                                )}
                            />
                            <Area
                                dataKey="expenses"
                                type="natural"
                                fill="url(#fillExpenses)"
                                stroke="var(--color-expenses)"
                                stackId="a"
                            />
                            <Area
                                dataKey="revenue"
                                type="natural"
                                fill="url(#fillRevenue)"
                                stroke="var(--color-revenue)"
                                stackId="a"
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Patient Growth</CardTitle>
                    <CardDescription>New vs. returning patients, stacked</CardDescription>
                    <CardAction className="text-sm text-muted-foreground">
                        {patients.length} months
                    </CardAction>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    <ChartContainer config={patientConfig} className="aspect-auto h-[280px] w-full">
                        <AreaChart data={patients}>
                            <defs>
                                <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-newPatients)" stopOpacity={1.0} />
                                    <stop offset="95%" stopColor="var(--color-newPatients)" stopOpacity={0.1} />
                                </linearGradient>
                                <linearGradient id="fillReturning" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="var(--color-returning)" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="var(--color-returning)" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={24}
                                tickFormatter={formatMonth}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent labelFormatter={(v) => formatMonth(v as string)} indicator="dot" />}
                            />
                            <ChartLegend
                                content={({ payload, verticalAlign }) => (
                                    <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />
                                )}
                            />
                            <Area
                                dataKey="returning"
                                type="natural"
                                fill="url(#fillReturning)"
                                stroke="var(--color-returning)"
                                stackId="b"
                            />
                            <Area
                                dataKey="newPatients"
                                type="natural"
                                fill="url(#fillNew)"
                                stroke="var(--color-newPatients)"
                                stackId="b"
                            />
                        </AreaChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}