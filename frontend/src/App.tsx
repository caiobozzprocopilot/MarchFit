import { Routes, Route, Navigate } from 'react-router-dom';
import { ProvedorAutenticacao } from './contextos/autenticacao';
import RotaProtegida from './componentes/RotaProtegida';
import PaginaLogin from './paginas/Login';

// Admin (Nutricionista)
import LayoutAdmin from './componentes/layouts/LayoutAdmin';
import Dashboard from './paginas/admin/Dashboard';
import Alunos from './paginas/admin/Alunos';
import PerfilAluno from './paginas/admin/PerfilAluno';
import Alimentos from './paginas/admin/Alimentos';
import Exercicios from './paginas/admin/Exercicios';
import Receitas from './paginas/admin/Receitas';
import Consultas from './paginas/admin/Consultas';
import Formulas from './paginas/admin/Formulas';
import ConfigAdmin from './paginas/admin/Config';

// Aluno
import LayoutAluno from './componentes/layouts/LayoutAluno';
import DashboardAluno from './paginas/aluno/Dashboard';
import MeuPlanoAlimentar from './paginas/aluno/MeuPlanoAlimentar';
import MeusTreinos from './paginas/aluno/MeusTreinos';
import MinhasReceitas from './paginas/aluno/MinhasReceitas';
import MeuProgresso from './paginas/aluno/MeuProgresso';
import MinhasConsultas from './paginas/aluno/MinhasConsultas';

export default function App() {
  return (
    <ProvedorAutenticacao>
      <Routes>
        {/* Rota pública */}
        <Route path="/login" element={<PaginaLogin />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rotas do Nutricionista (Admin) */}
        <Route
          path="/admin"
          element={
            <RotaProtegida perfil="NUTRICIONISTA">
              <LayoutAdmin />
            </RotaProtegida>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="pacientes" element={<Alunos />} />
          <Route path="pacientes/:id" element={<PerfilAluno />} />
          <Route path="alimentos" element={<Alimentos />} />
          <Route path="exercicios" element={<Exercicios />} />
          <Route path="receitas" element={<Receitas />} />
          <Route path="consultas" element={<Consultas />} />
          <Route path="formulas" element={<Formulas />} />
          <Route path="config" element={<ConfigAdmin />} />
        </Route>

        {/* Rotas do Aluno */}
        <Route
          path="/paciente"
          element={
            <RotaProtegida perfil="PACIENTE">
              <LayoutAluno />
            </RotaProtegida>
          }
        >
          <Route index element={<DashboardAluno />} />
          <Route path="dieta" element={<MeuPlanoAlimentar />} />
          <Route path="treinos" element={<MeusTreinos />} />
          <Route path="receitas" element={<MinhasReceitas />} />
          <Route path="progresso" element={<MeuProgresso />} />
          <Route path="consultas" element={<MinhasConsultas />} />
        </Route>

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ProvedorAutenticacao>
  );
}
