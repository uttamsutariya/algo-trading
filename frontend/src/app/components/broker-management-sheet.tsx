import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { brokerApi, Broker } from "@/lib/api/broker";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus, LogIn } from "lucide-react";
import { AddBrokerModal } from "./add-broker-modal";
import { toast } from "sonner";

interface BrokerManagementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BrokerManagementSheet({ open, onOpenChange }: BrokerManagementSheetProps) {
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchBrokers = async () => {
    try {
      setLoading(true);
      const response = await brokerApi.getBrokers();
      setBrokers(response.brokers);
      setError(null);
    } catch (err) {
      setError("Failed to fetch brokers");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (brokerId: string) => {
    try {
      const response = await brokerApi.loginBroker(brokerId);
      window.open(response.authUrl, "_self");
      toast.success("Login successful");
      fetchBrokers();
    } catch (error) {
      toast.error("Failed to login broker");
      console.error(error);
    }
  };

  useEffect(() => {
    if (open) {
      fetchBrokers();
    }
  }, [open]);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[800px]">
          <SheetHeader className="flex flex-row items-center justify-between">
            <SheetTitle>Manage Brokers</SheetTitle>
          </SheetHeader>
          <div className="flex justify-start mt-3">
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Broker
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">Loading...</div>
            ) : error ? (
              <div className="text-red-500 text-center p-4">{error}</div>
            ) : (
              <div className="space-y-4">
                {brokers.map((broker) => (
                  <div key={broker._id} className="p-4 rounded-lg border bg-card text-card-foreground shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Fy ID: <span className="font-semibold text-black">{broker.credentials.fy_id || "N/A"}</span>
                        </p>

                        <p className="text-sm text-muted-foreground mt-1">
                          Client ID:{" "}
                          <span className="font-semibold text-black">{broker.credentials.client_id || "N/A"}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={broker.is_active ? "default" : "secondary"}>
                          {broker.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {!broker.is_active && (
                          <Button variant="outline" size="sm" onClick={() => handleLogin(broker._id)} className="h-8">
                            <LogIn className="h-4 w-4 mr-1" />
                            Login
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {brokers.length === 0 && <div className="text-center text-muted-foreground py-8">No brokers found</div>}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <AddBrokerModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} onSuccess={fetchBrokers} />
    </>
  );
}
