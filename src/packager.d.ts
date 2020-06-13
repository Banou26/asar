import type { UnpackedFiles } from './types';
import { Buffer } from 'buffer';
export declare const createPackage: (files: UnpackedFiles, { flat }?: {
    flat?: boolean;
}) => Promise<Buffer>;
