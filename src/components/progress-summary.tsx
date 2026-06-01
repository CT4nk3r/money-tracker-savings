import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { clampProgress, formatMoney } from "@/lib/money";

type ProgressSummaryProps = {
  label: string;
  savedAmountMinor: number;
  targetAmountMinor: number;
  currency: string;
  status?: string;
};

export function ProgressSummary({
  label,
  savedAmountMinor,
  targetAmountMinor,
  currency,
  status,
}: ProgressSummaryProps) {
  const progress = clampProgress(savedAmountMinor, targetAmountMinor);

  return (
    <div className="grid gap-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{label}</div>
          <div className="text-sm text-muted-foreground">
            {formatMoney(savedAmountMinor, currency)} of {formatMoney(targetAmountMinor, currency)}
          </div>
        </div>
        {status ? <Badge variant={status === "ready" ? "default" : "secondary"}>{status}</Badge> : null}
      </div>
      <Progress value={progress} />
    </div>
  );
}
