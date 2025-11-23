import React from "react"
import {
  LayoutDashboard,
  List,
  PieChart,
  Wallet,
  Moon,
  Sun,
  Settings,
  Key,
} from "lucide-react"
import { ViewMode } from "../types"

interface SidebarProps {
  currentView: ViewMode
  onChangeView: (view: ViewMode) => void
  theme: "light" | "dark"
  toggleTheme: () => void
  onOpenKeyModal: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  theme,
  toggleTheme,
  onOpenKeyModal,
}) => {
  const navItems = [
    { id: "dashboard", label: "Tổng Quan", icon: LayoutDashboard },
    { id: "transactions", label: "Sổ Giao Dịch", icon: List },
    { id: "analytics", label: "Báo Cáo", icon: PieChart },
  ]

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full transition-colors duration-200">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="bg-blue-600 p-2 rounded-lg text-white">
          <Wallet size={24} />
        </div>
        <span className="font-bold text-xl text-slate-800 dark:text-white">
          SmartMoney
        </span>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id as ViewMode)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        {/* API Key Settings */}
        <button
          onClick={onOpenKeyModal}
          className="flex items-center gap-3 w-full px-4 py-3 mb-1 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <Key size={20} />
          Cài đặt API Key
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-3 w-full px-4 py-3 mb-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "light" ? <Moon size={20} /> : <Sun size={20} />}
          {theme === "light" ? "Chế độ tối" : "Chế độ sáng"}
        </button>

        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 transition-colors mt-2">
          <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-1">
            Mẹo nhỏ
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Ghi chép chi tiêu ngay khi thanh toán giúp bạn kiểm soát dòng tiền
            tốt hơn 20%.
          </p>
        </div>
      </div>
    </aside>
  )
}
