interface BarChartProps {
  data: { label: string; value: number }[];
  maxHeight?: number;
  barColor?: string;
}

export default function BarChart({ data, maxHeight = 120, barColor = 'bg-blue-500' }: BarChartProps) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1" style={{ height: maxHeight }}>
      {data.map((d, i) => {
        const height = (d.value / maxVal) * maxHeight;
        return (
          <div key={i} className="flex flex-col items-center flex-1 min-w-0 group">
            <div className="relative w-full flex justify-center">
              <div
                className={`w-full max-w-8 rounded-t ${barColor} transition-all duration-200 group-hover:opacity-80`}
                style={{ height: Math.max(height, 2) }}
                title={`${d.label}: ${d.value.toLocaleString()}`}
              />
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                {d.value.toLocaleString()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
