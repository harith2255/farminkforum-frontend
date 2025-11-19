"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // base styles
        "inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5",
        "rounded-xl border border-transparent px-4 py-2 text-sm font-medium whitespace-nowrap",
        "text-gray-700 dark:text-gray-300 transition-all select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bf2026]/50",

        // hover effect
        "hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-[#bf2026]",

          // Active tab (clicked one): stays red
        "data-[state=active]:text-[#bf2026] data-[state=active]:font-semibold",

  

        // disabled
        "disabled:pointer-events-none disabled:opacity-50",

        // svg handling (for optional icons)
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",

        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
