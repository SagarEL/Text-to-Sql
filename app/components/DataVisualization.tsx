'use client';

import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  ScatterChart, 
  Scatter,
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface VisualizationConfig {
  type: 'bar' | 'line' | 'scatter' | 'pie' | 'grouped_bar';
  xAxis?: string;
  yAxis?: string;
  yAxes?: string[];
  dataKey?: string;
  nameKey?: string;
  title?: string;
}

interface DataVisualizationProps {
  data: any[];
  config: VisualizationConfig;
}

const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#82ca9d', '#ffc658', '#ff7c7c', '#a4de6c', '#d084d0'
];

export function DataVisualization({ data, config }: DataVisualizationProps) {
  if (!data || data.length === 0 || !config) {
    return null;
  }

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={config.xAxis} 
                angle={data.length > 10 ? -45 : 0}
                textAnchor={data.length > 10 ? "end" : "middle"}
                height={data.length > 10 ? 80 : 30}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey={config.yAxis} fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={config.xAxis}
                angle={data.length > 20 ? -45 : 0}
                textAnchor={data.length > 20 ? "end" : "middle"}
                height={data.length > 20 ? 80 : 30}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={config.yAxis} 
                stroke={COLORS[0]} 
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xAxis} name={config.xAxis} />
              <YAxis dataKey={config.yAxis} name={config.yAxis} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name={config.title} data={data} fill={COLORS[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey={config.dataKey}
                nameKey={config.nameKey}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry: any) => `${entry[config.nameKey!]}: ${entry[config.dataKey!]}`}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'grouped_bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={config.xAxis}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.yAxes?.map((yAxis, index) => (
                <Bar 
                  key={yAxis} 
                  dataKey={yAxis} 
                  fill={COLORS[index % COLORS.length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">{config.title || 'Data Visualization'}</h2>
      <div className="bg-card p-4 rounded-lg border">
        {renderChart()}
      </div>
    </div>
  );
}
