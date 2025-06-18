"use client";

import { Strategy } from "@/types/strategy";
import { useStrategyStore } from "@/store/useStrategyStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Edit2, Trash2, Copy, RefreshCw, CopyIcon } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { EditStrategyModal } from "./edit-strategy-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { strategyApi } from "@/lib/api/strategy";
import { toast } from "sonner";

export function StrategyTable() {
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [deletingStrategyId, setDeletingStrategyId] = useState<string | null>(null);
  const [rolloverConfirmOpen, setRolloverConfirmOpen] = useState(false);
  const [deleteStrategyOpen, setDeleteStrategyOpen] = useState(false);
  const [rolloverStrategyId, setRolloverStrategyId] = useState<string | null>(null);
  const { searchQuery, statusFilter } = useStrategyStore();
  const queryClient = useQueryClient();

  const {
    data: strategiesData,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ["strategies"],
    queryFn: strategyApi.getStrategies
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => strategyApi.deleteStrategy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy deleted successfully");
      setDeleteStrategyOpen(false);
      setDeletingStrategyId(null);
    },
    onError: () => {
      toast.error("Failed to delete strategy");
      setDeletingStrategyId(null);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      return strategyApi.updateStrategy(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy status updated successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to update strategy status");
    }
  });

  const rolloverMutation = useMutation({
    mutationFn: (id: string) => strategyApi.rolloverStrategy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["strategies"] });
      toast.success("Strategy rollover initiated successfully");
      setRolloverConfirmOpen(false);
      setRolloverStrategyId(null);
    },
    onError: () => {
      toast.error("Failed to initiate strategy rollover");
    }
  });

  const handleDelete = (id: string) => {
    setDeletingStrategyId(id);
    setDeleteStrategyOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingStrategyId) {
      deleteMutation.mutate(deletingStrategyId);
    }
  };

  const handleStatusToggle = (strategy: Strategy, checked: boolean) => {
    const newStatus = checked ? "running" : "stopped";
    updateStatusMutation.mutate({ id: strategy._id, status: newStatus });
  };

  const handleCopySyntax = (strategyId: string) => {
    const jsonValue = JSON.stringify(
      {
        strategyId,
        qty: "{{strategy.order.contracts}}",
        side: "{{strategy.order.action}}"
      },
      null,
      2
    );

    navigator.clipboard
      .writeText(jsonValue)
      .then(() => {
        toast.success(
          <div className="text-sm">
            <strong>Message Copied</strong>
            <pre className="text-xs">{jsonValue}</pre>
          </div>,
          {
            duration: 5000
          }
        );
      })
      .catch(() => {
        toast.error("Failed to copy syntax");
      });
  };

  const handleRolloverClick = (strategyId: string) => {
    setRolloverStrategyId(strategyId);
    setRolloverConfirmOpen(true);
  };

  const handleRolloverConfirm = () => {
    if (rolloverStrategyId) {
      rolloverMutation.mutate(rolloverStrategyId);
    }
  };

  if (isLoading) {
    return <div>Loading strategies...</div>;
  }

  if (isError) {
    return <div>Error loading strategies: {error.message}</div>;
  }

  const filteredStrategies = strategiesData.filter((strategy: Strategy) => {
    const matchesSearch =
      strategy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      strategy.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || strategy.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Broker</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Roll Over On</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStrategies.map((strategy: Strategy) => (
            <TableRow key={strategy._id}>
              <TableCell className="font-medium">{strategy.name}</TableCell>
              <TableCell>{strategy.description}</TableCell>
              <TableCell>
                {strategy.broker?.credentials?.fy_id || strategy.broker?.credentials?.client_id || "N/A"}
              </TableCell>
              <TableCell>
                <Switch
                  checked={strategy.status === "running"}
                  onCheckedChange={(checked: boolean) => handleStatusToggle(strategy, checked)}
                  disabled={updateStatusMutation.isPending}
                />
              </TableCell>
              <TableCell>
                {strategy.rollOverOn ? format(new Date(strategy.rollOverOn), "MMM dd, yyyy") : "N/A"}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingStrategy(strategy)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(strategy._id)}
                    disabled={deletingStrategyId === strategy._id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRolloverClick(strategy._id)}
                    disabled={rolloverMutation.isPending}
                    title="Roll Over Strategy"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="default" size={"sm"} onClick={() => handleCopySyntax(strategy._id)}>
                    <CopyIcon className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <EditStrategyModal
        strategy={editingStrategy}
        open={!!editingStrategy}
        onOpenChange={(open: boolean) => !open && setEditingStrategy(null)}
      />

      <Dialog open={deleteStrategyOpen} onOpenChange={setDeleteStrategyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Strategy Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this strategy? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteStrategyOpen(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete Strategy"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rolloverConfirmOpen} onOpenChange={setRolloverConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Strategy Rollover</DialogTitle>
            <DialogDescription>
              Are you sure you want to roll over this strategy? This action will initiate the rollover process.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRolloverConfirmOpen(false)}
              disabled={rolloverMutation.isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleRolloverConfirm} disabled={rolloverMutation.isPending}>
              {rolloverMutation.isPending ? "Rolling over..." : "Confirm Rollover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
