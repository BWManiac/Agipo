"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { MetricsOverview } from "./MetricsOverview";
import { rotatingMessages, heroTrustCopy } from "../data/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const ROTATION_INTERVAL = 3000;
const actions = [
  { href: "/tools/editor", label: "Create an agent", variant: "default" as const },
  { href: "/tools/editor", label: "Create a tool", variant: "outline" as const },
  { href: "/marketplace", label: "Browse marketplace", variant: "outline" as const },
  { href: "/tools", label: "View my tools", variant: "outline" as const },
  { href: "/workforce", label: "Manage workforce", variant: "outline" as const },
  { href: "/records", label: "Manage Records", variant: "outline" as const },
  { href: "/profile", label: "Open profile", variant: "ghost" as const },
];

export function HeroSection() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % rotatingMessages.length);
    }, ROTATION_INTERVAL);

    return () => clearInterval(id);
  }, []);

  return (
    <section className="rounded-2xl border border-border bg-background px-6 py-8 shadow-sm">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <Badge variant="outline" className="uppercase tracking-[0.24em] text-xs">
              Operating Hub
            </Badge>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                Orchestrate your AI workforce
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Create, deploy, and manage multiple AI agents through natural language. Build
                transparent, scannable automations that run entirely in your browser.
              </p>
            </div>
            <div className="min-h-[1.5rem] text-sm font-medium text-muted-foreground">
              {rotatingMessages[messageIndex]}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1 md:flex-nowrap">
              {actions.map((action, index) => (
                <Button
                  key={`${action.href}-${action.label}-${index}`}
                  size="lg"
                  variant={action.variant}
                  className={cn(
                    "whitespace-nowrap rounded-full px-6",
                    action.variant === "default"
                      ? "shadow-sm"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                  asChild
                >
                  <Link href={action.href}>{action.label}</Link>
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/40 p-4 text-left text-sm text-muted-foreground lg:max-w-sm">
            <span className="text-2xl" aria-hidden>
              ⚡
            </span>
            <p className="leading-relaxed">{heroTrustCopy}</p>
          </div>
        </div>
        <Separator />
        <MetricsOverview />
      </div>
    </section>
  );
}
