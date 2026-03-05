import { cn } from "@/shared/lib/utils";
import * as React from "react";

const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("inline-flex rounded-md shadow-sm", className)}
      role="group"
      {...props}
    />
  );
});
ButtonGroup.displayName = "ButtonGroup";

export { ButtonGroup };
