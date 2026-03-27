import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  DollarSign,
  Download,
  FileText,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import AddExecutiveModal from "../components/AddExecutiveModal";
import AddRecordModal from "../components/AddRecordModal";
import EditRecordModal from "../components/EditRecordModal";
import Sidebar from "../components/Sidebar";
import { useActor } from "../hooks/useActor";
import type { Executive, ProfitRecord, Session } from "../lib/types";

interface Props {
  session: Session;
  onLogout: () => void;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Map backend ProfitRecord (bigint ids) to frontend type (string ids)
function mapRecord(r: {
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
}): ProfitRecord {
  return {
    id: r.id.toString(),
    date: r.date,
    customerName: r.customerName,
    amountReceived: r.amountReceived,
    dailyTarget: r.dailyTarget,
    executiveName: r.executiveName,
    addedBy: r.addedBy,
    createdAt: Number(r.createdAt),
    customerDailyTarget: r.customerDailyTarget,
    customerTotalReceived: r.customerTotalReceived,
  };
}

// Map backend Executive (bigint id) to frontend type (string id)
function mapExecutive(e: {
  id: bigint;
  name: string;
  username: string;
  password: string;
}): Executive {
  return {
    id: e.id.toString(),
    name: e.name,
    username: e.username,
    password: e.password,
  };
}

export default function AdminDashboard({ session, onLogout }: Props) {
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState("dashboard");
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [records, setRecords] = useState<ProfitRecord[]>([]);
  const [allRecords, setAllRecords] = useState<ProfitRecord[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showAddExec, setShowAddExec] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ProfitRecord | null>(null);
  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [selectedExecutive, setSelectedExecutive] = useState<Executive | null>(
    null,
  );
  const [execRecords, setExecRecords] = useState<ProfitRecord[]>([]);

  const loadData = useCallback(async () => {
    if (!actor) return;
    try {
      const [monthRecs, execsList, allRecs] = await Promise.all([
        actor.listRecordsByMonth(
          session.token,
          BigInt(selectedMonth),
          BigInt(selectedYear),
        ),
        actor.listExecutives(session.token),
        actor.listAllRecords(session.token),
      ]);
      setRecords(monthRecs.map(mapRecord));
      setExecutives(execsList.map(mapExecutive));
      setAllRecords(allRecs.map(mapRecord));
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load data");
    }
  }, [actor, session.token, selectedMonth, selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedExecutive && actor) {
      actor
        .listRecordsByExecutive(session.token, selectedExecutive.name)
        .then((recs) =>
          setExecRecords(
            recs.map(mapRecord).sort((a, b) => a.date.localeCompare(b.date)),
          ),
        )
        .catch((e: unknown) =>
          toast.error(
            e instanceof Error ? e.message : "Failed to load records",
          ),
        );
    }
  }, [selectedExecutive, actor, session.token]);

  const totalReceived = records.reduce((s, r) => s + r.amountReceived, 0);
  const totalTarget = records.reduce((s, r) => s + r.dailyTarget, 0);
  const totalCustomerReceived = records.reduce(
    (s, r) => s + (r.customerTotalReceived || 0),
    0,
  );

  const handleAddRecord = async (data: {
    date: string;
    customerName: string;
    amountReceived: number;
    dailyTarget: number;
    executiveName: string;
  }) => {
    if (!actor) return;
    try {
      await actor.addRecord(
        session.token,
        data.date,
        data.customerName,
        data.amountReceived,
        data.dailyTarget,
        0,
        0,
        data.executiveName,
      );
      await loadData();
      toast.success("Record added successfully");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add record");
    }
  };

  const handleEditRecord = async (
    id: string,
    updates: {
      date: string;
      customerName: string;
      amountReceived: number;
      dailyTarget: number;
      executiveName: string;
      customerDailyTarget: number;
      customerTotalReceived: number;
    },
  ) => {
    if (!actor) return;
    try {
      await actor.updateRecord(
        session.token,
        BigInt(id),
        updates.date,
        updates.customerName,
        updates.amountReceived,
        updates.dailyTarget,
        updates.customerDailyTarget,
        updates.customerTotalReceived,
        updates.executiveName,
      );
      await loadData();
      toast.success("Record updated successfully");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update record");
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!actor) return;
    try {
      await actor.deleteRecord(session.token, BigInt(id));
      await loadData();
      toast.success("Record deleted");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to delete record");
    }
  };

  const handleAddExecutive = async (data: {
    name: string;
    username: string;
    password: string;
  }) => {
    if (!actor) return;
    try {
      await actor.addExecutive(
        session.token,
        data.name,
        data.username,
        data.password,
      );
      await loadData();
      toast.success("Executive account created");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Error creating executive");
    }
  };

  const handleDeleteExecutive = async (id: string) => {
    if (!actor) return;
    try {
      await actor.deleteExecutive(session.token, BigInt(id));
      await loadData();
      toast.success("Executive account deleted");
    } catch (e: unknown) {
      toast.error(
        e instanceof Error ? e.message : "Failed to delete executive",
      );
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    if (newPwd !== confirmPwd) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPwd.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    try {
      await actor.changeAdminPassword(session.token, curPwd, newPwd);
      setCurPwd("");
      setNewPwd("");
      setConfirmPwd("");
      toast.success("Password changed. Please login again.");
      setTimeout(onLogout, 1500);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to change password");
    }
  };

  const exportCSV = () => {
    const header =
      "S.No,Date,Customer Name,Amount Received,Customer Daily Amt Target,Cust. Total Amt Received,Executive Name\n";
    const rows = records
      .map(
        (r, i) =>
          `${i + 1},"${r.date}","${r.customerName}",${r.amountReceived},${r.dailyTarget},${r.customerTotalReceived || 0},"${r.executiveName}"`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `infinexy_${MONTHS[selectedMonth - 1]}_${selectedYear}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "oklch(0.96 0.01 265)" }}
    >
      <Sidebar
        userRole="admin"
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedExecutive(null);
        }}
        onLogout={onLogout}
        userName={session.name}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="no-print flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {activeTab === "dashboard" && "Dashboard"}
              {activeTab === "records" && "Profit Records"}
              {activeTab === "executives" &&
                (selectedExecutive
                  ? `${selectedExecutive.name}'s Records`
                  : "Executive Accounts")}
              {activeTab === "settings" && "Settings"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Infinexy Solution Admin Panel
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
            {session.name[0].toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {/* DASHBOARD */}
          {activeTab === "dashboard" && (
            <div className="space-y-6">
              <div className="no-print flex items-center gap-3">
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}
                >
                  <SelectTrigger
                    data-ocid="dashboard.select"
                    className="w-40 bg-card text-card-foreground"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem
                        key={m}
                        value={(MONTHS.indexOf(m) + 1).toString()}
                      >
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(v) => setSelectedYear(Number.parseInt(v))}
                >
                  <SelectTrigger
                    data-ocid="dashboard.select"
                    className="w-28 bg-card text-card-foreground"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <Card className="bg-card shadow-sm border border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-card-foreground/60">
                        Total Received
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-success" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-card-foreground">
                      {formatCurrency(totalReceived)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {MONTHS[selectedMonth - 1]} {selectedYear}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card shadow-sm border border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-card-foreground/60">
                        Total Records
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-card-foreground">
                      {records.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      This month
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card shadow-sm border border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-card-foreground/60">
                        Executives
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-warning" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-card-foreground">
                      {executives.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Active accounts
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card shadow-sm border border-border">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-card-foreground/60">
                        Customer Total Amt Received
                      </p>
                      <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-info" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-card-foreground">
                      {formatCurrency(totalCustomerReceived)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {MONTHS[selectedMonth - 1]} {selectedYear}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card shadow-sm border border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-card-foreground">
                    Monthly Summary — {MONTHS[selectedMonth - 1]} {selectedYear}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow style={{ background: "#F3F6FA" }}>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            #
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            Date
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            Customer
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            Amount
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            Executive
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground py-8"
                              data-ocid="records.empty_state"
                            >
                              No records for this month
                            </TableCell>
                          </TableRow>
                        ) : (
                          records.slice(0, 5).map((r, i) => (
                            <TableRow
                              key={r.id}
                              data-ocid={`records.item.${i + 1}`}
                            >
                              <TableCell className="text-card-foreground/60 text-sm">
                                {i + 1}
                              </TableCell>
                              <TableCell className="text-card-foreground text-sm">
                                {r.date}
                              </TableCell>
                              <TableCell className="text-card-foreground text-sm">
                                {r.customerName}
                              </TableCell>
                              <TableCell className="text-card-foreground font-medium text-sm">
                                {formatCurrency(r.amountReceived)}
                              </TableCell>
                              <TableCell className="text-sm">
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                  {r.executiveName}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {records.length > 0 && (
                    <div className="px-4 py-3 border-t border-border flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        Target: {formatCurrency(totalTarget)}
                      </span>
                      <span className="text-sm font-semibold text-success">
                        Total: {formatCurrency(totalReceived)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* RECORDS */}
          {activeTab === "records" && (
            <div className="space-y-4">
              <div className="no-print flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}
                  >
                    <SelectTrigger
                      data-ocid="records.select"
                      className="w-40 bg-card text-card-foreground"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((m) => (
                        <SelectItem
                          key={m}
                          value={(MONTHS.indexOf(m) + 1).toString()}
                        >
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(v) => setSelectedYear(Number.parseInt(v))}
                  >
                    <SelectTrigger
                      data-ocid="records.select"
                      className="w-28 bg-card text-card-foreground"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    data-ocid="records.primary_button"
                    onClick={() => setShowAddRecord(true)}
                    className="bg-primary text-primary-foreground border-0 hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Record
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="records.secondary_button"
                    onClick={() => window.print()}
                    className="bg-card text-card-foreground"
                  >
                    <Printer className="w-4 h-4 mr-1" /> Print
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="records.secondary_button"
                    onClick={exportCSV}
                    className="bg-card text-card-foreground"
                  >
                    <Download className="w-4 h-4 mr-1" /> Export CSV
                  </Button>
                </div>
              </div>

              <div className="print-only hidden">
                <h2
                  style={{
                    textAlign: "center",
                    fontWeight: 700,
                    fontSize: 18,
                    marginBottom: 4,
                  }}
                >
                  Infinexy Solution — Profit Records
                </h2>
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    marginBottom: 12,
                    color: "#555",
                  }}
                >
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </p>
              </div>

              <Card className="bg-card shadow-sm border border-border">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table className="print-table">
                      <TableHeader>
                        <TableRow style={{ background: "#F3F6FA" }}>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            S.No
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            Date
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            Customer Name
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            Amount Received
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            Cust. Daily Amt Target
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            Cust. Total Amt Received
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                            Executive
                          </TableHead>
                          <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase no-print">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={8}
                              className="text-center text-muted-foreground py-12"
                              data-ocid="records.empty_state"
                            >
                              No records for {MONTHS[selectedMonth - 1]}{" "}
                              {selectedYear}
                            </TableCell>
                          </TableRow>
                        ) : (
                          records.map((r, i) => (
                            <TableRow
                              key={r.id}
                              data-ocid={`records.item.${i + 1}`}
                            >
                              <TableCell className="text-card-foreground/60 text-sm font-medium">
                                {i + 1}
                              </TableCell>
                              <TableCell className="text-card-foreground text-sm">
                                {r.date}
                              </TableCell>
                              <TableCell className="text-card-foreground text-sm font-medium">
                                {r.customerName}
                              </TableCell>
                              <TableCell className="text-card-foreground font-semibold text-sm">
                                {formatCurrency(r.amountReceived)}
                              </TableCell>
                              <TableCell className="text-card-foreground/70 text-sm">
                                {formatCurrency(r.dailyTarget)}
                              </TableCell>
                              <TableCell className="text-card-foreground/70 text-sm">
                                {formatCurrency(r.customerTotalReceived || 0)}
                              </TableCell>
                              <TableCell className="text-sm">
                                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                  {r.executiveName}
                                </span>
                              </TableCell>
                              <TableCell className="no-print">
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-ocid={`records.edit_button.${i + 1}`}
                                    onClick={() => setEditingRecord(r)}
                                    className="text-primary hover:bg-primary/10 h-7 w-7 p-0"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    data-ocid={`records.delete_button.${i + 1}`}
                                    onClick={() => handleDeleteRecord(r.id)}
                                    className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  {records.length > 0 && (
                    <div className="px-4 py-3 border-t border-border flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">
                        {records.length} record(s) | Target:{" "}
                        {formatCurrency(totalTarget)}
                      </span>
                      <span className="text-sm font-semibold text-success">
                        Total: {formatCurrency(totalReceived)}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* EXECUTIVES */}
          {activeTab === "executives" && (
            <div className="space-y-4">
              {selectedExecutive ? (
                <>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedExecutive(null)}
                      className="bg-card text-card-foreground"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                    <div>
                      <h2 className="text-base font-semibold text-foreground">
                        {selectedExecutive.name}
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        @{selectedExecutive.username} • {execRecords.length}{" "}
                        total record(s)
                      </p>
                    </div>
                  </div>
                  <Card className="bg-card shadow-sm border border-border">
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow style={{ background: "#F3F6FA" }}>
                              <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                                S.No
                              </TableHead>
                              <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                                Date
                              </TableHead>
                              <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                                Customer Name
                              </TableHead>
                              <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                                Amount Received
                              </TableHead>
                              <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                                Cust. Daily Amt Target
                              </TableHead>
                              <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                                Cust. Total Amt Received
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {execRecords.length === 0 ? (
                              <TableRow>
                                <TableCell
                                  colSpan={6}
                                  className="text-center text-muted-foreground py-12"
                                >
                                  No records found for {selectedExecutive.name}
                                </TableCell>
                              </TableRow>
                            ) : (
                              execRecords.map((r, i) => (
                                <TableRow key={r.id}>
                                  <TableCell className="text-card-foreground/60 text-sm">
                                    {i + 1}
                                  </TableCell>
                                  <TableCell className="text-card-foreground text-sm font-medium">
                                    {r.date}
                                  </TableCell>
                                  <TableCell className="text-card-foreground text-sm">
                                    {r.customerName}
                                  </TableCell>
                                  <TableCell className="text-card-foreground font-semibold text-sm">
                                    {formatCurrency(r.amountReceived)}
                                  </TableCell>
                                  <TableCell className="text-card-foreground/70 text-sm">
                                    {formatCurrency(r.dailyTarget)}
                                  </TableCell>
                                  <TableCell className="text-card-foreground/70 text-sm">
                                    {r.customerTotalReceived != null &&
                                    r.customerTotalReceived > 0 ? (
                                      formatCurrency(r.customerTotalReceived)
                                    ) : (
                                      <span className="text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                      {execRecords.length > 0 && (
                        <div className="px-4 py-3 border-t border-border flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {execRecords.length} record(s)
                          </span>
                          <span className="text-sm font-semibold text-success">
                            Total Received:{" "}
                            {formatCurrency(
                              execRecords.reduce(
                                (s, r) => s + r.amountReceived,
                                0,
                              ),
                            )}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
                <>
                  <div className="flex justify-end">
                    <Button
                      data-ocid="executives.primary_button"
                      onClick={() => setShowAddExec(true)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Executive
                    </Button>
                  </div>
                  <Card className="bg-card shadow-sm border border-border">
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow style={{ background: "#F3F6FA" }}>
                            <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                              S.No
                            </TableHead>
                            <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                              Name
                            </TableHead>
                            <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                              Username
                            </TableHead>
                            <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                              Records
                            </TableHead>
                            <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {executives.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center text-muted-foreground py-12"
                                data-ocid="executives.empty_state"
                              >
                                No executives yet. Add your first executive
                                account.
                              </TableCell>
                            </TableRow>
                          ) : (
                            executives.map((exec, i) => {
                              const count = allRecords.filter(
                                (r) => r.executiveName === exec.name,
                              ).length;
                              return (
                                <TableRow
                                  key={exec.id}
                                  data-ocid={`executives.item.${i + 1}`}
                                >
                                  <TableCell className="text-card-foreground/60 text-sm">
                                    {i + 1}
                                  </TableCell>
                                  <TableCell>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedExecutive(exec)}
                                      className="text-primary font-medium text-sm hover:underline text-left"
                                    >
                                      {exec.name}
                                    </button>
                                  </TableCell>
                                  <TableCell className="text-card-foreground/70 text-sm">
                                    {exec.username}
                                  </TableCell>
                                  <TableCell>
                                    <button
                                      type="button"
                                      onClick={() => setSelectedExecutive(exec)}
                                      className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20"
                                    >
                                      {count} record{count !== 1 ? "s" : ""}
                                    </button>
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      data-ocid={`executives.delete_button.${i + 1}`}
                                      onClick={() =>
                                        handleDeleteExecutive(exec.id)
                                      }
                                      className="text-destructive hover:bg-destructive/10 h-7 w-7 p-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          )}

          {/* SETTINGS */}
          {activeTab === "settings" && (
            <div className="max-w-md">
              <Card className="bg-card shadow-sm border border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground">
                    Change Admin Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-card-foreground/80">
                        Current Password
                      </Label>
                      <Input
                        data-ocid="settings.input"
                        type="password"
                        value={curPwd}
                        onChange={(e) => setCurPwd(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-card-foreground/80">
                        New Password
                      </Label>
                      <Input
                        data-ocid="settings.input"
                        type="password"
                        value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-card-foreground/80">
                        Confirm New Password
                      </Label>
                      <Input
                        data-ocid="settings.input"
                        type="password"
                        value={confirmPwd}
                        onChange={(e) => setConfirmPwd(e.target.value)}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      data-ocid="settings.submit_button"
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Update Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      <AddRecordModal
        open={showAddRecord}
        onClose={() => setShowAddRecord(false)}
        onSubmit={handleAddRecord}
        executives={executives}
        showExecutiveField
      />
      <AddExecutiveModal
        open={showAddExec}
        onClose={() => setShowAddExec(false)}
        onSubmit={handleAddExecutive}
      />
      <EditRecordModal
        open={editingRecord !== null}
        onClose={() => setEditingRecord(null)}
        record={editingRecord}
        executives={executives}
        onSubmit={handleEditRecord}
      />
    </div>
  );
}
