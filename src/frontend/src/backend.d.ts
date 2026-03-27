import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Executive {
    id: bigint;
    username: string;
    password: string;
    name: string;
}
export interface UserProfile {
    name: string;
    role: string;
}
export interface ProfitRecord {
    id: bigint;
    customerName: string;
    customerTotalReceived: number;
    dailyTarget: number;
    date: string;
    createdAt: bigint;
    executiveName: string;
    addedBy: string;
    amountReceived: number;
    customerDailyTarget: number;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addExecutive(token: string, name: string, username: string, password: string): Promise<bigint>;
    addRecord(token: string, date: string, customerName: string, amountReceived: number, dailyTarget: number, customerDailyTarget: number, customerTotalReceived: number, executiveName: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    changeAdminPassword(token: string, oldPassword: string, newPassword: string): Promise<void>;
    changeExecutivePassword(token: string, username: string, newPassword: string): Promise<void>;
    deleteExecutive(token: string, executiveId: bigint): Promise<void>;
    deleteRecord(token: string, recordId: bigint): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getExecutive(token: string, id: bigint): Promise<Executive | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAllRecords(token: string): Promise<Array<ProfitRecord>>;
    listExecutives(token: string): Promise<Array<Executive>>;
    listRecordsByExecutive(token: string, executiveName: string): Promise<Array<ProfitRecord>>;
    listRecordsByMonth(token: string, month: bigint, year: bigint): Promise<Array<ProfitRecord>>;
    login(username: string, password: string): Promise<{
        token: string;
        role: string;
    }>;
    logout(token: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateRecord(token: string, recordId: bigint, date: string, customerName: string, amountReceived: number, dailyTarget: number, customerDailyTarget: number, customerTotalReceived: number, executiveName: string): Promise<void>;
    validateSession(token: string): Promise<{
        username: string;
        role: string;
    }>;
}
