import { GoogleGenAI } from "@google/genai";
import { Transaction, Category, Budget } from "../types";
import { CATEGORY_LABELS, formatCurrency } from "../constants";

export const analyzeSpending = async (transactions: Transaction[], budget: Budget, apiKey: string): Promise<string> => {
  if (!apiKey) {
    return "Vui lòng nhập API Key của bạn để sử dụng tính năng này.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Prepare data summary for AI to reduce token usage
    const last30Days = transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 50); // Analyze last 50 transactions to keep context small

    const summary = last30Days.map(t => 
      `- ${t.date}: ${t.type === 'income' ? '+' : '-'}${t.amount} VND (${CATEGORY_LABELS[t.category]}) - ${t.note}`
    ).join('\n');

    // Calculate current totals for context
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonthTrans = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const totalExpense = thisMonthTrans
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const prompt = `
      Bạn là một chuyên gia tài chính cá nhân. Dưới đây là thông tin tài chính của tôi.
      
      Thông tin ngân sách tháng này:
      - Hạn mức chi tiêu: ${formatCurrency(totalExpense)} / ${formatCurrency(budget.monthlyLimit)}
      - Mục tiêu tiết kiệm: ${formatCurrency(budget.savingsGoal)}
      
      Danh sách giao dịch gần đây (50 giao dịch mới nhất):
      ${summary}

      Yêu cầu trả lời:
      1. Nhận xét về tình hình thực hiện ngân sách (Bạn có đang tiêu quá tay không?).
      2. Phân tích thói quen chi tiêu: Chỉ ra các mục tiêu tốn kém nhất.
      3. Đưa ra 1-2 lời khuyên cụ thể, hành động ngay để đạt mục tiêu tiết kiệm hoặc giữ ngân sách.
      
      Hãy trả lời bằng tiếng Việt, giọng điệu thân thiện, khích lệ nhưng thẳng thắn nếu chi tiêu quá đà. 
      Định dạng Markdown: Sử dụng danh sách (bullet points), in đậm (bold) cho các con số quan trọng hoặc từ khóa.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Không thể phân tích dữ liệu lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã có lỗi xảy ra khi kết nối với trợ lý AI. Vui lòng kiểm tra lại API Key của bạn.";
  }
};