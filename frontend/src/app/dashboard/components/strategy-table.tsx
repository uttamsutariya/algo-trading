"use client";

import { Strategy } from "@/types/strategy";
import { useStrategyStore } from "@/store/useStrategyStore";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { EditStrategyModal } from "./edit-strategy-modal";

export function StrategyTable() {
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const { strategies, searchQuery, statusFilter, updateStrategy, deleteStrategy } = useStrategyStore();

  const filteredStrategies = strategies.filter((strategy: Strategy) => {
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
            <TableHead>Next Expiry</TableHead>
            <TableHead>Roll Over Status</TableHead>
            <TableHead>Roll Over On</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredStrategies.map((strategy: Strategy) => (
            <TableRow key={strategy.id}>
              <TableCell className="font-medium">{strategy.name}</TableCell>
              <TableCell>{strategy.description}</TableCell>
              <TableCell>
                <Switch
                  checked={strategy.status === "running"}
                  onCheckedChange={(checked: boolean) =>
                    updateStrategy(strategy.id, {
                      status: checked ? "running" : "stopped"
                    })
                  }
                />
              </TableCell>
              <TableCell>{format(strategy.nextExpiry, "MMM dd, yyyy")}</TableCell>
              <TableCell>
                <Switch
                  checked={strategy.rollOverStatus === "enabled"}
                  onCheckedChange={(checked: boolean) =>
                    updateStrategy(strategy.id, {
                      rollOverStatus: checked ? "enabled" : "disabled"
                    })
                  }
                />
              </TableCell>
              <TableCell>{format(strategy.rollOverOn, "MMM dd, yyyy")}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingStrategy(strategy)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteStrategy(strategy.id)}>
                    <Trash2 className="h-4 w-4" />
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
