import { Suspense } from 'react';
import TileCalculatorClient from '@/components/calculator/TileCalculatorClient';

export const metadata = {
  title: 'Tile Calculator | Meenakshi Build World',
  description: 'Calculate exactly how many tiles, boxes and the estimated cost you need for your floor, wall or multi-room project — supports every measurement unit.'
};

export default function CalculatorPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1200px] px-6 py-16 text-center text-slate-400">Loading calculator…</div>}>
      <TileCalculatorClient />
    </Suspense>
  );
}
