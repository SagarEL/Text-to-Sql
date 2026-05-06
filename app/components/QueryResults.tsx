import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DataVisualization } from "./DataVisualization";

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

export function QueryResults({ sqlQuery, queryResults, visualization }: QueryResultsProps) {
  return (
    <>
      {sqlQuery && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Generated SQL:</h2>
          <pre className="bg-secondary p-4 rounded text-sm overflow-x-auto">{sqlQuery}</pre>
        </div>
      )}
      
      {queryResults && queryResults.length > 0 && (
        <>
          {visualization && (
            <DataVisualization data={queryResults} config={visualization} />
          )}
          
          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-2">Query Results:</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(queryResults[0]).map((key) => (
                      <TableHead key={key}>{key}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {queryResults.map((row: any, index: number) => (
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