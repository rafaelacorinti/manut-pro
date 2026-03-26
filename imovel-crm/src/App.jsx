import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CRMProvider } from './context';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Pipeline from './pages/Pipeline';
import Contatos from './pages/Contatos';
import Imoveis from './pages/Imoveis';
import Followups from './pages/Followups';
import Relatorios from './pages/Relatorios';

export default function App() {
  return (
    <CRMProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/contatos" element={<Contatos />} />
            <Route path="/imoveis" element={<Imoveis />} />
            <Route path="/followups" element={<Followups />} />
            <Route path="/relatorios" element={<Relatorios />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </CRMProvider>
  );
}
