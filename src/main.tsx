import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import '@fontsource/oswald/cyrillic-400.css';
import '@fontsource/oswald/cyrillic-500.css';
import '@fontsource/oswald/cyrillic-600.css';
import '@fontsource/oswald/latin-400.css';
import '@fontsource/oswald/latin-500.css';
import '@fontsource/oswald/latin-600.css';
import '@fontsource/roboto-mono/cyrillic-400.css';
import '@fontsource/roboto-mono/latin-400.css';
import './index.css';
import './mobile.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
