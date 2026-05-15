import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { DataVisualization } from "./DataVisualization";
import { downloadCsv, downloadExcel } from "@/lib/export-utils";

interface VisualizationConfig {
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'grouped_bar';
  xAxis?: string;
  yAxis?: string;
  yAxes?: string[];
  dataKey?: string;
  nameKey?: string;
  title?: string;
}

interface QueryResultsProps {
  sqlQuery: string;
  queryResults: any[] | null;
  visualization?: VisualizationConfig;
}

function isModificationStatus(row: any): boolean {
  return (
    row !== null &&
    typeof row === 'object' &&
    'status' in row &&
    'affected_rows' in row
  );
}

export function QueryResults({ sqlQuery, queryResults, visualization }: QueryResultsProps) {
  const hasResults = !!(queryResults && queryResults.length > 0);
  const isModification = hasResults && isModificationStatus(queryResults![0]);

  return (
    <>
      {sqlQuery && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Generated SQL:</h2>
          <pre className="bg-secondary p-4 rounded text-sm overflow-x-auto">{sqlQuery}</pre>
        </div>
      )}

      {hasResults && isModification && (
        <div className="mt-4 flex items-start gap-3 rounded-md border border-green-500/30 bg-green-500/10 p-4">
          <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-green-700 dark:text-green-400">
              {queryResults![0].message || 'Query executed successfully.'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {queryResults![0].affected_rows} row(s) affected.
            </p>
          </div>
        </div>
      )}

      {hasResults && !isModification && (
        <>
          {visualization && (
            <DataVisualization data={queryResults!} config={visualization} />
          )}

          <div className="mt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h2 className="text-xl font-semibold">Query Results:</h2>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadCsv(queryResults!)}
                  title="Download as CSV"
                >
                  <Download className="h-4 w-4 mr-1.5" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadExcel(queryResults!)}
                  title="Download as Excel"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1.5" />
                  Excel
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(queryResults![0]).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResults!.map((row: any, index: number) => (
                    <TableRow key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <TableCell key={cellIndex}>{value?.toString() || ''}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
