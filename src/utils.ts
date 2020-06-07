import { DirectoryMetadata } from './types.ts'

export const isDirectory = (val: any) => !!val && typeof val === 'object'

export const isDirectoryMetadata= (val: any) =>
  isDirectory(val)
  && isDirectory((<DirectoryMetadata>val).files)
