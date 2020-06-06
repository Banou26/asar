import path from 'path'
import { Buffer } from 'buffer'

import { createFromBuffer } from './pickle.ts'
import { FileData, DirectoryMetadata, FileMetadata, Metadata } from './types.ts'

const searchNodeFromDirectory = (header: Metadata, p: string) => {
  let json = header
  const dirs = p.split(path.sep)
  for (const dir of dirs) {
    if (dir !== '.') {
      json = (<DirectoryMetadata>json).files[dir]
    }
  }
  return json
}

const searchNodeFromPath = (header: DirectoryMetadata, p: string) => {
  p = path.relative('', p)
  if (!p) { return header }
  const name = path.basename(p)
  const node = <DirectoryMetadata>searchNodeFromDirectory(header, path.dirname(p))
  if (node.files === null) {
    node.files = {}
  }
  if (node.files[name] === null) {
    node.files[name] = {}
  }
  return node.files[name]
}

const readArchiveHeaderSync = (archiveArrayBuffer: ArrayBuffer) => {
  // const view = new DataView(archiveArrayBuffer.slice(0, 8))
  // const size = view.getUint32(alignInt(4, SIZE_UINT32), true)
  const size =
    createFromBuffer(Buffer.from(archiveArrayBuffer.slice(0, 8)))
      .createIterator()
      .readUInt32()

  // todo: check if there is an easy way to replace Pickle with APIs like the DataView
  const header =
    createFromBuffer(Buffer.from(archiveArrayBuffer.slice(8, size + 8)))
      .createIterator()
      .readString()

  return {
    header: JSON.parse(header),
    headerSize: size
  }
}

const getArrayBuffer = (data: FileData) => new Blob([data]).arrayBuffer()

export const extractFile = async (archive: FileData, pathname: string) => {
  const buffer = await getArrayBuffer(archive)
  const { header, headerSize} = readArchiveHeaderSync(buffer)
  const { offset, size } = <FileMetadata>searchNodeFromPath(header, pathname)
  return Buffer.from(buffer, 8 + headerSize + Number(offset), size)
}

export const listPackage = async (archive: FileData, isHeader = false) => {
  const header =
    isHeader
      ? archive
      : readArchiveHeaderSync(await getArrayBuffer(archive)).header
  const files: string[] = []

  const fillFilesFromMetadata = function (basePath: string, metadata: DirectoryMetadata) {
    if (!metadata.files) {
      return
    }

    for (const [childPath, childMetadata] of Object.entries(metadata.files)) {
      const fullPath = path.join(basePath, childPath)
      files.push(fullPath)
      fillFilesFromMetadata(fullPath, <DirectoryMetadata>childMetadata)
    }
  }

  fillFilesFromMetadata('/', header)
  return files
}

export const extractAll = async (archive: FileData): Promise<{ [key: string]: FileData }> => {
  const buffer = await getArrayBuffer(archive)

  return (
    Object.fromEntries(
      await Promise.all(
        (await listPackage(readArchiveHeaderSync(buffer).header, true))
          .map(async (path: string) => [
            path,
            await extractFile(buffer, path)
          ])
      )
    )
  )
}

