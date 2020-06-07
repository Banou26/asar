// import { Buffer } from 'buffer'

import { createPackage } from './packager.ts'
import { listPackage, extractFile, extractAll } from './extractor.ts'

export {
  createPackage,
  listPackage,
  extractFile,
  extractAll
}

//? PACKAGING TEST CODE

// function saveByteArray(reportName, byte) {
//   // return byte
//   var blob = new Blob([byte], {type: "application/asar"});
//   var link = document.createElement('a');
//   link.href = window.URL.createObjectURL(blob);
//   var fileName = reportName;
//   link.download = fileName;
//   link.click();
// };

// createPackage({
//   'New folder': {
//     'foo.txt': 'foo bar baz aaaa',
//     'bar.txt': 'qux quux quuux'
//   },
//   'foo.txt': 'foo bar baz aaaa',
//   'bar.txt': 'qux quux quuux'
// }).then(v => console.log(saveByteArray('packed', v)))

// createPackage({
//   'New folder': {
//     'foo.txt': 'foo bar baz aaaa',
//     'bar.txt': 'qux quux quuux'
//   },
//   'foo.txt': 'foo bar baz aaaa',
//   'bar.txt': 'qux quux quuux'
// }).then(v => console.log(v))

// createPackage({
//   '/New folder/foo.txt': 'foo bar baz aaaa',
//   '/New folder/bar.txt': 'qux quux quuux',
//   '/foo.txt': 'foo bar baz aaaa',
//   '/bar.txt': 'qux quux quuux'
// }, { flat: true }).then(v => console.log(v))



// //? EXTRACTING TEST CODE

// const base64Pkg = `\
// BAAAALwAAAC4AAAAswAAAHsiZmlsZXMiOnsiYmFyLnR4dCI6eyJzaXplIjoxNCw\
// ib2Zmc2V0IjoiMCJ9LCJmb28udHh0Ijp7InNpemUiOjE2LCJvZmZzZXQiOiIxNC\
// J9LCJOZXcgZm9sZGVyIjp7ImZpbGVzIjp7ImJhci50eHQiOnsic2l6ZSI6MTQsI\
// m9mZnNldCI6IjMwIn0sImZvby50eHQiOnsic2l6ZSI6MTYsIm9mZnNldCI6IjQ0\
// In19fX19AHF1eCBxdXV4IHF1dXV4Zm9vIGJhciBiYXogYWFhYXF1eCBxdXV4IHF\
// 1dXV4Zm9vIGJhciBiYXogYWFhYQ==`
// const packedPkg = new Blob([Buffer.from(base64Pkg, 'base64')])

// extractFile(packedPkg, '/New folder/foo.txt')
//   .then(v => console.log(v.toString()))

// listPackage(packedPkg).then(v => console.log(v))
// listPackage(packedPkg, { flat: true }).then(v => console.log(v))

// const stringifyPackageValues = (v: Object): { [key: string]: string } =>
//   Object.fromEntries(
//     Object
//     .entries(v)
//     .map(([key, val]) => [
//       key,
//       typeof val === 'object' && val.constructor === Object
//         ? stringifyPackageValues(val)
//         : val.toString()
//     ])
//   )

// extractAll(packedPkg).then(v => console.log(stringifyPackageValues(v)))
// extractAll(packedPkg, { flat: true }).then(v => console.log(stringifyPackageValues(v)))
