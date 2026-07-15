// 记账app - 预设分类数据
import type { Category, CustomCategory } from "./types";

// 10 大类 + 45 小类的完整分类体系（preset: true 表示不可删改）
export const PRESET_CATEGORIES: Category[] = [
  {
    name: "餐饮美食", icon: "🍜", preset: true,
    children: [
      { name: "三餐", icon: "🍚" },
      { name: "外卖", icon: "🥡" },
      { name: "买菜食材", icon: "🥬" },
      { name: "零食饮料", icon: "🧋" },
      { name: "聚餐请客", icon: "🍻" },
    ],
  },
  {
    name: "住房居住", icon: "🏠", preset: true,
    children: [
      { name: "房贷房租", icon: "🏘️" },
      { name: "水电燃气", icon: "💡" },
      { name: "物业费", icon: "🏢" },
      { name: "宽带话费", icon: "📱" },
      { name: "维修装修", icon: "🔧" },
    ],
  },
  {
    name: "交通出行", icon: "🚗", preset: true,
    children: [
      { name: "公共交通", icon: "🚌" },
      { name: "打车出行", icon: "🚕" },
      { name: "燃油充电", icon: "⛽" },
      { name: "停车路费", icon: "🅿️" },
      { name: "养车修车", icon: "🔩" },
    ],
  },
  {
    name: "购物消费", icon: "🛒", preset: true,
    children: [
      { name: "服饰鞋包", icon: "👗" },
      { name: "个护美妆", icon: "💄" },
      { name: "数码电子", icon: "📱" },
      { name: "家居家电", icon: "🛋️" },
      { name: "日用百货", icon: "🧴" },
    ],
  },
  {
    name: "医疗健康", icon: "💊", preset: true,
    children: [
      { name: "看病诊疗", icon: "🏥" },
      { name: "药品", icon: "💉" },
      { name: "住院手术", icon: "🚑" },
      { name: "保健养生", icon: "🌿" },
      { name: "运动健身", icon: "🏃" },
    ],
  },
  {
    name: "教育学习", icon: "📚", preset: true,
    children: [
      { name: "学费培训", icon: "🎓" },
      { name: "书籍文具", icon: "📖" },
      { name: "考试报名", icon: "📝" },
    ],
  },
  {
    name: "休闲娱乐", icon: "🎮", preset: true,
    children: [
      { name: "影视音乐", icon: "🎬" },
      { name: "游戏", icon: "🎲" },
      { name: "旅游度假", icon: "✈️" },
      { name: "聚会活动", icon: "🎉" },
    ],
  },
  {
    name: "人情往来", icon: "🎁", preset: true,
    children: [
      { name: "红包礼金", icon: "🧧" },
      { name: "礼品礼物", icon: "🎀" },
      { name: "孝敬长辈", icon: "👴" },
      { name: "慈善捐款", icon: "🤝" },
    ],
  },
  {
    name: "金融保险", icon: "💰", preset: true,
    children: [
      { name: "保险费用", icon: "🛡️" },
      { name: "贷款利息", icon: "📊" },
      { name: "税费手续费", icon: "🧾" },
    ],
  },
  {
    name: "其他杂项", icon: "📦", preset: true,
    children: [
      { name: "宠物", icon: "🐾" },
      { name: "快递邮政", icon: "📬" },
      { name: "其他", icon: "❓" },
    ],
  },
];

// 合并预设 + 自定义分类
export function mergeCategories(customCategories: CustomCategory[]): Category[] {
  // 深拷贝预设
  const merged: Category[] = PRESET_CATEGORIES.map((c) => ({
    ...c,
    children: [...c.children],
  }));

  // 处理自定义分类
  for (const cc of customCategories) {
    if (cc.parentL1 === null) {
      // 自定义一级分类
      merged.push({
        name: cc.name,
        icon: cc.icon,
        preset: false,
        children: [],
      });
    } else {
      // 自定义二级分类：找到对应的一级分类并追加
      const parent = merged.find((c) => c.name === cc.parentL1);
      if (parent) {
        parent.children.push({ name: cc.name, icon: cc.icon });
      }
    }
  }

  return merged;
}

// 工具函数：根据一级分类名称获取其二级分类列表
export function getSubCategories(l1Name: string) {
  const category = PRESET_CATEGORIES.find((c) => c.name === l1Name);
  return category?.children ?? [];
}

// 工具函数：获取分类的图标
export function getCategoryIcon(name: string, subName?: string): string {
  const l1 = PRESET_CATEGORIES.find((c) => c.name === name);
  if (!subName) return l1?.icon ?? "📦";
  const sub = l1?.children.find((s) => s.name === subName);
  return sub?.icon ?? l1?.icon ?? "📦";
}

// 所有预设一级分类名称
export const CATEGORY_L1_NAMES = PRESET_CATEGORIES.map((c) => c.name);

// 向后兼容的别名
export const CATEGORIES = PRESET_CATEGORIES;
