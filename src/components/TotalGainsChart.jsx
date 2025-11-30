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
  Filler // <--- ADICIONEI AQUI
} from 'chart.js'

// ADICIONEI O 'Filler' AQUI TAMBÉM V
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function TotalGainsChart({ data = [], initialValue = 0, options: customOptions = {} }) {
  const labels = data.map(d => d.d)
  const values = data.map(d => Number(d.net_sum) - Number(initialValue))
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
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ''
            if (label) label += ': '
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y)
            }
            return label
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true },
    },
    ...customOptions
  }
  return <Line data={chartData} options={options} />
}
