/**
 * Entry point for the React renderer.
 */

import { createRoot } from 'react-dom/client';
import App from './App.jsx';

import './styles/theme.css';
import './styles/app.css';
import './styles/toolbar.css';
import './styles/menu.css';
import './styles/editor.css';
import './styles/preview.css';

createRoot(document.getElementById('root')).render(<App />);
