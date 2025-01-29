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

import { strategyFormSchema, type StrategyFormValues } from "./strategy-form-schema";

interface StrategyFormProps {
  defaultValues?: Partial<StrategyFormValues>;
  onSubmit: (values: StrategyFormValues) => void;
  submitLabel: string;
}

export function StrategyForm({ defaultValues, onSubmit, submitLabel }: StrategyFormProps) {
  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues: {
      name: "",
      description: "",
      symbol: { name: "", _id: "" },
      rollOverOn: new Date(),
      ...defaultValues
    }
  });

  const { data: instruments } = useInstruments();
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
        _id: selectedExpiry._id
      });
    }
  }, [selectedExpiry, form]);

  const handleSubmit = (values: StrategyFormValues) => {
    if (!selectedUnderlying || !selectedExchange || !selectedExpiry) {
      setFormError("Please select an underlying, exchange, and expiry.");
      return;
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
                <Input {...field} />
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
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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
            <Select onValueChange={setSelectedExchange} defaultValue={selectedExchange}>
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

        <FormField
          control={form.control}
          name="symbol"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Symbol</FormLabel>
              <FormControl>
                <Input {...field} readOnly value={field.value.name} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Roll Over On</FormLabel>
          <div className="flex items-center space-x-2">
            <Switch checked={isRollOverOnEnabled} onCheckedChange={setIsRollOverOnEnabled} />
            <span>{isRollOverOnEnabled ? "Enabled" : "Disabled"}</span>
          </div>
          {isRollOverOnEnabled && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${
                    !form.getValues("rollOverOn") && "text-muted-foreground"
                  }`}
                >
                  <CalendarIcon />
                  {form.getValues("rollOverOn") ? (
                    format(form.getValues("rollOverOn") || new Date(), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.getValues("rollOverOn")}
                  onSelect={(date) => form.setValue("rollOverOn", isRollOverOnEnabled ? date : undefined)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </FormItem>

        {formError && <div className="text-red-500">{formError}</div>}

        <Button type="submit" className="w-full">
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
