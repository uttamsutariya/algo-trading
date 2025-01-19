import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStrategyStore } from "@/store/useStrategyStore";
import { StrategyForm } from "./strategy-form";
import type { StrategyFormValues } from "./strategy-form-schema";

interface AddStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStrategyModal({ open, onOpenChange }: AddStrategyModalProps) {
  const addStrategy = useStrategyStore((state) => state.addStrategy);

  const onSubmit = (values: StrategyFormValues) => {
    addStrategy({
      ...values,
      status: "stopped"
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Strategy</DialogTitle>
        </DialogHeader>
        <StrategyForm onSubmit={onSubmit} submitLabel="Add Strategy" />
      </DialogContent>
    </Dialog>
  );
}
