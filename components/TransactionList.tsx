import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { formatCurrency, CATEGORY_LABELS, formatNumberWithCommas } from '../constants';
import { Edit2, Trash2, Search, Plus, ArrowUpCircle, ArrowDownCircle, Wallet, AlertTriangle, CheckSquare, Square, X, Download } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  onDeleteMany: (ids: string[]) => void;
  onAdd: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onEdit, onDelete, onDeleteMany, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [idsToDelete, setIdsToDelete] = useState<string[]>([]); // Unified delete state

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesSearch = t.note.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              CATEGORY_LABELS[t.category].toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, filterType]);

  // Calculate statistics for the current view
  const { totalIncome, totalExpense } = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === 'income') acc.totalIncome += t.amount;
      else acc.totalExpense += t.amount;
      return acc;
    }, { totalIncome: 0, totalExpense: 0 });
  }, [filteredTransactions]);

  const balance = totalIncome - totalExpense;

  // Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedIds(filteredTransactions.map(t => t.id));
    } else {
        setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Delete Handlers
  const confirmDelete = () => {
    if (idsToDelete.length > 0) {
      if (idsToDelete.length === 1) {
        onDelete(idsToDelete[0]);
      } else {
        onDeleteMany(idsToDelete);
        setSelectedIds([]); // Clear selection after bulk delete
      }
      setIdsToDelete([]);
    }
  };

  const handleExportCSV = () => {
    const header = ['Date', 'Type', 'Category', 'Note', 'Amount'];
    const rows = filteredTransactions.map(t => [
      t.date,
      t.type === 'income' ? 'Thu' : 'Chi',
      CATEGORY_LABELS[t.category],
      `"${t.note.replace(/"/g, '""')}"`, // Escape quotes in note
      `"${formatNumberWithCommas(t.amount)}"`
    ]);

    const csvRows = [
        ['TRANSACTION REPORT'],
        [],
        header,
        ...rows,
        [],
        ['Total Income', `"${formatNumberWithCommas(totalIncome)}"`],
        ['Total Expense', `"${formatNumberWithCommas(totalExpense)}"`],
        ['Balance', `"${formatNumberWithCommas(balance)}"`],
    ];

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // BOM for Excel
        + csvRows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isAllSelected = filteredTransactions.length > 0 && selectedIds.length === filteredTransactions.length;

  return (
    <div className="flex flex-col gap-6 relative">
      
      {/* Summary Cards for Current View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
            <ArrowUpCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Tổng Thu (Lọc)</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(totalIncome)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-full text-red-600 dark:text-red-400">
            <ArrowDownCircle size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Tổng Chi (Lọc)</p>
            <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(totalExpense)}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Chênh Lệch</p>
            <p className={`text-lg font-bold ${balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
              {balance >= 0 ? '+' : ''}{formatCurrency(balance)}
            </p>
          </div>
        </div>
      </div>

      {/* Transaction List Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col h-[calc(100vh-300px)] transition-colors">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            {selectedIds.length > 0 ? (
                 /* Bulk Action Toolbar */
                 <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 -m-2 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                     <div className="flex items-center gap-3">
                         <div className="flex items-center justify-center bg-blue-600 text-white w-6 h-6 rounded-full text-xs font-bold">
                             {selectedIds.length}
                         </div>
                         <span className="text-blue-900 dark:text-blue-200 font-medium text-sm">đã chọn</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <button 
                            onClick={() => setSelectedIds([])}
                            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-sm px-3 py-1.5 font-medium"
                         >
                             Bỏ chọn
                         </button>
                         <button 
                            onClick={() => setIdsToDelete(selectedIds)}
                            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
                         >
                             <Trash2 size={16} />
                             <span className="hidden sm:inline">Xóa {selectedIds.length} mục</span>
                             <span className="sm:hidden">Xóa</span>
                         </button>
                     </div>
                 </div>
            ) : (
                /* Standard Toolbar */
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                        type="text" 
                        placeholder="Tìm kiếm giao dịch..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-800 dark:text-white transition-colors"
                        />
                    </div>
                    
                    <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-between sm:justify-end items-center">
                        <div className="flex bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-100 dark:border-slate-700">
                            <button 
                                onClick={() => setFilterType('all')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'all' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Tất cả
                            </button>
                            <button 
                                onClick={() => setFilterType('expense')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'expense' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Chi
                            </button>
                            <button 
                                onClick={() => setFilterType('income')}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${filterType === 'income' ? 'bg-white dark:bg-slate-700 text-green-600 dark:text-green-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                Thu
                            </button>
                        </div>

                        {/* Export CSV */}
                        <button 
                            onClick={handleExportCSV}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 p-2 rounded-lg transition-colors"
                            title="Xuất CSV"
                        >
                            <Download size={18} />
                        </button>

                        {/* Add Button */}
                        <button 
                            onClick={onAdd}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Thêm Mới</span>
                            <span className="sm:hidden">Thêm</span>
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 transition-colors">
          <div className="col-span-1 flex justify-center">
              <input 
                type="checkbox" 
                checked={isAllSelected} 
                onChange={handleSelectAll}
                className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer bg-white dark:bg-slate-700"
              />
          </div>
          <div className="col-span-2">Ngày</div>
          <div className="col-span-3">Danh mục</div>
          <div className="col-span-3">Ghi chú</div>
          <div className="col-span-2 text-right">Số tiền</div>
          <div className="col-span-1 text-center">Thao tác</div>
        </div>

        {/* List Content */}
        <div className="overflow-auto flex-1 bg-white dark:bg-slate-900 transition-colors">
          {filteredTransactions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTransactions.map((t) => (
                <div key={t.id} className={`group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.includes(t.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                  {/* Desktop Row */}
                  <div className="hidden md:grid grid-cols-12 gap-4 p-4 items-center text-sm text-slate-700 dark:text-slate-300">
                    <div className="col-span-1 flex justify-center">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.includes(t.id)}
                            onChange={() => handleSelectOne(t.id)}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer bg-white dark:bg-slate-700"
                        />
                    </div>
                    <div className="col-span-2 font-medium text-slate-900 dark:text-white">{t.date}</div>
                    <div className="col-span-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                        t.type === 'expense' 
                          ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-900/30' 
                          : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-100 dark:border-green-900/30'
                      }`}>
                        {CATEGORY_LABELS[t.category]}
                      </span>
                    </div>
                    <div className="col-span-3 truncate font-medium text-slate-700 dark:text-slate-300">{t.note}</div>
                    <div className={`col-span-2 text-right font-bold ${t.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                      {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                    </div>
                    <div className="col-span-1 flex justify-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onEdit(t); }} 
                        className="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                        title="Sửa giao dịch"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIdsToDelete([t.id]); }} 
                        className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        title="Xóa giao dịch"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Card */}
                  <div className="md:hidden p-4 flex gap-3 items-start">
                    <div className="pt-1">
                        <input 
                            type="checkbox" 
                            checked={selectedIds.includes(t.id)}
                            onChange={() => handleSelectOne(t.id)}
                            className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer bg-white dark:bg-slate-700"
                        />
                    </div>
                    <div className="flex-1 flex justify-between items-start">
                        <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${t.type === 'expense' ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{t.note}</p>
                        </div>
                        <div className="flex gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{t.date}</span>
                            <span>•</span>
                            <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{CATEGORY_LABELS[t.category]}</span>
                        </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                        <span className={`font-bold ${t.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                        </span>
                        <div className="flex gap-3">
                            <button onClick={(e) => { e.stopPropagation(); onEdit(t); }} className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1"><Edit2 size={18} /></button>
                            <button onClick={(e) => { e.stopPropagation(); setIdsToDelete([t.id]); }} className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 p-1"><Trash2 size={18} /></button>
                        </div>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-8">
                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-full mb-3 transition-colors">
                    <Search size={32} className="opacity-50" />
                  </div>
                  <p className="font-medium">Không tìm thấy giao dịch nào</p>
                  {searchTerm && <p className="text-sm mt-1">Thử tìm với từ khóa khác</p>}
                  {!searchTerm && (
                    <button onClick={onAdd} className="mt-4 text-blue-600 dark:text-blue-400 font-medium hover:underline">
                      Tạo giao dịch mới ngay
                    </button>
                  )}
              </div>
          )}
        </div>
      </div>

      {/* Custom Delete Modal (Unified) */}
      {idsToDelete.length > 0 && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-800">
            <div className="p-6 text-center">
              <div className="mx-auto bg-red-100 dark:bg-red-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4 text-red-600 dark:text-red-400">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Xác nhận xóa?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                Bạn có chắc chắn muốn xóa {idsToDelete.length > 1 ? <span className="font-bold text-slate-800 dark:text-slate-200">{idsToDelete.length} giao dịch</span> : 'giao dịch này'} không? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIdsToDelete([])}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                >
                  Xóa {idsToDelete.length > 1 ? `(${idsToDelete.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};