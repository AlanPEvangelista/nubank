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
  Filler
} from 'chart.js'
import { format, parseISO } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function TaxChart({ data = [], appName = '', initialValue = 0, options: customOptions = {} }) {
  // Ordena os dados por data (ascendente)
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))

  const labels = sortedData.map(d => {
    try {
      const dateObj = typeof d.date === 'string' ? parseISO(d.date) : d.date
      return format(dateObj, 'dd/MM')
    } catch (e) {
      return d.date
    }
  })

  // Calcula o imposto (Bruto - Líquido)
  const taxValues = sortedData.map(d => {
    const gross = Number(d.gross)
    const net = Number(d.net)
    return gross - net
  })

  // Calcula valor líquido menos saldo inicial
  const netValues = sortedData.map(d => Number(d.net) - Number(initialValue))

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Impostos/Taxas (R$)',
        data: taxValues,
        borderColor: 'rgba(239, 68, 68, 1)', // Vermelho
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Rendimento Líquido (R$)',
        data: netValues,
        borderColor: 'rgba(34, 197, 94, 1)', // Verde
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
        fill: false,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: !!appName,
        text: `Impostos - ${appName}`,
        font: { size: 16 }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ''
            if (label) label = label.replace(' (R$)', '') + ': '
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y)
            }
            return label
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true,
        ticks: {
            callback: function(value) {
                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
            }
        }
      }
    },
    ...customOptions
  }

  return <Line data={chartData} options={options} />
}
