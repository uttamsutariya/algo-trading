import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Strategy } from "@/types/strategy";
import { StrategyForm } from "./strategy-form";
import type { StrategyFormValues } from "./strategy-form-schema";
import { useInstruments } from "@/hooks/useInstruments";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { strategyApi } from "@/lib/api/strategy";
import { toast } from "sonner";

interface EditStrategyModalProps {
  strategy: Strategy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditStrategyModal({ strategy, open, onOpenChange }: EditStrategyModalProps) {
  const { data: instruments, isLoading, isError } = useInstruments();

  const queryClient = useQueryClient();

  const updateStrategy = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => {
      return strategyApi.updateStrategy(id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Failed to update strategy", {
        description: error.message
      });
    }
  });

  const onSubmit = (values: StrategyFormValues) => {
    if (strategy) {
      updateStrategy.mutate({
        id: strategy._id,
        payload: values
      });
    }
  };

  if (!strategy) return null;

  const defaultValues: StrategyFormValues = {
    name: strategy.name,
    description: strategy.description,
    symbol: {
      name: strategy.symbol.brokerSymbols.fyers,
      _id: strategy.symbol._id,
      brokerSymbols: {
        fyers: strategy.symbol.brokerSymbols.fyers
      },
      underlying: strategy.symbol.underlying,
      exchange: strategy.symbol.exchange
    },
    broker: strategy.broker._id,
    rollOverOn: strategy.rollOverOn ? new Date(strategy.rollOverOn) : undefined
  };

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
          <StrategyForm
            loading={updateStrategy.isPending}
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            submitLabel={updateStrategy.isPending ? "Updating..." : "Update Strategy"}
            isEditMode={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
