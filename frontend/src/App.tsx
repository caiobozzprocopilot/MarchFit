import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProvedorAutenticacao } from './contextos/autenticacao';
import RotaProtegida from './componentes/RotaProtegida';
import PaginaLogin from './paginas/Login';

// Admin (Nutricionista) — carregado sob demanda
const LayoutAdmin      = lazy(() => import('./componentes/layouts/LayoutAdmin'));
const Dashboard        = lazy(() => import('./paginas/admin/Dashboard'));
const Alunos           = lazy(() => import('./paginas/admin/Alunos'));
const PerfilAluno      = lazy(() => import('./paginas/admin/PerfilAluno'));
const Alimentos        = lazy(() => import('./paginas/admin/Alimentos'));
const Exercicios       = lazy(() => import('./paginas/admin/Exercicios'));
const Receitas         = lazy(() => import('./paginas/admin/Receitas'));
const Consultas        = lazy(() => import('./paginas/admin/Consultas'));
const Formulas         = lazy(() => import('./paginas/admin/Formulas'));
const ConfigAdmin      = lazy(() => import('./paginas/admin/Config'));

// Aluno — carregado sob demanda
const LayoutAluno        = lazy(() => import('./componentes/layouts/LayoutAluno'));
const DashboardAluno     = lazy(() => import('./paginas/aluno/Dashboard'));
const MeuPlanoAlimentar  = lazy(() => import('./paginas/aluno/MeuPlanoAlimentar'));
const MeusTreinos        = lazy(() => import('./paginas/aluno/MeusTreinos'));
const MinhasReceitas     = lazy(() => import('./paginas/aluno/MinhasReceitas'));
const MeuProgresso       = lazy(() => import('./paginas/aluno/MeuProgresso'));
const MinhasConsultas    = lazy(() => import('./paginas/aluno/MinhasConsultas'));

function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

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
              <Suspense fallback={<PageSpinner />}>
                <LayoutAdmin />
              </Suspense>
            </RotaProtegida>
          }
        >
          <Route index element={<Suspense fallback={<PageSpinner />}><Dashboard /></Suspense>} />
          <Route path="pacientes" element={<Suspense fallback={<PageSpinner />}><Alunos /></Suspense>} />
          <Route path="pacientes/:id" element={<Suspense fallback={<PageSpinner />}><PerfilAluno /></Suspense>} />
          <Route path="alimentos" element={<Suspense fallback={<PageSpinner />}><Alimentos /></Suspense>} />
          <Route path="exercicios" element={<Suspense fallback={<PageSpinner />}><Exercicios /></Suspense>} />
          <Route path="receitas" element={<Suspense fallback={<PageSpinner />}><Receitas /></Suspense>} />
          <Route path="consultas" element={<Suspense fallback={<PageSpinner />}><Consultas /></Suspense>} />
          <Route path="formulas" element={<Suspense fallback={<PageSpinner />}><Formulas /></Suspense>} />
          <Route path="config" element={<Suspense fallback={<PageSpinner />}><ConfigAdmin /></Suspense>} />
        </Route>

        {/* Rotas do Aluno */}
        <Route
          path="/paciente"
          element={
            <RotaProtegida perfil="PACIENTE">
              <Suspense fallback={<PageSpinner />}>
                <LayoutAluno />
              </Suspense>
            </RotaProtegida>
          }
        >
          <Route index element={<Suspense fallback={<PageSpinner />}><DashboardAluno /></Suspense>} />
          <Route path="dieta" element={<Suspense fallback={<PageSpinner />}><MeuPlanoAlimentar /></Suspense>} />
          <Route path="treinos" element={<Suspense fallback={<PageSpinner />}><MeusTreinos /></Suspense>} />
          <Route path="receitas" element={<Suspense fallback={<PageSpinner />}><MinhasReceitas /></Suspense>} />
          <Route path="progresso" element={<Suspense fallback={<PageSpinner />}><MeuProgresso /></Suspense>} />
          <Route path="consultas" element={<Suspense fallback={<PageSpinner />}><MinhasConsultas /></Suspense>} />
        </Route>

        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ProvedorAutenticacao>
  );
}
