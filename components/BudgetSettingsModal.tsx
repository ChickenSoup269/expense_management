import React, { useState, useEffect } from "react"
import { Budget, Category } from "../types"
import { CATEGORY_LABELS, formatInputNumber } from "../constants"
import { X, Save, DollarSign, Wallet, Target } from "lucide-react"

interface BudgetSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentBudget: Budget
  onSave: (newBudget: Budget) => void
}

// Lọc bỏ danh mục 'income' vì không đặt hạn mức chi cho thu nhập
const EXPENSE_CATEGORIES = Object.keys(CATEGORY_LABELS).filter(
  (k) => k !== "income"
) as Category[]

export const BudgetSettingsModal: React.FC<BudgetSettingsModalProps> = ({
  isOpen,
  onClose,
  currentBudget,
  onSave,
}) => {
  // State cục bộ để lưu dữ liệu form đang nhập
  const [formData, setFormData] = useState<Budget>(currentBudget)

  // Mỗi khi mở modal, reset form về giá trị hiện tại
  useEffect(() => {
    if (isOpen) {
      setFormData(currentBudget)
    }
  }, [isOpen, currentBudget])

  if (!isOpen) return null

  // Xử lý thay đổi input số tiền (có format dấu phẩy)
  const handleInputChange = (
    field: keyof Budget | "categoryLimit",
    value: string,
    category?: Category
  ) => {
    // Xóa dấu phẩy để lấy số raw
    const rawValue = parseInt(value.replace(/,/g, "") || "0", 10)

    if (field === "categoryLimit" && category) {
      // Update hạn mức danh mục con
      setFormData((prev) => ({
        ...prev,
        categoryLimits: {
          ...prev.categoryLimits,
          [category]: rawValue,
        },
      }))
    } else if (field !== "categoryLimit") {
      // Update các trường chính (monthlyLimit, savingsGoal)
      setFormData((prev) => ({
        ...prev,
        [field]: rawValue,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">
              Cài Đặt Ngân Sách
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Thiết lập mục tiêu và hạn mức chi tiêu hàng tháng
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Section 1: Cài đặt chung */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Wallet size={16} /> Tổng Quan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tổng hạn mức tháng */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Giới hạn chi tiêu tháng
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₫
                  </span>
                  <input
                    type="text"
                    value={formatInputNumber(formData.monthlyLimit.toString())}
                    onChange={(e) =>
                      handleInputChange("monthlyLimit", e.target.value)
                    }
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-800 dark:text-white transition-all"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Mục tiêu tiết kiệm */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mục tiêu tiết kiệm
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    ₫
                  </span>
                  <input
                    type="text"
                    value={formatInputNumber(formData.savingsGoal.toString())}
                    onChange={(e) =>
                      handleInputChange("savingsGoal", e.target.value)
                    }
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-bold text-slate-800 dark:text-white transition-all"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </section>

          <hr className="border-slate-100 dark:border-slate-800" />

          {/* Section 2: Hạn mức từng danh mục */}
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <Target size={16} /> Hạn Mức Chi Tiết
              </h3>
              <span className="text-xs text-slate-400 italic">
                Để trống hoặc điền 0 nếu không muốn giới hạn
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EXPENSE_CATEGORIES.map((cat) => (
                <div
                  key={cat}
                  className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {CATEGORY_LABELS[cat]}
                    </p>
                  </div>
                  <div className="relative w-32 sm:w-40">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      ₫
                    </span>
                    <input
                      type="text"
                      value={formatInputNumber(
                        (formData.categoryLimits[cat] || 0).toString()
                      )}
                      onChange={(e) =>
                        handleInputChange("categoryLimit", e.target.value, cat)
                      }
                      onFocus={(e) => e.target.select()} // Tự bôi đen khi click vào
                      className="w-full pl-6 pr-3 py-1.5 text-sm text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-800 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
          >
            <Save size={18} />
            Lưu Thay Đổi
          </button>
        </div>
      </div>
    </div>
  )
}
