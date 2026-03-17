import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contextos/autenticacao';
import {
  LayoutDashboard,
  Users,
  Apple,
  Dumbbell,
  ChefHat,
  Calendar,
  FlaskConical,
  Settings,
  LogOut,
  Menu,
} from 'lucide-react';
import LogoMarchFit from '../LogoMarchFit';
import { useState } from 'react';
import ChatAdmin from '../ChatAdmin';

const itensMenu = [
  { para: '/admin',           icone: LayoutDashboard, rotulo: 'Dashboard',    exato: true },
  { para: '/admin/pacientes', icone: Users,           rotulo: 'Pacientes'                    },
  { para: '/admin/alimentos', icone: Apple,           rotulo: 'Alimentos'                 },
  { para: '/admin/exercicios',icone: Dumbbell,        rotulo: 'Exercícios'                },
  { para: '/admin/receitas',  icone: ChefHat,         rotulo: 'Receitas'                  },
  { para: '/admin/consultas', icone: Calendar,        rotulo: 'Agenda'                    },
  { para: '/admin/formulas',  icone: FlaskConical,    rotulo: 'Fórmulas'                  },
  { para: '/admin/config',    icone: Settings,        rotulo: 'Configurações'             },
];

export default function LayoutAdmin() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Overlay mobile */}
      {menuAberto && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setMenuAberto(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-gray-900 border-r border-gray-800 flex flex-col
        transform transition-transform duration-300
        ${menuAberto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex flex-col items-center px-5 pt-6 pb-4">
          <LogoMarchFit className="w-40 h-auto" />
        </div>

        {/* Perfil */}
        <div className="mx-3 mb-4 px-3 py-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">{usuario?.nome?.[0] ?? 'N'}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-emerald-400 font-display uppercase tracking-wider">Nutricionista</p>
              <p className="text-sm font-display tracking-wide text-white truncate">{usuario?.nome}</p>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {itensMenu.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              end={item.exato}
              onClick={() => setMenuAberto(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl font-display uppercase tracking-wider text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'text-gray-500 hover:text-gray-200 hover:bg-gray-800'
                }`
              }
            >
              <item.icone className="w-4 h-4 flex-shrink-0" />
              {item.rotulo}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl font-display uppercase tracking-wider text-sm text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair da conta
          </button>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <button onClick={() => setMenuAberto(true)} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-black text-white">MarchFit</span>
          <div className="w-9" />
        </header>

        {/* Área de conteúdo com scroll */}
        <main className="flex-1 overflow-y-auto bg-gray-950 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Chat flutuante com pacientes */}
      <ChatAdmin />
    </div>
  );
}
