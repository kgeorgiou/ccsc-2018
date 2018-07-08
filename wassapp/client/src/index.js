import React from 'react';
import ReactDOM from 'react-dom';
import App from './components/App';
import IncompatibleBrowser from './components/IncompatibleBrowser';
import { detect } from 'detect-browser';

let componentToRender = <App />

const browser = detect();
if (browser && (/firefox/i).test(browser.name)) {
    componentToRender = <IncompatibleBrowser browserName="Firefox" />
}

ReactDOM.render(componentToRender, document.getElementById('root'));



