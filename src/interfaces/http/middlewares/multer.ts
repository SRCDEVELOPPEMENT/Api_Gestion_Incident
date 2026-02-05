// import multer from 'multer';
// import path from 'path';

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, 'uploads/tasks'); // dossier de stockage
//   },
//   filename: (_req, file, cb) => {
//     const uniqueName =
//       Date.now() + '-' + Math.round(Math.random() * 1e9);
//     cb(null, `${uniqueName}${path.extname(file.originalname)}`);
//   }
// });

// export const upload = multer({ storage });

import multer from 'multer';
import fs from 'fs';
import path from 'path';

const uploadDir = path.join(process.cwd(), 'uploads', 'tasks');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  }
});

export const upload = multer({ storage });
