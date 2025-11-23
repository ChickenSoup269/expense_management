import React, { useState, useEffect } from 'react';
import { Transaction, Category, TransactionType } from '../types';
import { CATEGORY_LABELS, formatInputNumber } from '../constants';
import { X } from 'lucide-react';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: any) => void;
  initialData?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<Category>('food');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmountStr(formatInputNumber(initialData.amount.toString()));
      setDate(initialData.date);
      setCategory(initialData.category);
      setNote(initialData.note);
    } else {
      // Reset form
      setType('expense');
      setAmountStr('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('food');
      setNote('');
    }
  }, [initialData, isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setAmountStr(formatInputNumber(input));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove commas to get raw number
    const rawAmount = parseInt(amountStr.replace(/,/g, ''), 10);
    
    if (!rawAmount || isNaN(rawAmount)) {
      alert("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    onSubmit({
      ...(initialData && { id: initialData.id }),
      type,
      amount: rawAmount,
      date,
      category,
      note
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            {initialData ? 'Sửa Giao Dịch' : 'Thêm Giao Dịch Mới'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Toggle Type */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors">
            <button
              type="button"
              onClick={() => { setType('expense'); if(category === 'income') setCategory('food'); }}
              className={`py-2 text-sm font-medium rounded-md transition-all ${type === 'expense' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Chi Tiêu
            </button>
            <button
              type="button"
              onClick={() => { setType('income'); setCategory('income'); }}
              className={`py-2 text-sm font-medium rounded-md transition-all ${type === 'income' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
            >
              Thu Nhập
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Số tiền (VND)</label>
            <input
              type="text"
              required
              value={amountStr}
              onChange={handleAmountChange}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="0"
            />
          </div>

          {/* Category */}
          <div>
             <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Danh mục</label>
             <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                disabled={type === 'income'}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
             >
               {type === 'income' ? (
                 <option value="income">Thu nhập</option>
               ) : (
                 Object.entries(CATEGORY_LABELS)
                   .filter(([key]) => key !== 'income')
                   .map(([key, label]) => (
                     <option key={key} value={key}>{label}</option>
                   ))
               )}
             </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ngày</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ghi chú</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="Ví dụ: Ăn trưa..."
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-600/30 transition-all active:scale-[0.98]"
            >
              {initialData ? 'Lưu Thay Đổi' : 'Thêm Giao Dịch'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};