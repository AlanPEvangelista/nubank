import React from 'react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function TotalGainsChart({ data = [] }) {
  const labels = data.map(d => d.d)
  const values = data.map(d => Number(d.net_sum))
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ganhos totais por dia (R$)',
        data: values,
        borderColor: 'rgba(220, 38, 38, 1)',
        backgroundColor: 'rgba(220, 38, 38, 0.2)',
        tension: 0.25,
        fill: true,
      },
    ],
  }
  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: false },
    },
    scales: {
      y: { beginAtZero: true },
    },
  }
  return <Line data={chartData} options={options} />
}