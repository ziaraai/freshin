import * as React from "react"

import { cn } from "@/lib/utils"
import { useLayout } from "@/contexts/LayoutContext"

const useIsRtl = () => {
  try {
    const layout = useLayout();
    return layout?.position === 'right' || (layout as any)?.effectivePosition === 'right' || layout?.isRtl;
  } catch {
    if (typeof document !== 'undefined') {
      return document.documentElement.dir === 'rtl' || document.documentElement.getAttribute('dir') === 'rtl' || document.body?.getAttribute('dir') === 'rtl';
    }
    return false;
  }
};

function Input({ className, type, ref, onClick, dir, ...props }: React.ComponentProps<"input">) {
  const innerRef = React.useRef<HTMLInputElement>(null);
  const isRtl = useIsRtl();
  const isDateType = type === "date" || type === "datetime-local" || type === "time" || type === "month";
  const inputDir = dir || (isDateType ? (isRtl ? "rtl" : "ltr") : undefined);

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (isDateType && innerRef.current) {
      try {
        innerRef.current.showPicker?.();
      } catch (err) {
        // Ignore errors if showPicker is unsupported or already open
      }
    }
    if (onClick) onClick(e);
  };

  return (
    <input
      type={type}
      data-slot="input"
      dir={inputDir}
      className={cn(
        "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary rounded-md selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        isDateType && !props.disabled ? "cursor-pointer [color-scheme:light] dark:[color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer" : "",
        isDateType && (isRtl
          ? "justify-end text-right rtl:justify-end rtl:text-right [&::-webkit-datetime-edit]:ml-auto [&::-webkit-datetime-edit]:inline-flex [&::-webkit-calendar-picker-indicator]:ml-2 [&::-webkit-calendar-picker-indicator]:mr-0"
          : "justify-start text-left ltr:justify-start ltr:text-left"),
        className
      )}
      ref={(node) => {
        innerRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
      }}
      onClick={handleClick}
      {...props}
    />
  )
}

export { Input }
