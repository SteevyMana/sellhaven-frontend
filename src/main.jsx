import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
//Importamos el archivo global.css para que los estilos se apliquen en toda la aplicación
import './styles/global.css'
import App from './App.jsx'
//Vamos a importar bootstrap para activar los estilos de bootstrap en toda la aplicación
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
