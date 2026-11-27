import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/app';
import './styles.css';

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(
    <StrictMode>
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
        <App />
      </div>
    </StrictMode>
  );
}
