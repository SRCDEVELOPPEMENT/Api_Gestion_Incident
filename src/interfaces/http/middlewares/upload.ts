import multer from 'multer';
import path from 'path';

// Stockage disque (simple et sûr)
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads/incidents'));
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// Filtrage basique des fichiers
const fileFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  const allowedMimeTypes = [
    'image/png',
    'image/jpeg',
    'application/pdf'
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Type de fichier non autorisé'));
  }

  cb(null, true);
};

export const uploadIncidentFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 MB
  }
}).array('attachments', 10);
