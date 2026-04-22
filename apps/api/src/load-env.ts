import path from 'path';
import dotenv from 'dotenv';

// Must be imported before any module that reads process.env (e.g. @vector/config, firebase-admin).
const apiRoot = process.cwd();
dotenv.config({ path: path.join(apiRoot, '.env') });
dotenv.config({ path: path.join(apiRoot, '.env.local'), override: true });
