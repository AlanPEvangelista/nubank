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

export default function GainsByAppChart({ data = [], applications = [], options: customOptions = {} }) {
  const labels = data.map(d => d.name)
  const values = data.map(d => Number(d.net_sum))
  const total = values.reduce((acc, val) => acc + val, 0)
  const formattedTotal = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const chartData = {
    labels,
    datasets: [
      {
        label: `Valor líquido Total: ${formattedTotal}`,
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
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ''
            // Remove o valor total do label do dataset para o tooltip ficar limpo
            if (label.includes('Total:')) label = 'Valor líquido'
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
  return <Bar data={chartData} options={options} />
}