export declare type FileData = NonNullable<ConstructorParameters<typeof Blob>[0]>[0];
export interface UnpackedFiles {
    [key: string]: UnpackedFiles | FileData;
}
export declare type UnpackedDirectory = {
    files: {
        [property: string]: FileData | UnpackedDirectory;
    };
};
export interface FileMetadata {
    offset?: string;
    size?: number;
}
export declare type DirectoryMetadata = {
    files: {
        [property: string]: FileMetadata | DirectoryMetadata;
    };
};
export declare type Metadata = DirectoryMetadata | FileMetadata;
