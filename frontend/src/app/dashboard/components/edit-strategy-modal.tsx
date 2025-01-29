import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStrategyStore } from "@/store/useStrategyStore";
import { Strategy } from "@/types/strategy";
import { StrategyForm } from "./strategy-form";
import type { StrategyFormValues } from "./strategy-form-schema";
import { useInstruments } from "@/hooks/useInstruments";

interface EditStrategyModalProps {
  strategy: Strategy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStrategyModal({ strategy, open, onOpenChange }: EditStrategyModalProps) {
  const updateStrategy = useStrategyStore((state) => state.updateStrategy);
  const { data: instruments, isLoading, isError } = useInstruments();

  const onSubmit = (values: StrategyFormValues) => {
    if (strategy) {
      updateStrategy(strategy.id, values);
      onOpenChange(false);
    }
  };

  if (!strategy) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Strategy</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div>Loading instruments...</div>
        ) : isError ? (
          <div>Error loading instruments</div>
        ) : (
          <StrategyForm defaultValues={strategy} onSubmit={onSubmit} submitLabel="Update Strategy" />
        )}
      </DialogContent>
    </Dialog>
  );
}
