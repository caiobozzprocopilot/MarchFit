import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UsuarioAutenticado, TipoPerfil } from '../tipos';

interface ContextoAutenticacao {
  usuario: UsuarioAutenticado | null;
  token: string | null;
  perfil: TipoPerfil | null;
  estaAutenticado: boolean;
  carregando: boolean;
  login: (token: string, usuario: UsuarioAutenticado) => void;
  logout: () => void;
  eNutricionista: boolean;
  eAluno: boolean;
}

const ContextoAuth = createContext<ContextoAutenticacao | null>(null);

export function ProvedorAutenticacao({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const tkn = await firebaseUser.getIdToken();
          const nutriSnap = await getDocs(query(collection(db, 'nutricionistas'), where('email', '==', firebaseUser.email)));
          if (!nutriSnap.empty) {
            const d = nutriSnap.docs[0].data() as any;
            setUsuario({ id: nutriSnap.docs[0].id, nome: d.nome, email: d.email, perfil: 'NUTRICIONISTA', crn: d.crn });
            setToken(tkn);
          } else {
            const normalizedEmail = (firebaseUser.email || '').toLowerCase().trim();
            const alunoSnap = await getDocs(query(collection(db, 'alunos'), where('email', '==', normalizedEmail)));
            if (!alunoSnap.empty) {
              const d = alunoSnap.docs[0].data() as any;
              setUsuario({ id: alunoSnap.docs[0].id, nome: d.nome, email: d.email, perfil: 'PACIENTE', nutricionistaId: d.nutricionistaId, pendente: d.pendente ?? false });
              setToken(tkn);
            } else {
              const isGoogleSignIn = firebaseUser.providerData.some((p) => p.providerId === 'google.com');
              if (isGoogleSignIn) {
                const novoAluno = {
                  nome: firebaseUser.displayName || normalizedEmail.split('@')[0] || 'Usuário',
                  email: normalizedEmail,
                  fotoPerfil: firebaseUser.photoURL || null,
                  ativo: false,
                  pendente: true,
                  nutricionistaId: '',
                  origem: 'google',
                  criadoEm: new Date().toISOString(),
                };
                await setDoc(doc(db, 'alunos', firebaseUser.uid), novoAluno);
                setUsuario({ id: firebaseUser.uid, nome: novoAluno.nome, email: novoAluno.email, perfil: 'PACIENTE', nutricionistaId: '', pendente: true });
                setToken(tkn);
              } else {
                setUsuario(null); setToken(null);
              }
            }
          }
        } catch (err: any) {
          setUsuario(null); setToken(null);
        }
      } else {
        setUsuario(null);
        setToken(null);
      }
      setCarregando(false);
    });
    return unsub;
  }, []);

  const login = (novoToken: string, novoUsuario: UsuarioAutenticado) => {
    setToken(novoToken);
    setUsuario(novoUsuario);
  };

  const logout = async () => {
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    setToken(null);
    setUsuario(null);
  };

  return (
    <ContextoAuth.Provider value={{
      usuario,
      token,
      perfil: usuario?.perfil ?? null,
      estaAutenticado: !!token && !!usuario,
      carregando,
      login,
      logout,
      eNutricionista: usuario?.perfil === 'NUTRICIONISTA',
      eAluno: usuario?.perfil === 'PACIENTE',
    }}>
      {children}
    </ContextoAuth.Provider>
  );
}

export function useAuth(): ContextoAutenticacao {
  const ctx = useContext(ContextoAuth);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de ProvedorAutenticacao');
  return ctx;
}
