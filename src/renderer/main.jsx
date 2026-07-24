/**
 * Entry point for React renderer.
 */

import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/app.css';
import './styles/editor.css';
import './styles/preview.css';

const root = createRoot(document.getElementById('root'));
root.render(<App />);
