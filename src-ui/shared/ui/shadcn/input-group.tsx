import { cn } from "@/shared/lib/utils";
import * as React from "react";

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex w-full items-center", className)}
      {...props}
    />
  );
});
InputGroup.displayName = "InputGroup";

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex h-10 items-center whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm",
        className
      )}
      {...props}
    />
  );
});
InputGroupAddon.displayName = "InputGroupAddon";

export { InputGroup, InputGroupAddon };
