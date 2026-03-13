import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contextos/autenticacao';
import LogoMarchFit from '../LogoMarchFit';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Dumbbell,
  ChefHat,
  TrendingUp,
  Calendar,
  LogOut,
  MessageCircle,
} from 'lucide-react';

const itensMenu = [
  { para: '/paciente',            icone: LayoutDashboard,  rotulo: 'Início',        exato: true },
  { para: '/paciente/dieta',      icone: UtensilsCrossed,  rotulo: 'Dieta'                      },
  { para: '/paciente/treinos',    icone: Dumbbell,         rotulo: 'Treinos'                    },
  { para: '/paciente/receitas',   icone: ChefHat,          rotulo: 'Receitas'                   },
  { para: '/paciente/progresso',  icone: TrendingUp,       rotulo: 'Progresso'                  },
  { para: '/paciente/consultas',  icone: Calendar,         rotulo: 'Consultas'                  },
];

export default function LayoutAluno() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const WHATSAPP_NUTRICIONISTA = '+5511999999999';
  const mensagemWhats = encodeURIComponent('Olá! Sou seu paciente no MarchFit e gostaria de tirar uma dúvida.');

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <LogoMarchFit className="w-8 h-8" />
            <div>
              <span className="text-xs text-gray-500">Bem-vindo,</span>
              <p className="font-display tracking-wide text-white text-sm leading-tight">{usuario?.nome?.split(' ')[0]}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-2xl mx-auto p-4">
          <Outlet />
        </div>
      </main>

      {/* Botão flutuante WhatsApp */}
      <a
        href={`https://wa.me/${WHATSAPP_NUTRICIONISTA}?text=${mensagemWhats}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-24 right-4 z-20 w-13 h-13 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all hover:scale-110"
        title="Falar com Nutricionista"
      >
        <MessageCircle className="w-5 h-5 text-white" />
      </a>

      {/* Navegação inferior */}
      <nav className="fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 z-10 safe-area-pb">
        <div className="flex items-center justify-around max-w-2xl mx-auto px-1 py-1">
          {itensMenu.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              end={item.exato}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-0 transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-400'
                    : 'text-gray-600 hover:text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-lg transition-all ${
                    isActive ? 'bg-emerald-500/15' : ''
                  }`}>
                    <item.icone className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <span className="text-[9px] font-display truncate uppercase tracking-wide">{item.rotulo}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
