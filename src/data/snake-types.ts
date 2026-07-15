// 记账app - 贪吃蛇游戏类型定义

/** 网格坐标 */
export interface Position {
  x: number; // 0 ~ GRID_SIZE-1
  y: number; // 0 ~ GRID_SIZE-1
}

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type GameStatus = "idle" | "running" | "gameOver";

export interface GameState {
  snake: Position[]; // 蛇身，第 0 个是蛇头
  food: Position; // 食物位置
  direction: Direction; // 当前已确认的移动方向
  nextDirection: Direction; // 缓冲方向（防止同帧 180° 掉头）
  gameStatus: GameStatus;
  score: number;
}

export type GameAction =
  | { type: "TICK" }
  | { type: "CHANGE_DIRECTION"; direction: Direction }
  | { type: "START_GAME" }
  | { type: "GAME_OVER" };
