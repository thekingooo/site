import type { Metadata } from 'next';
import { CubeScrollDemo } from '@/components/cube-scroll/CubeScrollDemo';
export const metadata: Metadata = {
  title: { absolute: 'ПРОСТРАНСТВО — пространство для вашего бизнеса' },
  description: 'Пример главной страницы с вращением архитектурного куба по прокрутке.',
  robots: { index: false, follow: false },
  openGraph: { title: 'ПРОСТРАНСТВО — архитектура в движении', description: 'Интерактивный пример главной страницы.', images: ['/images/cube-scroll/poster.jpg'] },
};
export default function Page(){return <CubeScrollDemo/>;}
