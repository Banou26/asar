import path from 'path'
import { Buffer } from 'buffer'
import pickle, { createEmpty, createFromBuffer } from './pickle.ts'

export type EntryMetadata = {
  // unpacked: boolean;
}

export type FileMetadata = EntryMetadata & {
  executable?: true
  offset?: number
  size?: number
}

export type LinkMetadata = {
  link: string
}

export type Metadata = DirectoryMetadata | FileMetadata | LinkMetadata

export type InputMetadataType = 'directory' | 'file' | 'link'

export type InputMetadata = {
  [property: string]: {
    type: InputMetadataType
  }
}

type DirectoryMetadata = EntryMetadata & {
  files: { [property: string]: EntryMetadata }
}

interface entryFiles {
  [key: string]: ConstructorParameters<typeof Blob>[0]
}

interface createPackageOptions {
  files: entryFiles
}

const base64Pkg = 'BAAAALwAAAC4AAAAswAAAHsiZmlsZXMiOnsiYmFyLnR4dCI6eyJzaXplIjoxNCwib2Zmc2V0IjoiMCJ9LCJmb28udHh0Ijp7InNpemUiOjE2LCJvZmZzZXQiOiIxNCJ9LCJOZXcgZm9sZGVyIjp7ImZpbGVzIjp7ImJhci50eHQiOnsic2l6ZSI6MTQsIm9mZnNldCI6IjMwIn0sImZvby50eHQiOnsic2l6ZSI6MTYsIm9mZnNldCI6IjQ0In19fX19AHF1eCBxdXV4IHF1dXV4Zm9vIGJhciBiYXogYWFhYXF1eCBxdXV4IHF1dXV4Zm9vIGJhciBiYXogYWFhYQ=='

export const createPackage = ({ files }: createPackageOptions) => {

}

const searchNodeFromDirectory = (header: DirectoryMetadata, p: string) => {
  let json = header
  const dirs = p.split(path.sep)
  for (const dir of dirs) {
    if (dir !== '.') {
      json = json.files[dir]
    }
  }
  return json
}

const searchNodeFromPath = (header: DirectoryMetadata, p: string) => {
  p = path.relative('', p)
  if (!p) { return header }
  const name = path.basename(p)
  const node = searchNodeFromDirectory(header, path.dirname(p))
  if (node.files == null) {
    node.files = {}
  }
  if (node.files[name] == null) {
    node.files[name] = {}
  }
  return node.files[name]
}

const readArchiveHeaderSync = (archiveArrayBuffer: ArrayBuffer) => {
  const size =
    createFromBuffer(Buffer.from(archiveArrayBuffer.slice(0, 8)))
      .createIterator()
      .readUInt32()

  const header =
    createFromBuffer(Buffer.from(archiveArrayBuffer.slice(8, size + 8)))
      .createIterator()
      .readString()

  return {
    header: JSON.parse(header),
    headerSize: size
  }
}

const getFile = async (archive: Blob, pathname: string) => {
  const archiveArrayBuffer = archive instanceof Blob ? await archive.arrayBuffer() : archive
  const { header, headerSize} = readArchiveHeaderSync(archiveArrayBuffer)
  // console.log(header)
  const { offset, size } = searchNodeFromPath(header, pathname)
  return Buffer.from(archiveArrayBuffer, 8 + headerSize + Number(offset), size)
}

const listFiles = (header) => {
  const files = []

  const fillFilesFromMetadata = function (basePath, metadata) {
    if (!metadata.files) {
      return
    }

    for (const [childPath, childMetadata] of Object.entries(metadata.files)) {
      const fullPath = path.join(basePath, childPath)
      const packState = childMetadata.unpacked ? 'unpack' : 'pack  '
      files.push(fullPath)
      fillFilesFromMetadata(fullPath, childMetadata)
    }
  }

  fillFilesFromMetadata('/', header)
  return files
}

const extractAll = async (archive) => {
  const archiveArrayBuffer = archive instanceof Blob ? await archive.arrayBuffer() : archive

  return (
    Object.fromEntries(
      await Promise.all(
        listFiles(
          readArchiveHeaderSync(archiveArrayBuffer).header
        ).map(async path => [path, await getFile(archiveArrayBuffer, path)])
      )
    )
  )
}

const removeUselessOffsets = (header, isFiles = false) => console.log('removeUselessOffsets', header, isFiles) ||
  Object
    .entries(header)
    .reduce((obj, [key, value]) => console.log('key', obj, key, value) ||({
        ...obj,
        ...isFiles && key === 'offset'
          ? { }
          : { [key]: value.files ? { files: removeUselessOffsets(value.files, true) } : value }
      }), {})

const makeHeader = (files, offset = 0) =>
  Object.entries(files)
  .reduce(({ offset, ...obj }, [key, value], i) => {
    const childHeader =
      value
      && typeof value === 'object'
      && value?.constructor === Object
        ? makeHeader(value, offset)
        : undefined

    const resultVal =
      value
      && typeof value === 'object'
      && value?.constructor === Object
        ? { files: childHeader }
        : { size: value.length, offset: `${offset}` }

    return {
      ...obj,
      [key]: resultVal,
      offset: offset + (childHeader ? childHeader.offset : value.length)
    }
  }, { offset })

const makeFilesBuffer = (files) =>
  Object.entries(files)
    .reduce((arr, [, value]) => [
      ...arr,
      ...(
        value
        && typeof value === 'object'
        && value?.constructor === Object
          ? makeFilesBuffer(value)
          : [Buffer.from(value)]
      )
    ], [])

const createPackageFromFiles = async (files) => {
  const header = { files: removeUselessOffsets(makeHeader(files), true) }
  console.log('header', header)
  const headerPickle = createEmpty()
  headerPickle.writeString(JSON.stringify(header))
  const headerBuf = headerPickle.toBuffer()

  const sizePickle = createEmpty()
  sizePickle.writeUInt32(headerBuf.length)
  const sizeBuf = sizePickle.toBuffer()
  console.log('headerBuf, sizeBuf', headerBuf, sizeBuf)

  const filesBuffers = makeFilesBuffer(files)
  console.log('filesBuffers', filesBuffers)
  return Buffer.concat([sizeBuf, headerBuf, ...makeFilesBuffer(files)])
}

getFile(new Blob([Buffer.from(base64Pkg, 'base64')]), 'foo.txt')
  .then(v => console.log(v.toString()))

new Blob([Buffer.from(base64Pkg, 'base64')])
  .arrayBuffer()
  .then(buff => console.log(listFiles(readArchiveHeaderSync(buff).header)))

extractAll(new Blob([Buffer.from(base64Pkg, 'base64')])).then(v =>
  console.log(
    Object.fromEntries(
      Object
      .entries(v)
      .map(([key, val]) => [
        key, val.toString()
      ])
    )
  )
)

function saveByteArray(reportName, byte) {
  // return byte
  var blob = new Blob([byte], {type: "application/pdf"});
  var link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  var fileName = reportName;
  link.download = fileName;
  link.click();
};

createPackageFromFiles({
  'New folder': {
    'foo.txt': 'foo bar baz aaaa',
    'bar.txt': 'qux quux quuux'
  },
  'foo.txt': 'foo bar baz aaaa',
  'bar.txt': 'qux quux quuux'
}).then(v => console.log(saveByteArray('test', v)))
