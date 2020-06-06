import { Buffer } from 'buffer'

import { createEmpty } from './pickle.ts'
import {
  UnpackedFiles,
  UnpackedDirectory,
  FileMetadata,
  DirectoryMetadata
} from './types.ts'

const isDirectory = (val: any) => !!val && typeof val === 'object'

const isDirectoryMetadata= (val: any) =>
  isDirectory(val)
  && isDirectory((<DirectoryMetadata>val).files)

const makeHeaderTree = (files: UnpackedFiles): UnpackedDirectory => 
  Object
    .entries(files)
    .reduce(({ files }, [key, value]) => ({
      files: {
        ...files,
        [key]:
          isDirectory(value)
            ? makeHeaderTree(<UnpackedFiles>value)
            : value
      }
    }), { files: {} })

const makeTreeSize = (tree: UnpackedDirectory): DirectoryMetadata =>
  Object
    .entries(tree.files)
    .reduce(({ files }, [key, value]) => ({
      files: {
        ...files,
        [key]:
          isDirectoryMetadata(value)
            ? makeTreeSize(<UnpackedDirectory>value)
            : { size: (<any>value)?.length }
      }
    }), { files: {} })

const makeTreeOffset = (tree: DirectoryMetadata): DirectoryMetadata => {
  const makeInnerTreeOffset = (tree: DirectoryMetadata, offset: string): [DirectoryMetadata, string] =>
    Object
      .entries(tree.files)
      .reduce<[DirectoryMetadata, string]>(([{ files }, offset], [key, value]) => {
        const [newValue, newOffset] =
          isDirectoryMetadata(value)
            ? makeInnerTreeOffset(<DirectoryMetadata>value, offset)
            : [
              {
                size: (<FileMetadata>value).size || 0,
                offset: offset
              },
              (Number(offset) + ((<FileMetadata>value).size || 0)).toString()
            ]

        return [
          {
            files: {
              ...files,
              [key]: newValue
            }
          },
          newOffset
        ]
      }, [{ files: {} }, offset || "0"])

  return makeInnerTreeOffset(tree, '0')[0]
}

const makeHeader = (files: UnpackedFiles): DirectoryMetadata =>
  makeTreeOffset(
    makeTreeSize(
      makeHeaderTree(files)
    )
  )

const makeFilesBuffer = (files: UnpackedFiles): Buffer[] =>
  Object.entries(files)
    .reduce<Buffer[]>((arr, [, value]) => [
      ...arr,
      ...(
        value
        && typeof value === 'object'
        && value?.constructor === Object
          ? makeFilesBuffer(<UnpackedFiles>value)
          : [Buffer.from(value)]
      )
    ], [])

type createPackage = (files: UnpackedFiles) => Buffer

export const createPackage: createPackage = async (files) => {
  const header = makeHeader(files)
  const headerPickle = createEmpty()
  headerPickle.writeString(JSON.stringify(header))
  const headerBuf = headerPickle.toBuffer()

  const sizePickle = createEmpty()
  sizePickle.writeUInt32(headerBuf.length)
  const sizeBuf = sizePickle.toBuffer()
  return Buffer.concat([sizeBuf, headerBuf, ...makeFilesBuffer(files)])
}
