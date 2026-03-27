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
import { useEffect, useState } from "react";
import type { Executive, ProfitRecord } from "../lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  record: ProfitRecord | null;
  executives: Executive[];
  onSubmit: (
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
  ) => void;
}

export default function EditRecordModal({
  open,
  onClose,
  record,
  executives,
  onSubmit,
}: Props) {
  const [date, setDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [dailyTarget, setDailyTarget] = useState("");
  const [executiveName, setExecutiveName] = useState("");
  const [customerDailyTarget, setCustomerDailyTarget] = useState("");
  const [customerTotalReceived, setCustomerTotalReceived] = useState("");

  useEffect(() => {
    if (record) {
      setDate(record.date);
      setCustomerName(record.customerName);
      setAmountReceived(record.amountReceived.toString());
      setDailyTarget(record.dailyTarget.toString());
      setExecutiveName(record.executiveName);
      setCustomerDailyTarget((record.customerDailyTarget ?? 0).toString());
      setCustomerTotalReceived((record.customerTotalReceived ?? 0).toString());
    }
  }, [record]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!record) return;
    onSubmit(record.id, {
      date,
      customerName: customerName.trim(),
      amountReceived: Number.parseFloat(amountReceived),
      dailyTarget: Number.parseFloat(dailyTarget),
      executiveName,
      customerDailyTarget: Number.parseFloat(customerDailyTarget) || 0,
      customerTotalReceived: Number.parseFloat(customerTotalReceived) || 0,
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent
        data-ocid="edit_record.dialog"
        className="bg-card text-card-foreground max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Edit Profit Record</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input
              data-ocid="edit_record.input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Customer Name</Label>
            <Input
              data-ocid="edit_record.input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Amount Received (₹)</Label>
            <Input
              data-ocid="edit_record.input"
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
              data-ocid="edit_record.input"
              type="number"
              min="0"
              step="0.01"
              value={dailyTarget}
              onChange={(e) => setDailyTarget(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Customer Daily Amount Target (₹)</Label>
            <Input
              data-ocid="edit_record.input"
              type="number"
              min="0"
              step="0.01"
              value={customerDailyTarget}
              onChange={(e) => setCustomerDailyTarget(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Customer Total Amount Received (₹)</Label>
            <Input
              data-ocid="edit_record.input"
              type="number"
              min="0"
              step="0.01"
              value={customerTotalReceived}
              onChange={(e) => setCustomerTotalReceived(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Executive</Label>
            <Select value={executiveName} onValueChange={setExecutiveName}>
              <SelectTrigger data-ocid="edit_record.select">
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
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              data-ocid="edit_record.cancel_button"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="edit_record.submit_button"
              className="bg-primary text-primary-foreground"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
