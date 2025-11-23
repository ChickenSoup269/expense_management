import { Category, Transaction, Budget } from "./types"
import {
  Utensils,
  Bus,
  Lightbulb,
  ShoppingBag,
  Film,
  HeartPulse,
  GraduationCap,
  Wallet,
  MoreHorizontal,
} from "lucide-react"

export const CATEGORY_LABELS: Record<Category, string> = {
  food: "Ăn uống",
  transport: "Di chuyển",
  utilities: "Hóa đơn",
  shopping: "Mua sắm",
  entertainment: "Giải trí",
  health: "Sức khỏe",
  education: "Giáo dục",
  income: "Thu nhập",
  other: "Khác",
}

export const CATEGORY_COLORS: Record<Category, string> = {
  food: "#F87171", // Red 400
  transport: "#60A5FA", // Blue 400
  utilities: "#FBBF24", // Amber 400
  shopping: "#A78BFA", // Violet 400
  entertainment: "#F472B6", // Pink 400
  health: "#34D399", // Emerald 400
  education: "#2DD4BF", // Teal 400
  income: "#10B981", // Emerald 500
  other: "#94A3B8", // Slate 400
}

// Mock Data Generation
const generateMockData = (): Transaction[] => {
  const today = new Date()
  const data: Transaction[] = []

  const categories: Category[] = [
    "food",
    "transport",
    "shopping",
    "utilities",
    "entertainment",
  ]

  // Generate last 30 days of data
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    // 1-3 transactions per day
    const count = Math.floor(Math.random() * 3) + 1

    for (let j = 0; j < count; j++) {
      const isIncome = Math.random() > 0.9 // 10% chance of income
      const category = isIncome
        ? "income"
        : categories[Math.floor(Math.random() * categories.length)]

      data.push({
        id: crypto.randomUUID(),
        date: dateStr,
        type: isIncome ? "income" : "expense",
        category: category as Category,
        amount: isIncome
          ? Math.floor(Math.random() * 5000000) + 2000000
          : Math.floor(Math.random() * 500000) + 30000,
        note: isIncome
          ? "Lương/Thưởng"
          : `Chi tiêu ${CATEGORY_LABELS[category as Category]}`,
      })
    }
  }
  return data
}

export const MOCK_TRANSACTIONS: Transaction[] = generateMockData()

export const DEFAULT_BUDGET: Budget = {
  monthlyLimit: 15000000,
  savingsGoal: 5000000,
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount)
}

// Formats number with commas for display/CSV (e.g., 1000000 -> "1,000,000")
export const formatNumberWithCommas = (value: number | string): string => {
  if (!value && value !== 0) return ""
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

// Handles input formatting: removes non-digits then adds commas
export const formatInputNumber = (value: string): string => {
  if (!value) return ""
  // Remove all non-digits
  const cleanValue = value.replace(/\D/g, "")
  // Add commas
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}
