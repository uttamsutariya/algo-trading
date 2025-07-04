import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { UnderlyingSelect } from "./UnderlyingSelect";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";
import { useInstruments } from "@/hooks/useInstruments";
import { Instrument } from "@/hooks/useInstruments";
import { useBrokerStore } from "@/store/useBrokerStore";
import { Broker } from "@/lib/api/broker";

import { strategyFormSchema, type StrategyFormValues } from "./strategy-form-schema";

interface StrategyFormProps {
  defaultValues?: Partial<StrategyFormValues>;
  onSubmit: (values: StrategyFormValues) => void;
  submitLabel: string;
  loading: boolean;
  isEditMode?: boolean;
}

export function StrategyForm({ defaultValues, onSubmit, submitLabel, loading, isEditMode = false }: StrategyFormProps) {
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  };

  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      symbol: defaultValues?.symbol || { name: "", _id: "" },
      rollOverOn: defaultValues?.rollOverOn || getTomorrowDate(),
      broker: defaultValues?.broker || ""
    }
  });

  console.log("defaultValues ::", defaultValues);

  const { data: instruments } = useInstruments();
  const { getActiveBrokers, brokers } = useBrokerStore();
  const [underlyingOptions, setUnderlyingOptions] = useState<string[]>([]);
  const [exchangeOptions, setExchangeOptions] = useState<string[]>(["NSE"]);
  const [symbolTypeOptions, setSymbolTypeOptions] = useState<string[]>(["future"]);
  const [expiryOptions, setExpiryOptions] = useState<Instrument[]>([]);
  const [selectedUnderlying, setSelectedUnderlying] = useState<string>("");
  const [selectedExchange, setSelectedExchange] = useState<string>("NSE");
  const [selectedExpiry, setSelectedExpiry] = useState<Instrument | null>();
  const [isRollOverOnEnabled, setIsRollOverOnEnabled] = useState<boolean>(true);
  const [formError, setFormError] = useState<string>("");

  const prioritizedUnderlyings = ["NIFTY", "BANKNIFTY", "FINNIFTY", "GOLDM", "SILVERM"];

  // Get display name for selected broker (for edit mode)
  const getSelectedBrokerDisplay = (): string => {
    const currentBrokerValue = defaultValues?.broker;

    console.log("currentBrokerValue ::", currentBrokerValue);

    console.log("brokers ::", brokers);

    if (!currentBrokerValue) {
      return "No broker selected";
    }

    const selectedBroker = brokers.find((broker) => broker._id === currentBrokerValue);
    if (!selectedBroker) {
      return "Broker not found";
    }

    const displayName = selectedBroker.credentials.fy_id || selectedBroker.credentials.client_id || "Unknown";
    return selectedBroker.is_active ? displayName : `${displayName} (Inactive)`;
  };

  useEffect(() => {
    if (instruments) {
      const allUnderlyings = Object.keys(instruments);
      const sortedUnderlyings = [
        ...prioritizedUnderlyings,
        ...allUnderlyings.filter((u) => !prioritizedUnderlyings.includes(u))
      ];
      setUnderlyingOptions(sortedUnderlyings);
    }
  }, [instruments]);

  useEffect(() => {
    if (selectedUnderlying && instruments) {
      const exchanges = Object.keys(instruments[selectedUnderlying]);
      setExchangeOptions(exchanges);
      setSelectedExchange(exchanges[0]);
    }
  }, [selectedUnderlying, instruments]);

  useEffect(() => {
    if (selectedUnderlying && selectedExchange && instruments) {
      const filteredInstruments =
        instruments[selectedUnderlying][selectedExchange as keyof (typeof instruments)[string]];
      setExpiryOptions(filteredInstruments || []);
    }
  }, [selectedUnderlying, selectedExchange, instruments]);

  useEffect(() => {
    if (selectedExpiry) {
      form.setValue("symbol", {
        name: selectedExpiry.brokerSymbols.fyers,
        _id: selectedExpiry._id,
        brokerSymbols: {
          fyers: selectedExpiry.brokerSymbols.fyers
        },
        underlying: selectedExpiry.underlying,
        exchange: selectedExpiry.exchange
      });
    }
  }, [selectedExpiry, form]);

  useEffect(() => {
    if (defaultValues?.symbol) {
      setSelectedUnderlying(defaultValues.symbol.underlying);
      setSelectedExchange(defaultValues.symbol.exchange);
      setSelectedExpiry(expiryOptions.find((e) => e._id === defaultValues?.symbol?._id) || null);
    }
    if (defaultValues?.rollOverOn) {
      setIsRollOverOnEnabled(true);
    } else {
      setIsRollOverOnEnabled(false);
    }

    // Set broker value explicitly when defaultValues change
    if (defaultValues?.broker) {
      form.setValue("broker", defaultValues.broker);
    }
  }, [defaultValues, form]);

  const handleSubmit = (values: StrategyFormValues) => {
    if (!isEditMode && (!selectedUnderlying || !selectedExchange || !selectedExpiry)) {
      setFormError("Please select an underlying, exchange, and expiry.");
      return;
    }

    if (!values.broker || values.broker === "no-brokers") {
      setFormError("Please select a broker.");
      return;
    }

    if (!isEditMode) {
      const activeBrokers = getActiveBrokers();
      if (activeBrokers.length === 0) {
        setFormError("No active brokers available. Please add and activate a broker first.");
        return;
      }
    }

    setFormError("");

    const submissionValues = {
      ...values,
      rollOverOn: isRollOverOnEnabled ? values.rollOverOn : undefined
    };

    onSubmit(submissionValues);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditMode && (
          <div className="grid grid-cols-2 gap-4">
            <FormItem>
              <FormLabel>Underlying</FormLabel>
              <UnderlyingSelect
                options={underlyingOptions}
                value={selectedUnderlying}
                onChange={setSelectedUnderlying}
                prioritizedOptions={prioritizedUnderlyings}
              />
            </FormItem>

            <FormItem>
              <FormLabel>Exchange</FormLabel>
              <Select onValueChange={setSelectedExchange} defaultValue={selectedExchange} disabled={loading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exchange" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {exchangeOptions.map((exchange) => (
                    <SelectItem key={exchange} value={exchange}>
                      {exchange}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel>Symbol Type</FormLabel>
              <Select defaultValue="future" disabled>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {symbolTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel>Expiry</FormLabel>
              <Select
                onValueChange={(value) => setSelectedExpiry(expiryOptions.find((e) => e._id === value) || null)}
                defaultValue={selectedExpiry?._id}
                disabled={loading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiry" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {expiryOptions.map((instrument) => (
                    <SelectItem key={instrument._id} value={instrument._id}>
                      {format(new Date(instrument.expiry), "PPP")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          </div>
        )}

        <FormField
          control={form.control}
          name="symbol"
          disabled={true}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symbol</FormLabel>
              <FormControl>
                <Input {...field} readOnly value={field.value.name} disabled={true} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="broker"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Broker</FormLabel>
              {isEditMode ? (
                <FormControl>
                  <Input {...field} value={getSelectedBrokerDisplay()} disabled={true} readOnly />
                </FormControl>
              ) : (
                <Select onValueChange={field.onChange} value={field.value} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select broker" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getActiveBrokers().length === 0 ? (
                      <SelectItem value="no-brokers" disabled>
                        No active brokers available
                      </SelectItem>
                    ) : (
                      getActiveBrokers().map((broker) => (
                        <SelectItem key={broker._id} value={broker._id}>
                          {broker.credentials.fy_id || broker.credentials.client_id}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Roll Over On</FormLabel>
          <div className="flex items-center space-x-2">
            <Switch checked={isRollOverOnEnabled} onCheckedChange={setIsRollOverOnEnabled} disabled={loading} />
            <span>{isRollOverOnEnabled ? "Enabled" : "Disabled"}</span>
          </div>
          {isRollOverOnEnabled && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${
                    !form.watch("rollOverOn") && "text-muted-foreground"
                  }`}
                  disabled={loading}
                >
                  <CalendarIcon />
                  {form.watch("rollOverOn") ? (
                    format(form.watch("rollOverOn") || new Date(), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.watch("rollOverOn")}
                  onSelect={(date: Date | undefined) => {
                    if (isRollOverOnEnabled && date) {
                      // Use the selected date as-is since we only extract date portion
                      form.setValue("rollOverOn", date, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true
                      });
                    }
                  }}
                  disabled={(date) => {
                    // Disable today and all past dates
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    return date <= today;
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </FormItem>

        {formError && <div className="text-red-500">{formError}</div>}

        <Button type="submit" className="w-full" disabled={loading}>
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
