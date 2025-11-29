"use client";

import { Fragment, useMemo, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useSettings } from "../../hooks/useSettings";

const maskValue = (value: string, isVisible: boolean) => {
  if (isVisible) return value || "(empty)";
  if (!value) return "(empty)";
  const lastFour = value.slice(-4);
  return `••••${lastFour}`;
};

export function ApiKeyManager() {
  const { apiKeys, setApiKey, removeApiKey, clearAllApiKeys } = useSettings();
  const entries = useMemo(() => Object.entries(apiKeys), [apiKeys]);

  const [serviceName, setServiceName] = useState("");
  const [keyValue, setKeyValue] = useState("");
  const [isValueVisible, setIsValueVisible] = useState(false);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const handleSubmit = () => {
    const trimmedService = serviceName.trim();
    if (!trimmedService || !keyValue) {
      return;
    }

    setApiKey(trimmedService, keyValue);
    setServiceName("");
    setKeyValue("");
    setIsValueVisible(false);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="pointer-events-auto" variant="outline">
          Manage Keys
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>API Key Manager</DialogTitle>
          <DialogDescription>
            Keys are stored in your browser and bundled with workflow saves.
            Avoid using production credentials.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Stored keys</h3>
              {entries.length > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => clearAllApiKeys()}
                >
                  Clear all
                </Button>
              ) : null}
            </div>
            <ScrollArea className="max-h-60 rounded-md border">
              <div className="divide-y">
                {entries.length === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No keys stored yet. Add one below.
                  </div>
                ) : (
                  entries.map(([service, value]) => {
                    const isVisible = revealed[service] ?? false;
                    return (
                      <Fragment key={service}>
                        <div className="flex items-start justify-between gap-4 p-4">
                          <div>
                            <p className="text-sm font-medium">{service}</p>
                            <p className="text-xs text-muted-foreground">
                              {maskValue(value, isVisible)}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setRevealed((current) => ({
                                  ...current,
                                  [service]: !isVisible,
                                }))
                              }
                            >
                              {isVisible ? "Hide" : "Show"}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeApiKey(service)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      </Fragment>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Add or update a key</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="api-key-service">Service name</Label>
                <Input
                  id="api-key-service"
                  placeholder="e.g. openai"
                  value={serviceName}
                  onChange={(event) => setServiceName(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="api-key-value">API key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key-value"
                    type={isValueVisible ? "text" : "password"}
                    placeholder="sk-..."
                    value={keyValue}
                    onChange={(event) => setKeyValue(event.target.value)}
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => setIsValueVisible((prev) => !prev)}
                  >
                    {isValueVisible ? "Hide" : "Show"}
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="justify-between">
              <div className="text-xs text-muted-foreground">
                Re-using a service name overwrites the existing value.
              </div>
              <Button
                type="button"
                disabled={!serviceName.trim() || !keyValue}
                onClick={handleSubmit}
              >
                Save key
              </Button>
            </DialogFooter>
          </section>
          <Separator />
          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <Badge variant="secondary" className="mr-2">
              Heads up
            </Badge>
            Keys persist with the workflow file. Anyone opening the file inside
            this experiment can view them.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


