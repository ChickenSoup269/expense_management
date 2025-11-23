import React, { useState } from 'react';
import { Transaction, Budget } from '../types';
import { formatCurrency } from '../constants';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Sparkles, PiggyBank, Loader2, Key } from 'lucide-react';
import { analyzeSpending } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface DashboardProps {
  transactions: Transaction[];
  budget: Budget;
  onAddClick: () => void;
  apiKey: string;
  onOpenKeyModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ transactions, budget, onAddClick, apiKey, onOpenKeyModal }) => {
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Calculate Totals (Current Month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthTrans = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalIncome = thisMonthTrans
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = thisMonthTrans
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const savingsProgress = (balance / budget.savingsGoal) * 100;

  const handleAiAnalyze = async () => {
    if (!apiKey) {
        onOpenKeyModal();
        return;
    }
    setIsLoadingAi(true);
    const advice = await analyzeSpending(transactions, budget, apiKey);
    setAiAdvice(advice);
    setIsLoadingAi(false);
  };

  return (
    <div className="space-y-6">
      {/* Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-600 dark:text-green-400">
              <ArrowUpCircle size={20} />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Thu Nhập Tháng Này</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg text-red-600 dark:text-red-400">
              <ArrowDownCircle size={20} />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Chi Tiêu Tháng Này</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(totalExpense)}</p>
          <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${totalExpense > budget.monthlyLimit ? 'bg-red-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min((totalExpense / budget.monthlyLimit) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            {Math.round((totalExpense / budget.monthlyLimit) * 100)}% ngân sách
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg text-purple-600 dark:text-purple-400">
              <PiggyBank size={20} />
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium">Tiết Kiệm Thực Tế</h3>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{formatCurrency(balance)}</p>
           <div className="mt-2 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-purple-500 rounded-full"
              style={{ width: `${Math.min(Math.max(savingsProgress, 0), 100)}%` }}
            />
          </div>
           <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Mục tiêu: {formatCurrency(budget.savingsGoal)}
          </p>
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Sparkles size={100} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-yellow-300" />
                    <h2 className="text-xl font-bold">Trợ Lý Tài Chính AI</h2>
                </div>
                <div className="flex gap-2">
                    {!apiKey && (
                        <button
                            onClick={onOpenKeyModal}
                            className="flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                        >
                            <Key size={16} />
                            Nhập Key
                        </button>
                    )}
                    <button 
                        onClick={handleAiAnalyze}
                        disabled={isLoadingAi}
                        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoadingAi && <Loader2 size={16} className="animate-spin" />}
                        {isLoadingAi ? 'Đang phân tích...' : 'Phân tích ngay'}
                    </button>
                </div>
            </div>
            
            {aiAdvice ? (
                <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm text-sm leading-relaxed">
                    <ReactMarkdown 
                        components={{
                            p: ({children}) => <p className="mb-3 last:mb-0 text-indigo-50">{children}</p>,
                            ul: ({children}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-indigo-50">{children}</ul>,
                            li: ({children}) => <li className="leading-relaxed">{children}</li>,
                            strong: ({children}) => <strong className="font-bold text-yellow-200">{children}</strong>,
                            h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
                            h2: ({children}) => <h2 className="text-base font-bold mb-2 text-white">{children}</h2>,
                            h3: ({children}) => <h3 className="text-sm font-bold mb-1 text-white">{children}</h3>,
                        }}
                    >
                        {aiAdvice}
                    </ReactMarkdown>
                </div>
            ) : (
                <p className="text-indigo-100 text-sm max-w-2xl">
                    Sử dụng công nghệ AI để phân tích thói quen chi tiêu của bạn dựa trên ngân sách và lịch sử giao dịch. Nhấn nút "Phân tích ngay" để nhận báo cáo chi tiết.
                </p>
            )}
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 dark:text-slate-200">Giao dịch gần đây</h3>
            <button onClick={() => {}} className="text-blue-600 dark:text-blue-400 text-sm hover:underline">Xem tất cả</button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.slice(0, 5).map(t => (
                <div key={t.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${t.type === 'expense' ? 'bg-red-400' : 'bg-green-400'}`}></div>
                        <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">{t.note}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">{t.date} • {formatCurrency(Math.abs(t.amount))}</p>
                        </div>
                    </div>
                    <span className={`font-semibold ${t.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                    </span>
                </div>
            ))}
            {transactions.length === 0 && (
                <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Chưa có giao dịch nào.
                    <button onClick={onAddClick} className="text-blue-600 dark:text-blue-400 ml-1 hover:underline">Thêm ngay</button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};