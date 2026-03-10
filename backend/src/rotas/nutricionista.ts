import { Router } from 'express';
import { autenticar, apenasNutricionista } from '../middlewares/autenticacao';
import { uploadFoto } from '../utils/upload';
import {
  perfilNutricionista,
  atualizarNutricionista,
  fotoPerfilNutricionista,
  dashboardAdmin,
} from '../controladores/nutricionista';

export const rotasNutricionista = Router();

rotasNutricionista.use(autenticar, apenasNutricionista);

rotasNutricionista.get('/perfil',     perfilNutricionista);
rotasNutricionista.get('/dashboard',  dashboardAdmin);
rotasNutricionista.put('/perfil',     atualizarNutricionista);
rotasNutricionista.put('/foto',       uploadFoto.single('foto'), fotoPerfilNutricionista);
