import { useState, useEffect, useCallback } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import { saveExpense, getExpensesByDate, getCustomCategories } from "./data/database";
import { mergeCategories } from "./data/categories";
import type { ExpenseRecord, NewExpense, Category } from "./data/types";

type Tab = "home" | "stats" | "settings";

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [todayExpenses, setTodayExpenses] = useState<ExpenseRecord[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const today = new Date().toISOString().slice(0, 10);

  const loadCategories = useCallback(async () => {
    try {
      const custom = await getCustomCategories();
      setCategories(mergeCategories(custom));
    } catch (e) {
      console.error("加载分类失败:", e);
    }
  }, []);

  const loadTodayExpenses = useCallback(async () => {
    try {
      const expenses = await getExpensesByDate(today);
      setTodayExpenses(expenses);
      setTodayTotal(expenses.reduce((sum, e) => sum + e.amount, 0));
    } catch (e) {
      console.error("加载今日支出失败:", e);
    }
  }, [today]);

  useEffect(() => {
    loadCategories();
    loadTodayExpenses();
  }, [loadCategories, loadTodayExpenses]);

  async function handleSubmit(expense: NewExpense) {
    setSubmitting(true);
    try {
      await saveExpense(expense);
      await loadTodayExpenses();
    } catch (e) {
      console.error("保存失败:", e);
      alert("保存失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCategoriesChanged() {
    await loadCategories();
  }

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white shadow-lg">
      {/* 顶部标题栏 */}
      <header className="bg-indigo-500 text-white px-5 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">黑马记账</h1>
          {activeTab === "home" && todayTotal > 0 && (
            <span className="text-sm opacity-80">
              今日支出{" "}
              <span className="amount font-semibold">
                ¥{todayTotal.toFixed(2)}
              </span>
            </span>
          )}
          {activeTab === "stats" && (
            <span className="text-sm opacity-80">月度统计</span>
          )}
          {activeTab === "settings" && (
            <span className="text-sm opacity-80">设置</span>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "home" && (
          <div className="p-4 space-y-5">
            <ExpenseForm onSubmit={handleSubmit} categories={categories} />
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400">今日记录</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <ExpenseList expenses={todayExpenses} />
            {submitting && (
              <div className="text-center text-sm text-gray-400 py-2">保存中...</div>
            )}
          </div>
        )}
        {activeTab === "stats" && (
          <div className="p-4 h-full">
            <StatsPage />
          </div>
        )}
        {activeTab === "settings" && (
          <div className="p-4">
            <SettingsPage onCategoriesChanged={handleCategoriesChanged} />
          </div>
        )}
      </main>

      {/* 底部导航栏 */}
      <nav className="flex border-t border-gray-200 bg-white">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === "home"
              ? "text-indigo-500 border-t-2 border-indigo-500 -mt-px"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📝 记账
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === "stats"
              ? "text-indigo-500 border-t-2 border-indigo-500 -mt-px"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          📊 统计
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
            activeTab === "settings"
              ? "text-indigo-500 border-t-2 border-indigo-500 -mt-px"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          ⚙️ 设置
        </button>
      </nav>
    </div>
  );
}

export default App;
