"use client";

import { useState } from "react";
import { useStrategyStore } from "@/store/useStrategyStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StrategyTable } from "@/app/components/strategy-table";
import { AddStrategyModal } from "@/app/components/add-strategy-modal";
import { BrokerManagementSheet } from "@/app/components/broker-management-sheet";
import { Search, Plus, Settings } from "lucide-react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    }
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBrokerSheetOpen, setIsBrokerSheetOpen] = useState(false);
  const { setSearchQuery, setStatusFilter, statusFilter } = useStrategyStore();

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">Trading Strategies</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsBrokerSheetOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Brokers
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Strategy
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search strategies..."
            className="pl-10"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value: "all" | "running" | "stopped") => setStatusFilter(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="running">Running</SelectItem>
            <SelectItem value="stopped">Stopped</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <StrategyTable />

      <AddStrategyModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} />
      <BrokerManagementSheet open={isBrokerSheetOpen} onOpenChange={setIsBrokerSheetOpen} />
    </div>
  );
}
