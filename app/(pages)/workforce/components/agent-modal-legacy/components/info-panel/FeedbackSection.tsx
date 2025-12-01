import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { FeedbackSectionProps } from "../../types/info-panel/items";

export function FeedbackSection({ feedback, onChange, onSubmit, history }: FeedbackSectionProps) {
  return (
    <div className="mb-6 space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Feedback log
      </h3>
      <div className="space-y-3">
        {history.map((item) => (
          <div key={item.comment} className="rounded-xl border border-border bg-background p-4 text-sm">
            <div className="font-semibold text-foreground">{item.author}</div>
            <p className="text-muted-foreground">{item.comment}</p>
            <div className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
              {item.timestamp}
            </div>
          </div>
        ))}
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">No feedback yet.</p>
        ) : null}
      </div>
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Textarea
          value={feedback}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Leave feedback for this agent"
          className="min-h-[80px]"
        />
        <Button type="submit" className="w-full">
          Submit feedback
        </Button>
      </form>
    </div>
  );
}

