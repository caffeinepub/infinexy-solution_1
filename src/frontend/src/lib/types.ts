export interface ProfitRecord {
  id: string;
  date: string; // YYYY-MM-DD
  customerName: string;
  amountReceived: number;
  dailyTarget: number;
  executiveName: string;
  addedBy: string; // username
  createdAt: number;
  customerDailyTarget?: number;
  customerTotalReceived?: number;
}

export interface Executive {
  id: string;
  name: string;
  username: string;
  password: string;
}

export interface Session {
  token: string;
  role: "admin" | "executive";
  username: string;
  name: string;
}
