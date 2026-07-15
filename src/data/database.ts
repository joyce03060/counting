// 黑马记账 - 数据库操作
import Database from "@tauri-apps/plugin-sql";
import type { ExpenseRecord, CustomCategory } from "./types";

let db: Database | null = null;

// 初始化数据库，创建表（如果不存在）
export async function initDatabase(): Promise<Database> {
  if (db) return db;

  // SQLite 数据库文件保存在应用数据目录中
  db = await Database.load("sqlite:heimajizhang.db");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount INTEGER NOT NULL,
      category_l1 TEXT NOT NULL,
      category_l2 TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL
    )
  `);

  // 为常用查询建索引
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date)
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_expenses_category_l1 ON expenses(category_l1)
  `);

  // 自定义分类表
  await db.execute(`
    CREATE TABLE IF NOT EXISTS custom_categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📌',
      parent_l1 TEXT,
      created_at TEXT NOT NULL
    )
  `);

  return db;
}

// 生成唯一 ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// 保存一条支出记录
export async function saveExpense(expense: {
  amount: number;
  categoryL1: string;
  categoryL2: string;
  date: string;
  note: string;
}): Promise<ExpenseRecord> {
  const database = await initDatabase();
  const id = generateId();
  const createdAt = new Date().toISOString();
  // 金额以分存储（整数），避免浮点精度问题
  const amountInCents = Math.round(expense.amount * 100);

  await database.execute(
    "INSERT INTO expenses (id, amount, category_l1, category_l2, date, note, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [id, amountInCents, expense.categoryL1, expense.categoryL2, expense.date, expense.note, createdAt]
  );

  return {
    id,
    amount: amountInCents / 100,
    categoryL1: expense.categoryL1,
    categoryL2: expense.categoryL2,
    date: expense.date,
    note: expense.note,
    createdAt,
  };
}

// 查询指定日期的所有支出（按时间倒序）
export async function getExpensesByDate(date: string): Promise<ExpenseRecord[]> {
  const database = await initDatabase();
  const rows: Array<Record<string, unknown>> = await database.select(
    "SELECT * FROM expenses WHERE date = $1 ORDER BY created_at DESC",
    [date]
  );
  return rows.map(rowToExpense);
}

// 查询指定月份的所有支出
export async function getExpensesByMonth(year: number, month: number): Promise<ExpenseRecord[]> {
  const database = await initDatabase();
  // month 格式：01, 02, ... 12
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const rows: Array<Record<string, unknown>> = await database.select(
    "SELECT * FROM expenses WHERE date LIKE $1 ORDER BY date DESC, created_at DESC",
    [`${prefix}%`]
  );
  return rows.map(rowToExpense);
}

// 按月统计各一级分类的支出总额
export async function getMonthlyStats(year: number, month: number): Promise<{
  total: number;
  byCategory: { category: string; amount: number }[];
}> {
  const database = await initDatabase();
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const rows: Array<Record<string, unknown>> = await database.select(
    "SELECT category_l1, SUM(amount) as total FROM expenses WHERE date LIKE $1 GROUP BY category_l1 ORDER BY total DESC",
    [`${prefix}%`]
  );

  const byCategory = rows.map((r) => ({
    category: r.category_l1 as string,
    amount: (r.total as number) / 100,
  }));

  const total = byCategory.reduce((sum, c) => sum + c.amount, 0);

  return { total, byCategory };
}

// 删除一条支出
export async function deleteExpense(id: string): Promise<void> {
  const database = await initDatabase();
  await database.execute("DELETE FROM expenses WHERE id = $1", [id]);
}

// 更新一条支出的备注和分类
export async function updateExpense(
  id: string,
  updates: { amount?: number; categoryL1?: string; categoryL2?: string; date?: string; note?: string }
): Promise<void> {
  const database = await initDatabase();
  const setClauses: string[] = [];
  const params: (string | number)[] = [];

  if (updates.amount !== undefined) {
    setClauses.push("amount = $" + (params.length + 1));
    params.push(Math.round(updates.amount * 100));
  }
  if (updates.categoryL1 !== undefined) {
    setClauses.push("category_l1 = $" + (params.length + 1));
    params.push(updates.categoryL1);
  }
  if (updates.categoryL2 !== undefined) {
    setClauses.push("category_l2 = $" + (params.length + 1));
    params.push(updates.categoryL2);
  }
  if (updates.date !== undefined) {
    setClauses.push("date = $" + (params.length + 1));
    params.push(updates.date);
  }
  if (updates.note !== undefined) {
    setClauses.push("note = $" + (params.length + 1));
    params.push(updates.note);
  }

  if (setClauses.length === 0) return;

  params.push(id);
  await database.execute(
    `UPDATE expenses SET ${setClauses.join(", ")} WHERE id = $${params.length}`,
    params
  );
}

// 获取所有支出（用于 CSV 导出）
export async function getAllExpenses(): Promise<ExpenseRecord[]> {
  const database = await initDatabase();
  const rows: Array<Record<string, unknown>> = await database.select(
    "SELECT * FROM expenses ORDER BY date DESC, created_at DESC"
  );
  return rows.map(rowToExpense);
}

// ==================== 自定义分类 CRUD ====================

// 获取所有自定义分类
export async function getCustomCategories(): Promise<CustomCategory[]> {
  const database = await initDatabase();
  const rows: Array<Record<string, unknown>> = await database.select(
    "SELECT * FROM custom_categories ORDER BY created_at ASC"
  );
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    icon: r.icon as string,
    parentL1: (r.parent_l1 as string) ?? null,
    createdAt: r.created_at as string,
  }));
}

// 新增自定义分类
export async function addCustomCategory(
  name: string,
  icon: string,
  parentL1: string | null
): Promise<CustomCategory> {
  const database = await initDatabase();
  const id = generateId();
  const createdAt = new Date().toISOString();

  await database.execute(
    "INSERT INTO custom_categories (id, name, icon, parent_l1, created_at) VALUES ($1, $2, $3, $4, $5)",
    [id, name, icon, parentL1, createdAt]
  );

  return { id, name, icon, parentL1, createdAt };
}

// 更新自定义分类名称
export async function updateCustomCategory(
  id: string,
  updates: { name?: string; icon?: string }
): Promise<void> {
  const database = await initDatabase();
  const parts: string[] = [];
  const params: string[] = [];

  if (updates.name !== undefined) {
    parts.push("name = $" + (params.length + 1));
    params.push(updates.name);
  }
  if (updates.icon !== undefined) {
    parts.push("icon = $" + (params.length + 1));
    params.push(updates.icon);
  }
  if (parts.length === 0) return;

  params.push(id);
  await database.execute(
    `UPDATE custom_categories SET ${parts.join(", ")} WHERE id = $${params.length}`,
    params
  );

  // 同步更新 expenses 表中的分类名称（如果一级分类改了名）
  if (updates.name) {
    // 先查出旧名称
    const rows: Array<Record<string, unknown>> = await database.select(
      "SELECT name, parent_l1 FROM custom_categories WHERE id = $1",
      [id]
    );
    const oldName = rows[0]?.name as string;
    const isCustomL1 = !rows[0]?.parent_l1;

    if (isCustomL1) {
      await database.execute(
        "UPDATE expenses SET category_l1 = $1 WHERE category_l1 = $2",
        [updates.name, oldName]
      );
    } else {
      await database.execute(
        "UPDATE expenses SET category_l2 = $1 WHERE category_l2 = $2",
        [updates.name, oldName]
      );
    }
  }
}

// 删除自定义分类
export async function deleteCustomCategory(id: string): Promise<void> {
  const database = await initDatabase();

  // 先查出分类信息
  const rows: Array<Record<string, unknown>> = await database.select(
    "SELECT name, parent_l1 FROM custom_categories WHERE id = $1",
    [id]
  );
  if (rows.length === 0) return;

  const name = rows[0].name as string;
  const parentL1 = rows[0].parent_l1 as string | null;

  // 删除分类记录
  await database.execute("DELETE FROM custom_categories WHERE id = $1", [id]);

  // 如果是一级分类，同时删除其下的所有二级自定义分类
  if (parentL1 === null) {
    const subs: Array<Record<string, unknown>> = await database.select(
      "SELECT id, name FROM custom_categories WHERE parent_l1 = $1",
      [name]
    );
    for (const sub of subs) {
      // 清除使用了该二级分类的支出记录的分类
      await database.execute(
        "UPDATE expenses SET category_l2 = '其他' WHERE category_l2 = $1 AND category_l1 = $2",
        [sub.name as string, name]
      );
    }
    await database.execute("DELETE FROM custom_categories WHERE parent_l1 = $1", [name]);
    // 清除使用了该一级分类的支出记录的分类
    await database.execute(
      "UPDATE expenses SET category_l1 = '其他杂项', category_l2 = '其他' WHERE category_l1 = $1",
      [name]
    );
  } else {
    // 如果只是二级分类
    await database.execute(
      "UPDATE expenses SET category_l2 = '其他' WHERE category_l2 = $1 AND category_l1 = $2",
      [name, parentL1]
    );
  }
}

// 将数据库行转为 ExpenseRecord
function rowToExpense(row: Record<string, unknown>): ExpenseRecord {
  return {
    id: row.id as string,
    amount: (row.amount as number) / 100,
    categoryL1: row.category_l1 as string,
    categoryL2: row.category_l2 as string,
    date: row.date as string,
    note: (row.note as string) ?? "",
    createdAt: row.created_at as string,
  };
}
