'use client';

import { Bar } from 'react-chartjs-2';
import { Transaction } from '@/types';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TransactionChartProps {
  transactions: Transaction[];
}

export function TransactionChart({ transactions }: TransactionChartProps) {
  const data = {
    labels: transactions.map(t => new Date(t.created_at).toLocaleDateString()),
    datasets: [
      {
        label: 'Transaction Amount',
        data: transactions.map(t => t.amount),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  return (
    <Bar
      data={data}
      options={{
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Transaction History' },
        },
      }}
    />
  );
}