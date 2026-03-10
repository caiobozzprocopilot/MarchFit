import multer from 'multer';

// Fotos são armazenadas em memória e depois convertidas para BLOB
const armazenamento = multer.memoryStorage();

export const uploadFoto = multer({
  storage: armazenamento,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas.'));
    }
  },
});

export const uploadCsv = multer({
  storage: armazenamento,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === 'text/csv' ||
      file.mimetype === 'application/vnd.ms-excel' ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos.'));
    }
  },
});
