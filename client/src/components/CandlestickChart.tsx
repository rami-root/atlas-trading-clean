import { useEffect, useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import { CandlestickController, CandlestickElement } from 'chartjs-chart-financial';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
  CandlestickController,
  CandlestickElement
);

interface CandlestickChartProps {
  symbol: string;
  currentPrice: number;
}

export default function CandlestickChart({ symbol, currentPrice }: CandlestickChartProps) {
  const chartRef = useRef<ChartJS>(null);
  const [chartData, setChartData] = useState<any>(null);

  useEffect(() => {
    if (currentPrice === 0) return;

    const generateData = () => {
      const data = [];
      let price = currentPrice;
      const now = Date.now();
      
      for (let i = 100; i >= 0; i--) {
        const time = now - i * 60000;
        const volatility = price * 0.002;
        
        const open = price;
        const close = open + (Math.random() - 0.5) * volatility * 2;
        const high = Math.max(open, close) + Math.random() * volatility;
        const low = Math.min(open, close) - Math.random() * volatility;
        
        data.push({ x: time, o: open, h: high, l: low, c: close });
        price = close;
      }
      
      return data;
    };

    const initialData = generateData();

    setChartData({
      datasets: [
        {
          label: symbol,
          data: initialData,
          borderColor: function(context: any) {
            const data = context.raw;
            return data.c >= data.o ? '#22c55e' : '#ef4444';
          },
          backgroundColor: function(context: any) {
            const data = context.raw;
            return data.c >= data.o ? '#22c55e' : '#ef4444';
          },
          borderWidth: 2,
        },
      ],
    });

    let lastPrice = initialData[initialData.length - 1].c;
    
    // تحديث كل 3 ثواني بدلاً من كل ثانية
    const updateInterval = setInterval(() => {
      if (!chartRef.current) return;
      
      const volatility = currentPrice * 0.0008; // تقليل التقلب
      const newPrice = lastPrice + (Math.random() - 0.5) * volatility;
      const now = Date.now();
      
      const lastCandle = chartRef.current.data.datasets[0].data[chartRef.current.data.datasets[0].data.length - 1] as any;
      
      if (now - lastCandle.x < 60000) {
        lastCandle.h = Math.max(lastCandle.h, newPrice);
        lastCandle.l = Math.min(lastCandle.l, newPrice);
        lastCandle.c = newPrice;
      } else {
        chartRef.current.data.datasets[0].data.push({
          x: now,
          o: lastPrice,
          h: Math.max(lastPrice, newPrice),
          l: Math.min(lastPrice, newPrice),
          c: newPrice,
        });
        
        if (chartRef.current.data.datasets[0].data.length > 100) {
          chartRef.current.data.datasets[0].data.shift();
        }
      }
      
      chartRef.current.update('none');
      lastPrice = newPrice;
    }, 15000); // 15 ثانية

    return () => clearInterval(updateInterval);
  }, [currentPrice, symbol]);

  if (!chartData) {
    return (
      <div className="w-full h-[360px] rounded-lg bg-black border border-gray-800 flex items-center justify-center">
        <div className="text-gray-400">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-lg overflow-hidden bg-black border border-gray-800 p-4">
      <Chart
        ref={chartRef}
        type="candlestick"
        data={chartData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'minute',
                displayFormats: {
                  minute: 'HH:mm'
                }
              },
              grid: {
                color: '#1e293b',
                lineWidth: 1,
              },
              ticks: {
                color: '#64748b',
                font: {
                  size: 11,
                },
              },
              border: {
                color: '#334155',
              },
            },
            y: {
              position: 'right',
              grid: {
                color: '#1e293b',
                lineWidth: 1,
              },
              ticks: {
                color: '#64748b',
                font: {
                  size: 11,
                },
                callback: function(value) {
                  return '$' + Number(value).toFixed(2);
                },
              },
              border: {
                color: '#334155',
              },
            },
          },
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              enabled: true,
              mode: 'index',
              intersect: false,
              backgroundColor: '#1e293b',
              titleColor: '#f1f5f9',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 12,
              displayColors: false,
              callbacks: {
                title: function(context) {
                  return new Date(context[0].parsed.x as number).toLocaleString('ar-SA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                },
                label: function(context: any) {
                  const data = context.raw;
                  return [
                    `فتح: $${data.o.toFixed(2)}`,
                    `أعلى: $${data.h.toFixed(2)}`,
                    `أدنى: $${data.l.toFixed(2)}`,
                    `إغلاق: $${data.c.toFixed(2)}`,
                  ];
                },
              },
            },
          },
          interaction: {
            mode: 'index',
            intersect: false,
          },
        }}
        height={360}
      />
    </div>
  );
}
