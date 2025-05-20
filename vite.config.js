import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';
const keyPath = path.resolve(__dirname, 'private.key');

const httpsConfig = isDev && fs.existsSync(keyPath)
  ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem')),
    }
  : false;

export default {
  server: {
    https: httpsConfig,
  },
};