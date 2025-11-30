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

export default function YieldChart({ data = [], initialValue = 0, appName = '', options: customOptions = {} }) {
  // Ordena os dados por data (ascendente) para o gráfico de linha
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date))
  const startValue = Number(initialValue)

  const labels = sortedData.map(d => {
    // Formata a data para exibição (dd/MM)
    try {
        const dateObj = typeof d.date === 'string' ? parseISO(d.date) : d.date
        return format(dateObj, 'dd/MM')
    } catch (e) {
        return d.date
    }
  })

  const grossValues = sortedData.map(d => Number(d.gross) - startValue)
  const netValues = sortedData.map(d => Number(d.net) - startValue)
  const discountValues = sortedData.map(d => Number(d.gross) - Number(d.net))

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Rendimento Bruto (R$)',
        data: grossValues,
        borderColor: 'rgba(34, 197, 94, 1)', // Verde
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.3,
        fill: false,
      },
      {
        label: 'Rendimento Líquido (R$)',
        data: netValues,
        borderColor: 'rgba(59, 130, 246, 1)', // Azul
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.3,
        fill: true,
      },
      {
        label: 'Descontos (Impostos/Taxas)',
        data: discountValues,
        borderColor: 'rgba(239, 68, 68, 1)', // Vermelho
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: false,
        borderDash: [5, 5],
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { 
        display: !!appName,
        text: `Evolução - ${appName}`,
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
          },
          afterBody: (context) => {
             return `Valor Inicial (deduzido): ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(startValue)}`
          }
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: false,
        ticks: {
            callback: function(value) {
                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
            }
        }
      },
    },
    ...customOptions
  }

  return <Line data={chartData} options={options} />
}
