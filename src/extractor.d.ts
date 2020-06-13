/// <reference types="node" />
import type { FileData, DirectoryMetadata } from './types';
export declare const extractFile: (archive: FileData, pathname: string) => Promise<Buffer>;
interface listPackageReturn {
    [key: string]: string | listPackageReturn;
}
export declare const listPackage: (archive: FileData | DirectoryMetadata, { isHeader, flat }?: {
    isHeader?: boolean;
    flat?: boolean;
}) => Promise<string[] | listPackageReturn>;
interface extractPackageReturn {
    [key: string]: FileData | extractPackageReturn;
}
export declare const extractAll: (archive: FileData, { flat }?: {
    flat?: boolean;
}) => Promise<extractPackageReturn | {
    [key: string]: BlobPart;
}>;
export {};
