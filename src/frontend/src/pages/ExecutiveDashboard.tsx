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
import { KeyRound, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import Sidebar from "../components/Sidebar";
import { useActor } from "../hooks/useActor";
import { clearToken } from "../lib/storage";
import type { ProfitRecord, Session } from "../lib/types";

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

export default function ExecutiveDashboard({ session, onLogout }: Props) {
  const { actor } = useActor();
  const [activeTab, setActiveTab] = useState("add-record");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerName, setCustomerName] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [myRecords, setMyRecords] = useState<ProfitRecord[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const loadMyRecords = useCallback(async () => {
    if (!actor) return;
    try {
      const recs = await actor.listRecordsByExecutive(
        session.token,
        session.name,
      );
      const filtered = recs.map(mapRecord).filter((r) => {
        const d = new Date(r.date);
        return (
          d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
        );
      });
      setMyRecords(filtered);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load records");
    }
  }, [actor, session.token, session.name, selectedMonth, selectedYear]);

  useEffect(() => {
    loadMyRecords();
  }, [loadMyRecords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    setSubmitting(true);
    try {
      await actor.addRecord(
        session.token,
        date,
        customerName.trim(),
        Number.parseFloat(amountReceived),
        0,
        0,
        0,
        session.name,
      );
      setCustomerName("");
      setAmountReceived("");
      setDate(new Date().toISOString().split("T")[0]);
      await loadMyRecords();
      toast.success("Record added successfully!");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to add record");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor) return;
    if (newPwd.length < 4) {
      toast.error("Password must be at least 4 characters");
      return;
    }
    if (newPwd !== confirmPwd) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await actor.changeExecutivePassword(
        session.token,
        session.username,
        newPwd,
      );
      setNewPwd("");
      setConfirmPwd("");
      toast.success("Password changed. Please login again.");
      setTimeout(() => {
        clearToken();
        onLogout();
      }, 1500);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to update password");
    }
  };

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "oklch(0.96 0.01 265)" }}
    >
      <Sidebar
        userRole="executive"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        userName={session.name}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {activeTab === "add-record" && "Add Record"}
              {activeTab === "my-records" && "My Records"}
              {activeTab === "settings" && "Settings"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome, {session.name}
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
            {session.name[0].toUpperCase()}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {activeTab === "add-record" && (
            <div className="max-w-lg">
              <Card className="bg-card shadow-sm border border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-primary" />
                    New Profit Record
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-card-foreground/80">Date</Label>
                      <Input
                        data-ocid="record.input"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="bg-white border-border text-card-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-card-foreground/80">
                        Customer Name
                      </Label>
                      <Input
                        data-ocid="record.input"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Enter customer name"
                        required
                        className="bg-white border-border text-card-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-card-foreground/80">
                        Amount Received (₹)
                      </Label>
                      <Input
                        data-ocid="record.input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder="0.00"
                        required
                        className="bg-white border-border text-card-foreground"
                      />
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Executive Name
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {session.name}
                      </span>
                    </div>
                    <Button
                      type="submit"
                      data-ocid="record.submit_button"
                      disabled={submitting}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    >
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Adding...
                        </span>
                      ) : (
                        "Add Record"
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "my-records" && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Select
                  value={selectedMonth.toString()}
                  onValueChange={(v) => setSelectedMonth(Number.parseInt(v))}
                >
                  <SelectTrigger
                    data-ocid="myrecords.select"
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
                    data-ocid="myrecords.select"
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

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-card shadow-sm border border-border">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-card-foreground/60 uppercase mb-1">
                      Total Records
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {myRecords.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {MONTHS[selectedMonth - 1]} {selectedYear}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card shadow-sm border border-border">
                  <CardContent className="p-5">
                    <p className="text-xs font-medium text-card-foreground/60 uppercase mb-1">
                      Total Received
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(
                        myRecords.reduce((s, r) => s + r.amountReceived, 0),
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {MONTHS[selectedMonth - 1]} {selectedYear}
                    </p>
                  </CardContent>
                </Card>
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
                          Date
                        </TableHead>
                        <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                          Customer Name
                        </TableHead>
                        <TableHead className="text-card-foreground/70 font-semibold text-xs uppercase">
                          Amount Received
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myRecords.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground py-12"
                            data-ocid="myrecords.empty_state"
                          >
                            No records for {MONTHS[selectedMonth - 1]}{" "}
                            {selectedYear}
                          </TableCell>
                        </TableRow>
                      ) : (
                        myRecords.map((r, i) => (
                          <TableRow
                            key={r.id}
                            data-ocid={`myrecords.item.${i + 1}`}
                          >
                            <TableCell className="text-card-foreground/60 text-sm">
                              {i + 1}
                            </TableCell>
                            <TableCell className="text-card-foreground text-sm">
                              {r.date}
                            </TableCell>
                            <TableCell className="text-card-foreground font-medium text-sm">
                              {r.customerName}
                            </TableCell>
                            <TableCell className="text-card-foreground font-semibold text-sm">
                              {formatCurrency(r.amountReceived)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  {myRecords.length > 0 && (
                    <div className="px-4 py-3 border-t border-border flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        {myRecords.length} record(s)
                      </span>
                      <span className="text-sm font-semibold text-success">
                        Total:{" "}
                        {formatCurrency(
                          myRecords.reduce((s, r) => s + r.amountReceived, 0),
                        )}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="max-w-md">
              <Card className="bg-card shadow-sm border border-border">
                <CardHeader>
                  <CardTitle className="text-card-foreground flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-primary" />
                    Change Password
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="p-3 rounded-lg bg-muted/30 flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">
                        Username
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {session.username}
                      </span>
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
                    <p className="text-xs text-muted-foreground">
                      After changing your password, you will be logged out and
                      must sign in with the new password.
                    </p>
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
    </div>
  );
}
