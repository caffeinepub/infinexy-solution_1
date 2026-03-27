import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import type { Executive } from "../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    date: string;
    customerName: string;
    amountReceived: number;
    dailyTarget: number;
    executiveName: string;
  }) => void;
  executives: Executive[];
  defaultExecutiveName?: string;
  showExecutiveField?: boolean;
}

export default function AddRecordModal({
  open,
  onClose,
  onSubmit,
  executives,
  defaultExecutiveName,
  showExecutiveField = true,
}: Props) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerName, setCustomerName] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [dailyTarget, setDailyTarget] = useState("");
  const [executiveName, setExecutiveName] = useState(
    defaultExecutiveName ?? "",
  );

  const reset = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setCustomerName("");
    setAmountReceived("");
    setDailyTarget("");
    setExecutiveName(defaultExecutiveName ?? "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date,
      customerName: customerName.trim(),
      amountReceived: Number.parseFloat(amountReceived),
      dailyTarget: Number.parseFloat(dailyTarget) || 0,
      executiveName: showExecutiveField
        ? executiveName
        : (defaultExecutiveName ?? ""),
    });
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          onClose();
        }
      }}
    >
      <DialogContent
        data-ocid="record.dialog"
        className="bg-card text-card-foreground"
      >
        <DialogHeader>
          <DialogTitle>Add Profit Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              data-ocid="record.input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Customer Name</Label>
            <Input
              data-ocid="record.input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Amount Received (₹)</Label>
            <Input
              data-ocid="record.input"
              type="number"
              min="0"
              step="0.01"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Daily Target Amount (₹)</Label>
            <Input
              data-ocid="record.input"
              type="number"
              min="0"
              step="0.01"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              placeholder="0.00"
            />
          </div>
          {showExecutiveField && (
            <div className="space-y-1.5">
              <Label>Executive</Label>
              <Select value={executiveName} onValueChange={setExecutiveName}>
                <SelectTrigger data-ocid="record.select">
                  <SelectValue placeholder="Select executive" />
                </SelectTrigger>
                <SelectContent>
                  {executives.map((e) => (
                    <SelectItem key={e.id} value={e.name}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="record.cancel_button"
              onClick={() => {
                reset();
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="record.submit_button"
              className="bg-primary text-primary-foreground"
            >
              Add Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
