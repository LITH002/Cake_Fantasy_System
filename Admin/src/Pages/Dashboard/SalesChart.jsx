import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register required Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SalesChart = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Revenue',
        data: data.map(item => item.revenue),
        borderColor: '#591b0d',
        backgroundColor: 'rgba(89, 27, 13, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Orders',
        data: data.map(item => item.orders),
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.0)',
        tension: 0.4,
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Revenue (LKR)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Orders'
        }
      },
    },
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default SalesChart;