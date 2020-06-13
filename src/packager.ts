
import type { UnpackedFiles, UnpackedDirectory, FileMetadata, DirectoryMetadata } from './types'

import path from 'path'
import { Buffer } from 'buffer'

import { createEmpty } from './pickle'
import { isDirectory, isDirectoryMetadata } from './utils'

const makeFlatTree = (files: UnpackedFiles): UnpackedFiles => {
  const tree: UnpackedFiles = {}

  for (const [key, val] of Object.entries(files)) {
    let currDir = tree
    const dirs = key.split(path.sep).filter(Boolean)
    const filename = <string>dirs.pop()
    for (const dir of dirs) {
      currDir = <UnpackedFiles>(currDir[dir] = currDir[dir] ?? {})
    }
    currDir[filename] = val
  }
  return <UnpackedDirectory>tree
}

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

const makeSizeTree = (tree: UnpackedDirectory): DirectoryMetadata =>
  Object
    .entries(tree.files)
    .reduce(({ files }, [key, value]) => ({
      files: {
        ...files,
        [key]:
          isDirectoryMetadata(value)
            ? makeSizeTree(<UnpackedDirectory>value)
            : { size: (<any>value)?.length }
      }
    }), { files: {} })

const makeOffsetTree = (tree: DirectoryMetadata): DirectoryMetadata => {
  const makeInnerOffsetTree = (tree: DirectoryMetadata, offset: string): [DirectoryMetadata, string] =>
    Object
      .entries(tree.files)
      .reduce<[DirectoryMetadata, string]>(([{ files }, offset], [key, value]) => {
        const [newValue, newOffset] =
          isDirectoryMetadata(value)
            ? makeInnerOffsetTree(<DirectoryMetadata>value, offset)
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

  return makeInnerOffsetTree(tree, '0')[0]
}

const makeHeader = (files: UnpackedFiles): DirectoryMetadata =>
  makeOffsetTree(
    makeSizeTree(
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
          : [Buffer.from([value])]
      )
    ], [])

export const createPackage = async (files: UnpackedFiles, { flat = false } = {}): Promise<Buffer> => {
  const header = makeHeader(flat ? makeFlatTree(files) : files)
  const headerPickle = createEmpty()
  headerPickle.writeString(JSON.stringify(header))
  const headerBuf = headerPickle.toBuffer()

  const sizePickle = createEmpty()
  sizePickle.writeUInt32(headerBuf.length)
  const sizeBuf = sizePickle.toBuffer()
  return Buffer.concat([sizeBuf, headerBuf, ...makeFilesBuffer(files)])
}
