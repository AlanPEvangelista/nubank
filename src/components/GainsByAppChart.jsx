import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

export default function GainsByAppChart({ data = [], applications = [] }) {
  const labels = data.map(d => d.name)
  const values = data.map(d => Number(d.net_sum))
  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ganhos líquidos (R$)',
        data: values,
        backgroundColor: 'rgba(37, 99, 235, 0.7)',
        borderColor: 'rgba(30, 58, 138, 1)',
        borderWidth: 1,
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
  return <Bar data={chartData} options={options} />
}