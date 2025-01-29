import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStrategyStore } from "@/store/useStrategyStore";
import { StrategyForm } from "./strategy-form";
import type { StrategyFormValues } from "./strategy-form-schema";
import { useInstruments } from "@/hooks/useInstruments";

interface AddStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStrategyModal({ open, onOpenChange }: AddStrategyModalProps) {
  const addStrategy = useStrategyStore((state) => state.addStrategy);
  const { data: instruments, isLoading, isError } = useInstruments();

  const onSubmit = (values: StrategyFormValues) => {
    console.log("values", values);
    addStrategy({
      ...values,
      status: "running",
      rollOverOn: values.rollOverOn || undefined
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Strategy</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div>Loading instruments...</div>
        ) : isError ? (
          <div>Error loading instruments</div>
        ) : (
          <StrategyForm onSubmit={onSubmit} submitLabel="Add Strategy" />
        )}
      </DialogContent>
    </Dialog>
  );
}
