// 记账app - 设置页（自定义分类管理）
import { useState, useEffect, useCallback } from "react";
import type { Category, CustomCategory } from "../data/types";
import { PRESET_CATEGORIES } from "../data/categories";
import { getCustomCategories, addCustomCategory, updateCustomCategory, deleteCustomCategory } from "../data/database";

const ICONS = ["📌", "🍔", "🏠", "🚗", "🛒", "💊", "📚", "🎮", "🎁", "💰", "🐱", "🌱", "✈️", "🎵", "📷", "🏃", "💻", "🎂", "☕", "💡"];

interface Props {
  onCategoriesChanged: () => void;
}

export default function SettingsPage({ onCategoriesChanged }: Props) {
  const [customList, setCustomList] = useState<CustomCategory[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📌");
  const [newType, setNewType] = useState<"l1" | "l2">("l1");
  const [newParentL1, setNewParentL1] = useState("");
  const [addError, setAddError] = useState("");

  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("📌");

  const loadData = useCallback(async () => {
    try {
      const custom = await getCustomCategories();
      setCustomList(custom);
    } catch (e) {
      console.error("加载分类失败:", e);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function nameExists(name: string, parentL1: string | null, excludeId?: string): boolean {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (parentL1 === null) {
      if (PRESET_CATEGORIES.some((c: Category) => c.name === trimmed)) return true;
    }
    return customList.some((c) => {
      if (excludeId && c.id === excludeId) return false;
      return c.name === trimmed && c.parentL1 === parentL1;
    });
  }

  async function handleAdd() {
    setAddError("");
    const name = newName.trim();
    if (!name) { setAddError("请输入分类名称"); return; }
    if (name.length > 10) { setAddError("分类名称不能超过 10 个字"); return; }
    if (nameExists(name, newType === "l1" ? null : newParentL1)) {
      setAddError("该分类名称已存在"); return;
    }
    if (newType === "l2" && !newParentL1) { setAddError("请选择所属一级分类"); return; }

    try {
      await addCustomCategory(name, newIcon, newType === "l1" ? null : newParentL1);
      setNewName(""); setNewIcon("📌"); setNewType("l1"); setNewParentL1(""); setShowAdd(false);
      await loadData(); onCategoriesChanged();
    } catch (e) {
      console.error("添加分类失败:", e);
      setAddError("添加失败，请重试");
    }
  }

  function startEdit(cat: CustomCategory) {
    setEditingId(cat.id); setEditName(cat.name); setEditIcon(cat.icon);
  }

  async function handleEdit(id: string) {
    const name = editName.trim();
    if (!name) return;
    if (name.length > 10) return;
    const cat = customList.find((c) => c.id === id);
    if (!cat) return;
    if (nameExists(name, cat.parentL1, id)) return;

    try {
      await updateCustomCategory(id, { name, icon: editIcon });
      setEditingId(null); await loadData(); onCategoriesChanged();
    } catch (e) { console.error("更新分类失败:", e); }
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`确定要删除「${name}」吗？\n\n已使用该分类的支出记录将会被归入"其他"分类。`)) return;
    try {
      await deleteCustomCategory(id);
      await loadData(); onCategoriesChanged();
    } catch (e) { console.error("删除分类失败:", e); }
  }

  const presetL1Names = PRESET_CATEGORIES.map((c: Category) => c.name);

  return (
    <div className="space-y-5">
      <h2 className="text-sm font-semibold text-stone-600 tracking-wide">分类管理</h2>

      {/* 预设分类 */}
      <div>
        <h3 className="text-xs text-stone-400 mb-2 tracking-wide">内置分类（不可修改）</h3>
        <div className="space-y-1">
          {PRESET_CATEGORIES.map((cat: Category) => (
            <div key={cat.name}
                 className="flex items-center gap-3 px-3 py-2 rounded-lg bg-stone-50 text-stone-400">
              <span className="text-base">{cat.icon}</span>
              <span className="text-sm flex-1">{cat.name}</span>
              <span className="text-xs text-stone-300">{cat.children.length}个小类</span>
              <span className="text-xs text-stone-300">🔒</span>
            </div>
          ))}
        </div>
      </div>

      {/* 自定义分类 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs text-stone-400 tracking-wide">自定义分类</h3>
          {!showAdd && (
            <button type="button" onClick={() => setShowAdd(true)}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700">
              + 添加
            </button>
          )}
        </div>

        {customList.length === 0 && !showAdd ? (
          <p className="text-sm text-stone-300 text-center py-4">暂无自定义分类</p>
        ) : (
          <div className="space-y-1">
            {customList.map((cat) => (
              <div key={cat.id}
                   className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white border border-stone-100">
                {editingId === cat.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <select value={editIcon} onChange={(e) => setEditIcon(e.target.value)}
                            className="text-lg bg-stone-50 rounded px-1">
                      {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <input type="text" value={editName}
                           onChange={(e) => setEditName(e.target.value)} maxLength={10}
                           className="flex-1 px-2 py-1 border border-stone-200 rounded text-sm" autoFocus />
                    <button type="button" onClick={() => handleEdit(cat.id)}
                            className="text-xs text-green-600 hover:text-green-700 px-1">保存</button>
                    <button type="button" onClick={() => setEditingId(null)}
                            className="text-xs text-stone-400 hover:text-stone-500 px-1">取消</button>
                  </div>
                ) : (
                  <>
                    <span className="text-lg">{cat.icon}</span>
                    <span className="text-sm flex-1 text-stone-600">
                      {cat.parentL1 ? `${cat.parentL1} → ${cat.name}` : cat.name}
                    </span>
                    <button type="button" onClick={() => startEdit(cat)}
                            className="text-xs text-stone-300 hover:text-amber-600 px-1">✏️</button>
                    <button type="button" onClick={() => handleDelete(cat.id, cat.name)}
                            className="text-xs text-stone-300 hover:text-red-400 px-1">✕</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 添加表单 */}
        {showAdd && (
          <div className="mt-2 p-4 rounded-xl bg-amber-50/50 border border-amber-100 space-y-3">
            <div>
              <label className="block text-xs text-stone-500 mb-1">添加类型</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setNewType("l1")}
                        className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                          newType === "l1"
                            ? "bg-amber-600 text-white"
                            : "bg-white text-stone-500 border border-stone-200"
                        }`}>一级大类</button>
                <button type="button" onClick={() => setNewType("l2")}
                        className={`flex-1 py-1.5 text-sm rounded-md transition-colors ${
                          newType === "l2"
                            ? "bg-amber-600 text-white"
                            : "bg-white text-stone-500 border border-stone-200"
                        }`}>二级小类</button>
              </div>
            </div>

            {newType === "l2" && (
              <div>
                <label className="block text-xs text-stone-500 mb-1">所属一级分类</label>
                <select value={newParentL1} onChange={(e) => setNewParentL1(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm">
                  <option value="">请选择</option>
                  {presetL1Names.map((name: string) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                  {customList.filter((c) => c.parentL1 === null).map((c) => (
                    <option key={c.name} value={c.name}>{c.name}（自定义）</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs text-stone-500 mb-1">图标</label>
              <div className="flex flex-wrap gap-1">
                {ICONS.map((i) => (
                  <button key={i} type="button" onClick={() => setNewIcon(i)}
                          className={`w-8 h-8 flex items-center justify-center text-lg rounded-md ${
                            newIcon === i ? "bg-amber-600 text-white" : "bg-white hover:bg-stone-100"
                          }`}>{i}</button>
                ))}
              </div>
            </div>

            <div>
              <input type="text" value={newName}
                     onChange={(e) => setNewName(e.target.value)}
                     placeholder={newType === "l1" ? "请输入一级分类名称" : "请输入二级分类名称"}
                     maxLength={10}
                     className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm" />
            </div>

            {addError && <div className="text-xs text-red-500">{addError}</div>}

            <div className="flex gap-2">
              <button type="button" onClick={handleAdd}
                      className="flex-1 py-2 bg-amber-600 text-white text-sm font-medium rounded-lg hover:bg-amber-700 transition-colors">
                确认添加
              </button>
              <button type="button"
                      onClick={() => { setShowAdd(false); setAddError(""); }}
                      className="px-4 py-2 text-sm text-stone-500 bg-white border border-stone-200 rounded-lg hover:bg-stone-50">
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
