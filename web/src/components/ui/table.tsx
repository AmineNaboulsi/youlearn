import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

/**
 * Table primitives.
 *
 * The wrapper owns the horizontal scroll rather than the page: a wide roster
 * must not make the whole layout slide sideways on a phone.
 */

export function TableWrap({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-card border border-line", className)}>
      <table className="w-full min-w-[42rem] border-collapse text-start text-[13px]">
        {children}
      </table>
    </div>
  );
}

export function Th({
  children,
  className,
  numeric,
}: {
  children: ReactNode;
  className?: string;
  numeric?: boolean;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line bg-surface-sunk px-4 py-3 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted",
        numeric && "text-end",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className,
  numeric,
}: {
  children: ReactNode;
  className?: string;
  numeric?: boolean;
}) {
  return (
    <td
      className={cn(
        "border-b border-line px-4 py-3 align-middle text-ink-soft",
        numeric && "tabular text-end",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function Tr({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <tr className={cn("transition-colors duration-100 hover:bg-surface-sunk", className)}>
      {children}
    </tr>
  );
}
