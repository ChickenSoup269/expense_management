import React, { useMemo, useState, useEffect, useRef } from "react"
import { Transaction, DateFilter, Category } from "../types"
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  formatCurrency,
  formatNumberWithCommas,
} from "../constants"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts"
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Filter,
  CheckSquare,
  Square,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Download,
  CalendarDays,
  Upload,
  FileJson,
} from "lucide-react"

interface AnalyticsProps {
  transactions: Transaction[]
  onImportData?: (data: Transaction[]) => void
}

const formatCompactNumber = (value: number) => {
  if (value >= 1000000000)
    return `${(value / 1000000000).toFixed(1).replace(/\.0$/, "")}B`
  if (value >= 1000000)
    return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`
  return value.toString()
}

// Get all expense categories for the filter
const EXPENSE_CATEGORIES = Object.keys(CATEGORY_LABELS).filter(
  (k) => k !== "income"
) as Category[]

export const Analytics: React.FC<AnalyticsProps> = ({
  transactions,
  onImportData,
}) => {
  const [dateFilter, setDateFilter] = useState<DateFilter>("month")
  const [selectedCategories, setSelectedCategories] =
    useState<Category[]>(EXPENSE_CATEGORIES)

  // Custom Date Range State
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize custom dates when switching to custom view
  useEffect(() => {
    if (dateFilter === "custom" && !startDate) {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      setStartDate(firstDay.toISOString().split("T")[0])
      setEndDate(today.toISOString().split("T")[0])
    }
  }, [dateFilter])

  // Toggle Category Handler
  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    )
  }

  // Toggle All Handler
  const toggleAllCategories = () => {
    if (selectedCategories.length === EXPENSE_CATEGORIES.length) {
      setSelectedCategories([])
    } else {
      setSelectedCategories(EXPENSE_CATEGORIES)
    }
  }

  // Process Data for Main Charts
  const processedData = useMemo(() => {
    const now = new Date()
    // Filter by Type (Expense) AND Selected Categories
    let filtered = transactions.filter(
      (t) => t.type === "expense" && selectedCategories.includes(t.category)
    )

    let isMonthlyGrouping = false

    // Filter logic
    if (dateFilter === "week") {
      const oneWeekAgo = new Date(now)
      oneWeekAgo.setDate(now.getDate() - 7)
      filtered = filtered.filter((t) => new Date(t.date) >= oneWeekAgo)
    } else if (dateFilter === "month") {
      const thisMonth = now.getMonth()
      const thisYear = now.getFullYear()
      filtered = filtered.filter((t) => {
        const d = new Date(t.date)
        return d.getMonth() === thisMonth && d.getFullYear() === thisYear
      })
    } else if (dateFilter === "year") {
      const thisYear = now.getFullYear()
      filtered = filtered.filter(
        (t) => new Date(t.date).getFullYear() === thisYear
      )
      isMonthlyGrouping = true
    } else if (dateFilter === "custom") {
      if (startDate && endDate) {
        filtered = filtered.filter(
          (t) => t.date >= startDate && t.date <= endDate
        )

        // Check duration to decide grouping
        const start = new Date(startDate).getTime()
        const end = new Date(endDate).getTime()
        const daysDiff = (end - start) / (1000 * 3600 * 24)

        if (daysDiff > 60) {
          isMonthlyGrouping = true
        }
      }
    }

    // Group by Category for Pie Chart
    const categoryData = Object.entries(
      filtered.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)
    )
      .map(([key, value]) => ({
        name: CATEGORY_LABELS[key as keyof typeof CATEGORY_LABELS],
        key: key, // store original key for color mapping
        value: Number(value),
      }))
      .sort((a, b) => b.value - a.value)

    // Group by Date for Bar Chart
    const timeDataMap: Record<string, number> = {}

    filtered.forEach((t) => {
      let key = t.date
      // For Year view or long custom ranges, group by Month (YYYY-MM)
      if (isMonthlyGrouping) {
        const d = new Date(t.date)
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      }
      timeDataMap[key] = (timeDataMap[key] || 0) + t.amount
    })

    const timeData = Object.entries(timeDataMap)
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => a.key.localeCompare(b.key)) // Lexical sort works for ISO dates

    // Formatting date labels for chart display
    const formattedTimeData = timeData.map((d) => {
      let name = d.key
      if (isMonthlyGrouping) {
        // Convert YYYY-MM to MM/YYYY
        const parts = d.key.split("-")
        if (parts.length === 2) {
          const [year, month] = parts
          name = `${month}/${year}`
        }
      } else {
        // Convert YYYY-MM-DD to DD/MM
        const parts = d.key.split("-")
        if (parts.length === 3) {
          const [year, month, day] = parts
          name = `${day}/${month}`
        }
      }
      return { name, value: d.value, originalKey: d.key }
    })

    return {
      categoryData,
      timeData: formattedTimeData,
      total: filtered.reduce((sum, t) => sum + t.amount, 0),
    }
  }, [transactions, dateFilter, selectedCategories, startDate, endDate])

  // CSV Export Handler
  const handleExportCSV = () => {
    // 1. Category Data
    const catHeader = ["Category", "Amount"]
    const catRows = processedData.categoryData.map((c) => [
      c.name,
      `"${formatNumberWithCommas(c.value)}"`,
    ])

    // 2. Time Data
    const timeHeader = ["Date/Period", "Amount"]
    const timeRows = processedData.timeData.map((t) => [
      t.name,
      `"${formatNumberWithCommas(t.value)}"`,
    ])

    const reportTitle =
      dateFilter === "custom"
        ? `Spending Analytics (${startDate} to ${endDate})`
        : `Spending Analytics (${dateFilter})`

    const csvRows = [
      ["REPORT:", reportTitle],
      [],
      ["SECTION 1: CATEGORY BREAKDOWN"],
      catHeader,
      ...catRows,
      [],
      ["SECTION 2: TIME SERIES"],
      timeHeader,
      ...timeRows,
    ]

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      csvRows.map((e) => e.join(",")).join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute(
      "download",
      `analytics_export_${dateFilter}_${
        new Date().toISOString().split("T")[0]
      }.csv`
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  //  Hàm Export ra file JSON
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(transactions, null, 2)
    const blob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const link = document.createElement("a")
    link.href = url
    link.download = `backup_data_${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleTriggerImport = () => {
    // Kích hoạt thẻ input file ẩn
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedData = JSON.parse(content)

        // Validate cơ bản: Kiểm tra xem có phải mảng không
        if (Array.isArray(parsedData)) {
          // Kiểm tra xem phần tử đầu tiên có các trường quan trọng không (id, amount, date...)
          if (
            parsedData.length > 0 &&
            (!parsedData[0].amount || !parsedData[0].date)
          ) {
            alert("File JSON không đúng định dạng transaction!")
            return
          }

          if (onImportData) {
            if (
              window.confirm(
                `Bạn có chắc muốn import ${parsedData.length} giao dịch? Dữ liệu hiện tại sẽ bị thay thế hoặc gộp (tuỳ logic component cha).`
              )
            ) {
              onImportData(parsedData)
            }
          } else {
            alert(
              "Chức năng Import chưa được kết nối với dữ liệu gốc (thiếu prop onImportData)."
            )
          }
        } else {
          alert("File JSON phải chứa một danh sách (array) các giao dịch.")
        }
      } catch (error) {
        console.error("Lỗi parse JSON:", error)
        alert("File không hợp lệ hoặc bị lỗi.")
      }

      // Reset input để có thể chọn lại cùng 1 file nếu muốn
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
    reader.readAsText(file)
  }

  // Comparison Data
  const comparisonData = useMemo(() => {
    const now = new Date()
    // Apply category filter to comparison as well
    const expenseTransactions = transactions.filter(
      (t) => t.type === "expense" && selectedCategories.includes(t.category)
    )

    const stripTime = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

    const getSum = (start: Date, end: Date) => {
      const startTime = stripTime(start)
      const endTime = stripTime(end)
      return expenseTransactions
        .filter((t) => {
          const d = new Date(t.date)
          const time = stripTime(d)
          return time >= startTime && time <= endTime
        })
        .reduce((sum, t) => sum + t.amount, 0)
    }

    // 1. Week
    const today = new Date()
    const startThisWeek = new Date(today)
    startThisWeek.setDate(today.getDate() - 6)
    const startLastWeek = new Date(today)
    startLastWeek.setDate(today.getDate() - 13)
    const endLastWeek = new Date(today)
    endLastWeek.setDate(today.getDate() - 7)

    // 2. Month
    const startThisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    )
    const endLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    // 3. Year
    const startThisYear = new Date(today.getFullYear(), 0, 1)
    const startLastYear = new Date(today.getFullYear() - 1, 0, 1)
    const endLastYear = new Date(today.getFullYear() - 1, 11, 31)

    const createCompData = (
      title: string,
      current: number,
      previous: number,
      labelPrev: string,
      labelCur: string
    ) => {
      let percentChange = 0
      if (previous > 0) {
        percentChange = ((current - previous) / previous) * 100
      } else if (current > 0) {
        percentChange = 100
      }

      return {
        title,
        data: [
          { name: labelPrev, value: previous, fill: "#94a3b8" },
          { name: labelCur, value: current, fill: "#3b82f6" },
        ],
        current,
        previous,
        percentChange,
      }
    }

    return [
      createCompData(
        "7 Ngày Qua",
        getSum(startThisWeek, today),
        getSum(startLastWeek, endLastWeek),
        "7 ngày trước",
        "7 ngày qua"
      ),
      createCompData(
        "Tháng Này",
        getSum(startThisMonth, today),
        getSum(startLastMonth, endLastMonth),
        "Tháng trước",
        "Tháng này"
      ),
      createCompData(
        "Năm Nay",
        getSum(startThisYear, today),
        getSum(startLastYear, endLastYear),
        "Năm ngoái",
        "Năm nay"
      ),
    ]
  }, [transactions, selectedCategories])

  const renderTrend = (percent: number) => {
    if (percent === 0)
      return (
        <span className="text-slate-400 dark:text-slate-500 flex items-center text-xs font-medium">
          <Minus size={14} className="mr-1" />
          Không đổi
        </span>
      )

    const isIncrease = percent > 0
    const color = isIncrease ? "text-red-500" : "text-green-500"
    const Icon = isIncrease ? TrendingUp : TrendingDown

    return (
      <span
        className={`${color} flex items-center text-xs font-bold bg-white/50 dark:bg-slate-800/50 px-2 py-1 rounded-full border border-slate-100 dark:border-slate-700`}
      >
        <Icon size={14} className="mr-1" />
        {Math.abs(percent).toFixed(1)}%
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hidden File Input */}
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Section 1: Comparison Cards */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
          So Sánh Chi Tiêu{" "}
          {selectedCategories.length < EXPENSE_CATEGORIES.length && (
            <span className="text-xs font-normal text-slate-500 ml-2">
              (Đã lọc)
            </span>
          )}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {comparisonData.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                    {formatCurrency(item.current)}
                  </p>
                </div>
                {renderTrend(item.percentChange)}
              </div>

              <div className="h-[150px] w-full mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={item.data}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                    barSize={32}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                      strokeOpacity={0.1}
                    />
                    <XAxis dataKey="name" hide />
                    <Tooltip
                      formatter={(value: number) => formatCompactNumber(value)}
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        fontSize: "12px",
                        borderRadius: "8px",
                        border: "none",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {item.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-3 text-xs text-slate-400 border-t border-slate-50 dark:border-slate-800 pt-2">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                  {item.data[0].name}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  {item.data[1].name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-slate-100 dark:border-slate-800" />

      {/* Section 2: Detailed Breakdown Controls */}
      <div>
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 whitespace-nowrap">
            <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
            Chi Tiết Phân Tích
          </h3>

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-end sm:items-center">
            {/* Category Filter */}
            <div className="w-full sm:w-auto flex-1 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 pr-3 border-r border-slate-100 dark:border-slate-800 mr-1">
                  <Filter size={16} className="text-slate-400" />
                  <button
                    onClick={toggleAllCategories}
                    className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap"
                  >
                    {selectedCategories.length === EXPENSE_CATEGORIES.length
                      ? "Bỏ chọn"
                      : "Tất cả"}
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategories.includes(cat)
                    const color = CATEGORY_COLORS[cat]
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap border ${
                          isSelected
                            ? `bg-opacity-10 border-opacity-20`
                            : "bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 dark:text-slate-500"
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? color + "1A"
                            : undefined,
                          borderColor: isSelected ? color : undefined,
                          color: isSelected ? color : undefined,
                        }}
                      >
                        {isSelected ? (
                          <CheckSquare size={12} />
                        ) : (
                          <Square size={12} />
                        )}
                        {CATEGORY_LABELS[cat]}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {/* Time Filter Tabs */}
              <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 inline-flex shadow-sm whitespace-nowrap flex-shrink-0 transition-colors overflow-x-auto">
                {(["week", "month", "year", "custom"] as DateFilter[]).map(
                  (f) => (
                    <button
                      key={f}
                      onClick={() => setDateFilter(f)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                        dateFilter === f
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
                      }`}
                    >
                      {f === "week" && "Tuần"}
                      {f === "month" && "Tháng"}
                      {f === "year" && "Năm"}
                      {f === "custom" && "Tùy chọn"}
                    </button>
                  )
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {/* Export CSV */}
                <button
                  onClick={handleExportCSV}
                  className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 text-xs font-medium"
                  title="Xuất Excel/CSV"
                >
                  <Download size={16} />{" "}
                  <span className="hidden sm:inline">CSV</span>
                </button>

                {/* Export JSON */}
                <button
                  onClick={handleExportJSON}
                  className="bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 text-xs font-medium"
                  title="Backup dữ liệu (JSON)"
                >
                  <FileJson size={16} />{" "}
                  <span className="hidden sm:inline">JSON</span>
                </button>

                {/* Import JSON */}
                <button
                  onClick={handleTriggerImport}
                  className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 p-2.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm flex items-center gap-2 text-xs font-medium"
                  title="Khôi phục dữ liệu"
                >
                  <Upload size={16} />{" "}
                  <span className="hidden sm:inline">Import</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker Inputs */}
        {dateFilter === "custom" && (
          <div className="mb-6 flex items-center gap-4 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30 animate-in fade-in slide-in-from-top-2">
            <CalendarDays
              size={20}
              className="text-blue-600 dark:text-blue-400"
            />
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-slate-400">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-6">
              Cơ Cấu Chi Tiêu
            </h4>
            {processedData.categoryData.length > 0 ? (
              <>
                <div className="h-[300px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={processedData.categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {processedData.categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              CATEGORY_COLORS[
                                entry.key as keyof typeof CATEGORY_COLORS
                              ] || "#cbd5e1"
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) =>
                          formatCompactNumber(value)
                        }
                        contentStyle={{
                          backgroundColor: "#fff",
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        itemStyle={{ color: "#1e293b" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Text for Total */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <p className="text-xs text-slate-400">Tổng Chi</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {formatCompactNumber(processedData.total)}
                    </p>
                  </div>
                </div>
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:text-sm max-h-40 overflow-y-auto custom-scrollbar">
                  {processedData.categoryData.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[
                                item.key as keyof typeof CATEGORY_COLORS
                              ],
                          }}
                        ></div>
                        <span className="text-slate-600 dark:text-slate-300 truncate max-w-[80px] sm:max-w-full">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">
                        {((item.value / processedData.total) * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <PieChartIcon className="opacity-20 mb-2" size={48} />
                <p>Không có dữ liệu cho bộ lọc này</p>
              </div>
            )}
          </div>

          {/* Bar Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-6">
              Biến Động Theo Thời Gian
            </h4>
            {processedData.timeData.length > 0 ? (
              <>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={processedData.timeData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                        strokeOpacity={0.1}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        tickFormatter={(value) => formatCompactNumber(value)}
                      />
                      <Tooltip
                        formatter={(value: number) =>
                          formatCompactNumber(value)
                        }
                        cursor={{ fill: "rgba(255,255,255,0.1)" }}
                        contentStyle={{
                          backgroundColor: "#fff",
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                        itemStyle={{ color: "#3b82f6" }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700 flex items-start gap-3 transition-colors">
                  <Calendar
                    className="text-slate-400 mt-0.5 flex-shrink-0"
                    size={18}
                  />
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    <p>
                      Trong{" "}
                      {dateFilter === "week"
                        ? "tuần này"
                        : dateFilter === "month"
                        ? "tháng này"
                        : dateFilter === "year"
                        ? "năm nay"
                        : "khoảng thời gian này"}
                      , bạn đã chi tiêu tổng cộng{" "}
                      <span className="font-bold text-slate-800 dark:text-white">
                        {formatCurrency(processedData.total)}
                      </span>{" "}
                      cho các danh mục đã chọn.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-2">
                  <BarChartIcon className="opacity-20" size={32} />
                </div>
                <p>Chưa có dữ liệu</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Trend Line */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
          <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
          Xu Hướng Chi Tiêu
        </h3>
        {processedData.timeData.length > 0 ? (
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={processedData.timeData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                  strokeOpacity={0.1}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  tickFormatter={(value) => formatCompactNumber(value)}
                />
                <Tooltip
                  formatter={(value: number) => formatCompactNumber(value)}
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#3b82f6" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#3b82f6",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[300px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full mb-2">
              <TrendingUp className="opacity-20" size={32} />
            </div>
            <p>Chưa có dữ liệu</p>
          </div>
        )}
      </div>
    </div>
  )
}
