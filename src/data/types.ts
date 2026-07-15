// 黑马记账 - 类型定义

/** 一条支出记录 */
export interface ExpenseRecord {
  id: string;
  amount: number;        // 金额（元），两位小数
  categoryL1: string;    // 一级分类名称
  categoryL2: string;    // 二级分类名称
  date: string;          // 日期 YYYY-MM-DD
  note: string;          // 备注
  createdAt: string;     // 创建时间 ISO 8601
}

/** 二级分类 */
export interface SubCategory {
  name: string;
  icon: string;
}

/** 一级分类 */
export interface Category {
  name: string;
  icon: string;
  preset: boolean;      // true=内置预设（不可删改）, false=用户自定义
  children: SubCategory[];
}

/** 自定义分类（数据库存储格式） */
export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  parentL1: string | null;  // null=一级分类, 有值=属于该一级的二级
  createdAt: string;
}

/** 月度统计 */
export interface MonthlyStats {
  total: number;
  byCategory: {
    category: string;
    icon: string;
    amount: number;
    percentage: number;
  }[];
}

/** 新建支出时的输入数据 */
export interface NewExpense {
  amount: number;
  categoryL1: string;
  categoryL2: string;
  date: string;
  note: string;
}
