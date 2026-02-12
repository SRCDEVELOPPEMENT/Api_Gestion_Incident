import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 📂 Dossier d’upload
const uploadDir = path.join(process.cwd(), 'uploads', 'incidents');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 📌 Extensions autorisées
const allowedExtensions = [
  // Images
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.bmp',
  '.svg',

  // PDF
  '.pdf',

  // Word
  '.doc',
  '.docx',

  // Excel
  '.xls',
  '.xlsx',
  '.csv',

  // PowerPoint
  '.ppt',
  '.pptx',

  // Texte
  '.txt',
  '.rtf',

  // Archives
  '.zip',
  '.rar',
  '.7z',

  // JSON / XML
  '.json',
  '.xml'
];

// 🔐 Filtrage par extension
const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Type de fichier non autorisé (${ext})`));
  }
};

// 📦 Configuration storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB max
  }
});
