import { resolve } from 'node:path';
export const local=resolve(process.env.GOVTECH_DATA_DIR||resolve(process.cwd(),'.data'));
