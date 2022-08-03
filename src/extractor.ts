import type { FileData, DirectoryMetadata, FileMetadata, Metadata } from './types'

import path from 'path'
import { Buffer } from 'buffer'

import { createFromBuffer } from './pickle'
import { isDirectoryMetadata } from './utils'

interface ListPackageReturn {
  [key: string]: string | ListPackageReturn
}

type FullFileMetadata = FileMetadata & { path: string }


const flatListChild = (basePath: string, metadata: DirectoryMetadata): string[] =>
  Object
    .entries(metadata.files)
    .flatMap(([key, value]) =>
      isDirectoryMetadata(value)
        ? flatListChild(path.join(basePath, key), value)
        : path.join(basePath, key)
    )


// WTF Typescript...
type ListChildsReturnType<T> = T extends DirectoryMetadata ? ListPackageReturn : string
const listChilds = <T extends DirectoryMetadata | FileMetadata>(basePath: string, metadata: T): ListChildsReturnType<T> =>
  isDirectoryMetadata(metadata)
    ? (
      Object.fromEntries(
        Object
          .entries(metadata.files)
          .map(([key, value]) => [
            key,
            listChilds(path.join(basePath, key), value)
          ])
      )
    ) as ListChildsReturnType<T>
    : basePath as ListChildsReturnType<T>

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
  p = p.replace(/^\//, '')
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

export const readArchiveHeaderSync = (archiveArrayBuffer: ArrayBuffer): { header: DirectoryMetadata, headerSize: number } => {
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

const getArrayBuffer = (data: FileData) =>
    data instanceof Buffer ? Promise.resolve((data as Buffer).buffer)
    : data instanceof ArrayBuffer ? Promise.resolve(data)
    : new Blob([data]).arrayBuffer()

export const extractFile = async (archive: FileData, pathname: string) => {
  const buffer = await getArrayBuffer(archive)
  const size = new DataView(buffer).getUint32(4, true)
  const headerSize = new DataView(buffer).getUint32(12, true)
  const headerBuffer = buffer.slice(16, headerSize + 16)
  const headerString = new TextDecoder('utf-8').decode(headerBuffer)
  const header = JSON.parse(headerString)
  const { offset, size: payloadSize } = <FileMetadata>searchNodeFromPath(header, pathname)
  return buffer.slice(size + Number(offset) + 8, size + Number(offset) + payloadSize + 8)
}

export type ListPackageOptions = {
  isHeader?: boolean
  flat?: boolean
}

export const listPackage =
  async <T extends ListPackageOptions>(archive: FileData | DirectoryMetadata, options?: T) => {
    const header =
      options?.isHeader
        ? <DirectoryMetadata>archive
        : readArchiveHeaderSync(await getArrayBuffer(<FileData>archive)).header

    return (
      options?.flat
        ? flatListChild('/', header)
        : listChilds('/', header)
    ) as (
      T["flat"] extends true
        ? string[]
        : ListPackageReturn
    )
  }

        )

interface extractPackageReturn {
  [key: string]: FileData | extractPackageReturn
}

export const extractAll =
  async (
    archive: FileData,
    {
      flat = false
    } = {}
  ): Promise<{ [key: string]: FileData } | extractPackageReturn> => {
  const buffer = await getArrayBuffer(archive)
  const { header } = readArchiveHeaderSync(buffer)

  if (flat) {
    return Object.fromEntries(
      await Promise.all(
        (<[string]>await listPackage(header, { isHeader: true, flat: true }))
          .map(async (path: string) => [
            path,
            await extractFile(buffer, path)
          ])
      )
    )
  }

  const extractFolder = async (folder: ListPackageReturn): Promise<extractPackageReturn> =>
    Object.fromEntries(
      await Promise.all(
        Object
        .entries(folder)
        .map(async ([key, value]) => [
          key,
          typeof value === 'object'
            ? await extractFolder(<ListPackageReturn>value)
            : await extractFile(buffer, value)
        ])
      )
    )

  return extractFolder(<ListPackageReturn>await listPackage(header, { isHeader: true }))
}
