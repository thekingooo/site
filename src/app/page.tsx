import type { Metadata } from 'next';
import { CubeScrollDemo } from '@/components/cube-scroll/CubeScrollDemo';
export const metadata: Metadata = {
  title: { absolute: 'FP Group — пространства для вашего бизнеса' },
  description: 'Проектирование, строительство, инженерия и комплектация коммерческих пространств под ключ.',
  robots: { index: false, follow: false },
  openGraph: { title: 'FP Group — создаём пространства, которые работают', description: 'Интерактивный пример главной страницы.', images: ['/images/spaces/cafe.jpg'] },
};
export default function Page(){return <CubeScrollDemo/>;}
