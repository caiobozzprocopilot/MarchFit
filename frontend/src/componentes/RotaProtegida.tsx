import { Navigate } from 'react-router-dom';
import { useAuth } from '../contextos/autenticacao';
import { TipoPerfil } from '../tipos';
import { ReactNode } from 'react';

interface Props {
  perfil: TipoPerfil;
  children: ReactNode;
}

export default function RotaProtegida({ perfil, children }: Props) {
  const { estaAutenticado, perfil: perfilUsuario, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (perfilUsuario !== perfil) {
    return <Navigate to={perfilUsuario === 'NUTRICIONISTA' ? '/admin' : '/paciente'} replace />;
  }

  return <>{children}</>;
}
