'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, RotateCcw, History } from 'lucide-react';
import { QueryHistoryEntry } from '@/hooks/use-query-history';

interface QueryHistoryProps {
  history: QueryHistoryEntry[];
  onRerun: (entry: QueryHistoryEntry) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
}

function formatTime(ts: number) {
  const date = new Date(ts);
  return date.toLocaleString();
}

export function QueryHistory({ history, onRerun, onRemove, onClearAll }: QueryHistoryProps) {
  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <History className="h-4 w-4" />
          Query History
        </CardTitle>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            title="Clear all history"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No queries yet. Run one to see it here.
          </p>
        ) : (
          <ScrollArea className="h-[280px] pr-3">
            <ul className="space-y-2">
              {history.map(entry => (
                <li
                  key={entry.id}
                  className="group rounded-md border border-border bg-card p-2 hover:bg-accent/40 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-sm font-medium truncate"
                        title={entry.question}
                      >
                        {entry.question}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {entry.rowCount} row{entry.rowCount === 1 ? '' : 's'} ·{' '}
                        {formatTime(entry.timestamp)}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1 opacity-0 group-hover:opacity-100 transition">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onRerun(entry)}
                        title="Re-run this query"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onRemove(entry.id)}
                        title="Remove from history"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
