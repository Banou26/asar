import type { DirectoryMetadata } from './types'

export const isDirectory = (val: any) => !!val && typeof val === 'object'

export const isDirectoryMetadata= (val: any) =>
  isDirectory(val)
  && isDirectory((<DirectoryMetadata>val).files)
