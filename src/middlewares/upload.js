require('dotenv').config();
const fs = require('fs');
const multer = require('multer');
const path = require('path');

const PUBLIC_ROUTE = '/uploads';
const SEED_UPLOAD_SUBDIR = '';

const defaultUploadRoot = path.resolve(__dirname, '../../uploads');
const configuredUploadRoot = process.env.UPLOAD_PATH
  ? path.resolve(process.env.UPLOAD_PATH)
  : defaultUploadRoot;

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024);

function ensureUploadDir(subDir = '') {
  const targetDir = path.join(configuredUploadRoot, subDir);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

function resolveUploadPath(...segments) {
  return path.join(configuredUploadRoot, ...segments);
}

function getUploadRoot() {
  return ensureUploadDir();
}

function getPublicUrl(fileName, subDir = '') {
  if (!fileName) return null;
  const parts = [PUBLIC_ROUTE, subDir, fileName].filter(Boolean);
  return path.posix.join(...parts).replace(/\\/g, '/');
}

function sanitizeFieldName(fieldName) {
  const cleaned = String(fieldName || 'file').replace(/[^a-z0-9_-]/gi, '');
  return cleaned || 'file';
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    try {
      const subDir = (req && req.uploadSubDir) || '';
      const targetDir = ensureUploadDir(subDir);
      cb(null, targetDir);
    } catch (error) {
      cb(error);
    }
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname) || '';
    const baseName = sanitizeFieldName(file.fieldname);
    cb(null, `${baseName}-${uniqueSuffix}${extension}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: Number.isFinite(MAX_FILE_SIZE) ? MAX_FILE_SIZE : 5 * 1024 * 1024,
    files: 5
  },
  fileFilter
});

ensureUploadDir();

module.exports = {
  single: upload.single('image'),
  multiple: upload.array('images', 5),
  fields: upload.fields([
    { name: 'productImage', maxCount: 1 },
    { name: 'gallery', maxCount: 4 }
  ]),
  upload,
  ensureUploadDir,
  resolveUploadPath,
  getUploadRoot,
  getPublicUrl,
  PUBLIC_ROUTE,
  SEED_UPLOAD_SUBDIR
};