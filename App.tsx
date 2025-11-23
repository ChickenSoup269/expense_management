import React, { useState, useEffect, useMemo } from "react"
import { Transaction, ViewMode, DateFilter, Budget } from "./types"
import { MOCK_TRANSACTIONS, DEFAULT_BUDGET } from "./constants"
import { Dashboard } from "./components/Dashboard"
import { TransactionList } from "./components/TransactionList"
import { Analytics } from "./components/Analytics"
import { Sidebar } from "./components/Sidebar"
import { LayoutDashboard, List, PieChart, PlusCircle, X } from "lucide-react"
import { TransactionForm } from "./components/TransactionForm"

const App: React.FC = () => {
  // State
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    // Ưu tiên lấy từ LocalStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("transactions")
      return saved ? JSON.parse(saved) : MOCK_TRANSACTIONS
    }
    return MOCK_TRANSACTIONS
  })

  const [budget, setBudget] = useState<Budget>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("budget")
      return saved ? JSON.parse(saved) : DEFAULT_BUDGET
    }
    return DEFAULT_BUDGET
  })

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme")
      if (saved === "dark" || saved === "light") return saved
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }
    return "light"
  })

  // View Persistence
  const [currentView, setCurrentView] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const savedView = localStorage.getItem("currentView")
      return (savedView as ViewMode) || "dashboard"
    }
    return "dashboard"
  })

  // API Key State
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("gemini_api_key") || ""
    }
    return ""
  })
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editTransaction, setEditTransaction] = useState<Transaction | null>(
    null
  )

  // Effects
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions))
  }, [transactions])

  useEffect(() => {
    localStorage.setItem("budget", JSON.stringify(budget))
  }, [budget])

  useEffect(() => {
    const root = window.document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem("currentView", currentView)
  }, [currentView])

  // Safe ID Generator
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
  }

  // Handlers
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
  }

  const saveApiKey = (key: string) => {
    setApiKey(key)
    localStorage.setItem("gemini_api_key", key)
    setIsKeyModalOpen(false)
  }

  const handleAddTransaction = (transaction: Omit<Transaction, "id">) => {
    const newTransaction = {
      ...transaction,
      id: generateId(),
    }
    setTransactions((prev) => [newTransaction, ...prev])
    setIsFormOpen(false)
  }

  const handleEditTransaction = (updatedTransaction: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTransaction.id ? updatedTransaction : t))
    )
    setIsFormOpen(false)
    setEditTransaction(null)
  }

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id))
  }

  const handleDeleteManyTransactions = (ids: string[]) => {
    setTransactions((prev) => prev.filter((t) => !ids.includes(t.id)))
  }

  // --- MOI: HÀM XỬ LÝ IMPORT DATA JSON ---
  const handleImportData = (importedData: Transaction[]) => {
    // Có thể chọn 1 trong 2 cách:

    // Cách 1: Ghi đè toàn bộ (Restore backup) - Đơn giản, sạch sẽ
    setTransactions(importedData)

    /* 
    // Cách 2: Merge (Gộp) - Phức tạp hơn, cần tránh trùng ID
    setTransactions(prev => {
        const existingIds = new Set(prev.map(t => t.id));
        const newUniqueData = importedData.filter(t => !existingIds.has(t.id));
        return [...newUniqueData, ...prev];
    }); 
    */

    alert(`Đã khôi phục thành công ${importedData.length} giao dịch!`)
  }
  // ----------------------------------------

  const openEditModal = (t: Transaction) => {
    setEditTransaction(t)
    setIsFormOpen(true)
  }

  const openAddModal = () => {
    setEditTransaction(null)
    setIsFormOpen(true)
  }

  // Render View
  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <Dashboard
            transactions={transactions}
            budget={budget}
            onAddClick={openAddModal}
            apiKey={apiKey}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
          />
        )
      case "transactions":
        return (
          <TransactionList
            transactions={transactions}
            onEdit={openEditModal}
            onDelete={handleDeleteTransaction}
            onDeleteMany={handleDeleteManyTransactions}
            onAdd={openAddModal}
          />
        )
      case "analytics":
        return (
          <Analytics
            transactions={transactions}
            // --- MOI: TRUYỀN HÀM IMPORT XUỐNG ---
            onImportData={handleImportData}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-200">
      {/* Sidebar (Desktop) */}
      <Sidebar
        currentView={currentView}
        onChangeView={setCurrentView}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-24 md:pb-8">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors">
                {currentView === "dashboard" && "Tổng Quan"}
                {currentView === "transactions" && "Sổ Giao Dịch"}
                {currentView === "analytics" && "Báo Cáo & Phân Tích"}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 transition-colors">
                Quản lý tài chính cá nhân hiệu quả
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
            >
              <PlusCircle size={20} />
              <span className="hidden sm:inline">Thêm Chi Tiêu</span>
            </button>
          </header>

          {renderView()}
        </div>
      </main>

      {/* Transaction Form Modal */}
      {isFormOpen && (
        <TransactionForm
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={
            editTransaction ? handleEditTransaction : handleAddTransaction
          }
          initialData={editTransaction}
        />
      )}

      {/* API Key Modal */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Cấu hình API Key
              </h3>
              <button
                onClick={() => setIsKeyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Để sử dụng tính năng phân tích AI, bạn cần cung cấp Google
                Gemini API Key. Key của bạn sẽ được lưu trữ cục bộ trên trình
                duyệt.
              </p>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                defaultValue={apiKey}
                id="apiKeyInput"
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all mb-4"
                placeholder="Nhập API Key của bạn..."
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    const input = document.getElementById(
                      "apiKeyInput"
                    ) as HTMLInputElement
                    saveApiKey(input.value)
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Lưu Key
                </button>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 text-center">
                Bạn có thể lấy key miễn phí tại{" "}
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 underline"
                >
                  Google AI Studio
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
