import { Request, Response, NextFunction } from 'express';
import { parse } from 'csv-parse/sync';
import { db } from '../banco/firebase';
import { ErroApp } from '../middlewares/erros';

export async function listarAlimentos(req: Request, res: Response, next: NextFunction) {
  try {
    const { busca, categoria, personalizado } = req.query;
    const snap = await db.collection('alimentos').get();
    let alimentos = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    if (categoria) alimentos = alimentos.filter((a) => a.categoria === String(categoria as string));
    if (personalizado !== undefined) alimentos = alimentos.filter((a) => a.personalizado === (personalizado === 'true'));
    if (busca) {
      const b = String(busca as string).toLowerCase();
      alimentos = alimentos.filter((a) => a.nome?.toLowerCase().includes(b) || a.nomePopular?.toLowerCase().includes(b));
    }
    alimentos.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    res.json(alimentos);
  } catch (err) {
    next(err);
  }
}

export async function downloadTemplateCsv(_req: Request, res: Response, next: NextFunction) {
  try {
    const csv = 'nome,nomePopular,calorias,proteinas,carboidratos,gorduras,fibras,sodio,categoria\nFrango Grelhado,Peito de Frango,165,31,0,3.6,0,,Carnes\n';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=template_alimentos.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function buscarAlimento(req: Request, res: Response, next: NextFunction) {
  try {
    const doc = await db.collection('alimentos').doc(String(req.params.id)).get();
    if (!doc.exists) throw new ErroApp('Alimento não encontrado.', 404);
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    next(err);
  }
}

export async function criarAlimento(req: Request, res: Response, next: NextFunction) {
  try {
    const { nome, nomePopular, caloriasP100g, proteinasP100g, carboidratosP100g, gordurasP100g, fibrasP100g, sodioP100g, unidadePadrao, pesoUnidade, categoria } = req.body;
    if (!nome || caloriasP100g === undefined) throw new ErroApp('Nome e calorias são obrigatórios.', 400);

    const ref = await db.collection('alimentos').add({
      nome, nomePopular: nomePopular || null,
      caloriasP100g: parseFloat(caloriasP100g),
      proteinasP100g: parseFloat(proteinasP100g || 0),
      carboidratosP100g: parseFloat(carboidratosP100g || 0),
      gordurasP100g: parseFloat(gordurasP100g || 0),
      fibrasP100g: fibrasP100g ? parseFloat(fibrasP100g) : null,
      sodioP100g: sodioP100g ? parseFloat(sodioP100g) : null,
      unidadePadrao: unidadePadrao || 'GRAMAS',
      pesoUnidade: pesoUnidade ? parseFloat(pesoUnidade) : null,
      categoria: categoria || null,
      personalizado: true,
    });

    res.status(201).json({ mensagem: 'Alimento criado com sucesso.', id: ref.id });
  } catch (err) {
    next(err);
  }
}

export async function atualizarAlimento(req: Request, res: Response, next: NextFunction) {
  try {
    const id = String(req.params.id);
    const update: any = {};
    const strFields = ['nome', 'nomePopular', 'unidadePadrao', 'categoria'];
    const numFields = ['caloriasP100g', 'proteinasP100g', 'carboidratosP100g', 'gordurasP100g', 'fibrasP100g', 'sodioP100g', 'pesoUnidade'];
    for (const f of strFields) { if (req.body[f] !== undefined) update[f] = req.body[f]; }
    for (const f of numFields) { if (req.body[f] !== undefined) update[f] = parseFloat(req.body[f]); }
    await db.collection('alimentos').doc(id).update(update);
    res.json({ mensagem: 'Alimento atualizado com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function deletarAlimento(req: Request, res: Response, next: NextFunction) {
  try {
    await db.collection('alimentos').doc(String(req.params.id)).delete();
    res.json({ mensagem: 'Alimento removido com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function importarCsv(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new ErroApp('Arquivo CSV não enviado.', 400);
    const conteudo = req.file.buffer.toString('utf-8');
    const linhas = parse(conteudo, { columns: true, skip_empty_lines: true, trim: true }) as Record<string, string>[];

    const sucessos: string[] = [];
    const erros: { linha: number; erro: string }[] = [];

    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      try {
        const nome = linha['nome'] || linha['Nome'] || linha['NOME'];
        const calorias = parseFloat(linha['calorias'] || linha['Calorias'] || linha['kcal'] || '0');
        if (!nome) throw new Error('Campo "nome" ausente.');
        if (isNaN(calorias)) throw new Error('Campo "calorias" inválido.');

        await db.collection('alimentos').add({
          nome,
          nomePopular: linha['nome_popular'] || null,
          caloriasP100g: calorias,
          proteinasP100g: parseFloat(linha['proteinas'] || '0'),
          carboidratosP100g: parseFloat(linha['carboidratos'] || '0'),
          gordurasP100g: parseFloat(linha['gorduras'] || '0'),
          fibrasP100g: linha['fibras'] ? parseFloat(linha['fibras']) : null,
          sodioP100g: linha['sodio'] ? parseFloat(linha['sodio']) : null,
          categoria: linha['categoria'] || null,
          personalizado: false,
        });
        sucessos.push(nome);
      } catch (e: any) {
        erros.push({ linha: i + 2, erro: e.message });
      }
    }

    res.json({ mensagem: `${sucessos.length} alimentos importados.`, sucessos, erros });
  } catch (err) {
    next(err);
  }
}
