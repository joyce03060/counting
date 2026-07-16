import { useState, useEffect, useCallback } from "react";
import ExpenseForm from "./components/ExpenseForm";
import ExpenseList from "./components/ExpenseList";
import StatsPage from "./pages/StatsPage";
import SettingsPage from "./pages/SettingsPage";
import SnakeGame from "./components/SnakeGame";
import { saveExpense, getExpensesByDate, getCustomCategories } from "./data/database";
import { mergeCategories } from "./data/categories";
import type { ExpenseRecord, NewExpense, Category } from "./data/types";

type Tab = "home" | "stats" | "settings" | "game";

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
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-white shadow-xl shadow-stone-200/50">
      {/* 顶部标题栏 — 纯白底 + 极细底线，像杂志刊头 */}
      <header className="bg-white border-b border-stone-100 px-6 pt-5 pb-4">
        <div className="flex items-end justify-between">
          <h1 className="text-lg font-bold text-stone-800 tracking-wider">
            记账
          </h1>
          {activeTab === "home" && todayTotal > 0 && (
            <span className="text-xs text-stone-400 tracking-wide">
              今日{" "}
              <span className="amount text-sm font-semibold text-stone-700">
                ¥{todayTotal.toFixed(2)}
              </span>
            </span>
          )}
          {activeTab === "stats" && (
            <span className="text-xs text-stone-400 tracking-wide">月度统计</span>
          )}
          {activeTab === "settings" && (
            <span className="text-xs text-stone-400 tracking-wide">设置</span>
          )}
          {activeTab === "game" && (
            <span className="text-xs text-stone-400 tracking-wide">贪吃蛇</span>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        {activeTab === "home" && (
          <div className="p-5 space-y-6">
            <ExpenseForm onSubmit={handleSubmit} categories={categories} />
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-100" />
              <span className="text-xs text-stone-400 tracking-widest">
                今日记录
              </span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>
            <ExpenseList expenses={todayExpenses} />
            {submitting && (
              <div className="text-center text-xs text-stone-400 py-2 animate-pulse">
                保存中...
              </div>
            )}
          </div>
        )}
        {activeTab === "stats" && (
          <div className="p-5 h-full">
            <StatsPage />
          </div>
        )}
        {activeTab === "settings" && (
          <div className="p-5">
            <SettingsPage onCategoriesChanged={handleCategoriesChanged} />
          </div>
        )}
        {activeTab === "game" && (
          <div className="p-5 h-full">
            <SnakeGame />
          </div>
        )}
      </main>

      {/* 底部导航栏 — 极简，只有文字 + 细线 */}
      <nav className="flex border-t border-stone-100 bg-white">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex-1 py-3 text-center text-xs font-medium tracking-wide transition-colors ${
            activeTab === "home"
              ? "text-amber-600 border-t-2 border-amber-600 -mt-px"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          记账
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 py-3 text-center text-xs font-medium tracking-wide transition-colors ${
            activeTab === "stats"
              ? "text-amber-600 border-t-2 border-amber-600 -mt-px"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          统计
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-3 text-center text-xs font-medium tracking-wide transition-colors ${
            activeTab === "settings"
              ? "text-amber-600 border-t-2 border-amber-600 -mt-px"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          设置
        </button>
        <button
          onClick={() => setActiveTab("game")}
          className={`flex-1 py-3 text-center text-xs font-medium tracking-wide transition-colors ${
            activeTab === "game"
              ? "text-amber-600 border-t-2 border-amber-600 -mt-px"
              : "text-stone-400 hover:text-stone-600"
          }`}
        >
          游戏
        </button>
      </nav>
    </div>
  );
}

export default App;
