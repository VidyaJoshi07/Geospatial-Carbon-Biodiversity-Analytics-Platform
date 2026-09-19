import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { AnalyticsRecord } from '../../types';
import { formatDate } from '../../utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export interface AnalyticsChartProps {
  records: AnalyticsRecord[];
  type: 'carbon' | 'biodiversity' | 'ndvi' | 'performance' | 'area_change';
  title: string;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ records, type, title }) => {
  const labels = records.map((r) => formatDate(r.recorded_date));

  // Determine datasets based on type
  let chartData: any;
  let isBar = false;

  if (type === 'carbon') {
    chartData = {
      labels,
      datasets: [
        {
          label: 'Carbon Sequestration (tCO₂e)',
          data: records.map((r) => r.carbon_value),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10b981',
        },
      ],
    };
  } else if (type === 'biodiversity') {
    chartData = {
      labels,
      datasets: [
        {
          label: 'Biodiversity Health Index (0-100)',
          data: records.map((r) => r.biodiversity_value),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#06b6d4',
        },
      ],
    };
  } else if (type === 'ndvi') {
    chartData = {
      labels,
      datasets: [
        {
          label: 'Vegetation Index (NDVI)',
          data: records.map((r) => r.vegetation_index),
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#34d399',
        },
      ],
    };
  } else if (type === 'area_change') {
    isBar = true;
    chartData = {
      labels,
      datasets: [
        {
          label: 'Net Canopy Delta (%)',
          data: records.map((r) => r.area_change),
          backgroundColor: records.map((r) =>
            r.area_change >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(244, 63, 94, 0.6)'
          ),
          borderColor: records.map((r) => (r.area_change >= 0 ? '#10b981' : '#f43f5e')),
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    };
  } else {
    chartData = {
      labels,
      datasets: [
        {
          label: 'Composite Performance Score',
          data: records.map((r) => r.performance_score),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#f59e0b',
        },
      ],
    };
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#0f1714',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#1f352b',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#64748b',
          font: { family: 'Inter', size: 11 },
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#64748b',
          font: { family: 'Inter', size: 11 },
        },
        ...(type === 'ndvi' ? { min: 0, max: 1.0 } : {}),
      },
    },
  };

  return (
    <div className="bg-[#0f1714] border border-[#1f352b] rounded-2xl p-5 shadow-xl">
      <h4 className="text-sm font-semibold text-white mb-4">{title}</h4>
      <div className="h-64 sm:h-72 w-full">
        {isBar ? <Bar data={chartData} options={options} /> : <Line data={chartData} options={options} />}
      </div>
    </div>
  );
};
