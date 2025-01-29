"use client";

import { Strategy } from "@/types/strategy";
import { useStrategyStore } from "@/store/useStrategyStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { EditStrategyModal } from "./edit-strategy-modal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { strategyApi } from "@/lib/api/strategy";
import { toast } from "sonner";

export function StrategyTable() {
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [deletingStrategyId, setDeletingStrategyId] = useState<string | null>(null);
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
    },
    onError: () => {
      toast.error("Failed to delete strategy");
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

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this strategy?")) {
      setDeletingStrategyId(id);
      deleteMutation.mutate(id, {
        onSettled: () => setDeletingStrategyId(null)
      });
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
            <strong>Copied Syntax:</strong>
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
                  <Button variant="default" size={"sm"} onClick={() => handleCopySyntax(strategy._id)}>
                    Copy
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
    </>
  );
}
