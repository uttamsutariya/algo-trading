import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStrategyStore } from "@/store/useStrategyStore";
import { StrategyForm } from "./strategy-form";
import type { StrategyFormValues } from "./strategy-form-schema";
import { useInstruments } from "@/hooks/useInstruments";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { strategyApi } from "@/lib/api/strategy";
import { toast } from "sonner";

interface AddStrategyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddStrategyModal({ open, onOpenChange }: AddStrategyModalProps) {
  const { data: instruments, isLoading, isError } = useInstruments();

  const queryClient = useQueryClient();

  const createStrategy = useMutation({
    mutationFn: (payload: any) => {
      return strategyApi.createStrategy(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.log("error ::", error);
      toast.error("Failed to create strategy", {
        description: error.message
      });
    }
  });

  const onSubmit = (values: StrategyFormValues) => {
    createStrategy.mutate(values);
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
          <StrategyForm
            onSubmit={onSubmit}
            submitLabel={createStrategy.isPending ? "Adding..." : "Add Strategy"}
            loading={createStrategy.isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
