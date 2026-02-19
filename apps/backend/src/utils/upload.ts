import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@reporthub/shared';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Ensure upload directories exist
['submissions', 'meetings'].forEach((dir) => {
  const fullPath = path.resolve(UPLOAD_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(UPLOAD_DIR, 'submissions'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const meetingStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.resolve(UPLOAD_DIR, 'meetings'));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`));
  }
};

export const uploadSubmission = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploadMeeting = multer({
  storage: meetingStorage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});
