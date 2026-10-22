import { createRoot } from 'react-dom/client';
import '@fontsource/manrope/cyrillic-400.css';
import '@fontsource/manrope/latin-400.css';
import '@fontsource/cormorant-garamond/cyrillic-400.css';
import '@fontsource/cormorant-garamond/latin-400.css';
import { CubeScrollDemo } from '../src/components/cube-scroll/CubeScrollDemo';
declare global { interface Window { __CUBE_ASSETS__: { video: string; poster: string; cafe: string; clinic: string } } }
createRoot(document.getElementById('root')!).render(<CubeScrollDemo assets={window.__CUBE_ASSETS__}/>);
