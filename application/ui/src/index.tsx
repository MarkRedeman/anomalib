import ReactDOM from 'react-dom/client';

import { Providers } from './providers';

import './index.css';

const rootEl = document.getElementById('root');
if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(<Providers />);
}
