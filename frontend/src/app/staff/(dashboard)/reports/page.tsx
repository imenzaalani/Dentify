"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { DollarSign, Users, UserPlus, CalendarCheck, Download } from "lucide-react"

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
import { useCurrentRole } from "@/lib/rbac"
import { statsApi } from "@/lib/api/stats"
import { ApiError } from "@/lib/api/client"
import type { StatsFull } from "@/types/stats"

const financeConfig = {
    revenue: { label: "Revenue", color: "var(--primary)" },
} satisfies ChartConfig

const patientConfig = {
    new: { label: "New Patients", color: "var(--primary)" },
    existing: { label: "Existing Patients", color: "var(--muted-foreground)" },
} satisfies ChartConfig

function monthsAgo(n: number): Date {
    const d = new Date()
    d.setMonth(d.getMonth() - n)
    return d
}

function toDateParam(d: Date): string {
    return d.toISOString().split("T")[0]
}

export default function ReportsPage() {
    const role = useCurrentRole()
    const canView = role === "owner"

    const [range, setRange] = React.useState("12m")
    const [data, setData] = React.useState<StatsFull | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)

    React.useEffect(() => {
        if (!canView) {
            setLoading(false)
            return
        }
        let cancelled = false
        setLoading(true)
        setError(null)

        const months = range === "3m" ? 3 : range === "6m" ? 6 : 12
        const start = toDateParam(monthsAgo(months))
        const end = toDateParam(new Date())

        statsApi
            .getFull(start, end, "month")
            .then((result) => {
                if (!cancelled) setData(result)
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(err instanceof ApiError ? err.message : "Failed to load report data")
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [range, canView])

    if (!canView) {
        return (
            <div className="px-4 lg:px-6">
                <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                    Global reports are visible to the practice owner only.
                </p>
            </div>
        )
    }

    const revenueData = data?.revenue_series ?? []
    // Recharts wants "existing" drawn under "new" for the stack to read
    // bottom-to-top as (existing, then new added on top) — same order the
    // old mock used.
    const patientData = data?.patient_growth ?? []

    const totalRevenue = data?.kpis.revenue.value ?? 0
    const totalNewPatients = data?.kpis.new_patients.value ?? 0
    const patientsSeen = data?.kpis.patients_seen.value ?? 0
    const occupancyRate = data?.kpis.occupancy_rate.value ?? 0

    const kpis = [
        {
            title: "Total Revenue",
            value: `${Math.round(totalRevenue).toLocaleString()} TND`,
            icon: DollarSign,
        },
        {
            title: "Occupancy Rate",
            value: `${occupancyRate.toFixed(1)}%`,
            icon: CalendarCheck,
        },
        {
            title: "New Patients",
            value: totalNewPatients.toLocaleString(),
            icon: UserPlus,
        },
        {
            title: "Patients Seen",
            value: patientsSeen.toLocaleString(),
            icon: Users,
        },
    ]

    const exportReport = (format: "csv" | "pdf") => {
        if (format === "csv") {
            const rows = [
                ["Summary", "Total Revenue", `${Math.round(totalRevenue).toLocaleString()} TND`, ""],
                ["Summary", "Occupancy Rate", `${occupancyRate.toFixed(1)}%`, ""],
                ["Summary", "New Patients", totalNewPatients.toLocaleString(), ""],
                ["Summary", "Patients Seen", patientsSeen.toLocaleString(), ""],
                ...revenueData.map((m, index) => [
                    "Monthly",
                    m.label,
                    m.revenue,
                    `${patientData[index]?.new ?? 0} new / ${patientData[index]?.total ?? 0} total patients`,
                ]),
            ]

            downloadCsv({
                filename: `global-report-${new Date().toISOString().split("T")[0]}.csv`,
                headers: ["Section", "Label", "Value 1", "Value 2"],
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
                        Practice-wide performance across revenue, occupancy, and patient growth.
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
                            <Button variant="outline" className="cursor-pointer" disabled={loading || !data}>
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

            {error && (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {kpis.map((kpi) => (
                    <Card key={kpi.title} className="border">
                        <CardContent className="space-y-3">
                            <kpi.icon className="text-muted-foreground size-6" />
                            <div className="space-y-1">
                                <p className="text-muted-foreground text-sm font-medium">{kpi.title}</p>
                                <div className="text-2xl font-bold">{loading ? "…" : kpi.value}</div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                    <CardDescription>Monthly billed revenue</CardDescription>
                    <CardAction className="text-sm text-muted-foreground">
                        {revenueData.length} months
                    </CardAction>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    {loading ? (
                        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                            Loading…
                        </div>
                    ) : (
                        <ChartContainer config={financeConfig} className="aspect-auto h-[280px] w-full">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={1.0} />
                                        <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={24}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <ChartLegend
                                    content={({ payload, verticalAlign }) => (
                                        <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />
                                    )}
                                />
                                <Area
                                    dataKey="revenue"
                                    type="natural"
                                    fill="url(#fillRevenue)"
                                    stroke="var(--color-revenue)"
                                />
                            </AreaChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            <Card className="@container/card">
                <CardHeader>
                    <CardTitle>Patient Growth</CardTitle>
                    <CardDescription>New vs. existing patients, stacked</CardDescription>
                    <CardAction className="text-sm text-muted-foreground">
                        {patientData.length} months
                    </CardAction>
                </CardHeader>
                <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
                    {loading ? (
                        <div className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                            Loading…
                        </div>
                    ) : (
                        <ChartContainer config={patientConfig} className="aspect-auto h-[280px] w-full">
                            <AreaChart data={patientData}>
                                <defs>
                                    <linearGradient id="fillNew" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-new)" stopOpacity={1.0} />
                                        <stop offset="95%" stopColor="var(--color-new)" stopOpacity={0.1} />
                                    </linearGradient>
                                    <linearGradient id="fillExisting" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--color-existing)" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="var(--color-existing)" stopOpacity={0.1} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={8}
                                    minTickGap={24}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dot" />}
                                />
                                <ChartLegend
                                    content={({ payload, verticalAlign }) => (
                                        <ChartLegendContent payload={payload} verticalAlign={verticalAlign} />
                                    )}
                                />
                                <Area
                                    dataKey="existing"
                                    type="natural"
                                    fill="url(#fillExisting)"
                                    stroke="var(--color-existing)"
                                    stackId="b"
                                />
                                <Area
                                    dataKey="new"
                                    type="natural"
                                    fill="url(#fillNew)"
                                    stroke="var(--color-new)"
                                    stackId="b"
                                />
                            </AreaChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}