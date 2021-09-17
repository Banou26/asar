import { createPackage, listPackage, extractFile, extractAll } from '../src'

// createPackage({
//   'New folder': {
//     'foo.txt': 'foo bar baz aaaa',
//     'bar.txt': 'qux quux quuux'
//   },
//   'foo.txt': 'foo bar baz aaaa',
//   'bar.txt': 'qux quux quuux'
// })//.then(v => console.log(v))

// console.log('heh')



const base64Pkg = `\
BAAAALwAAAC4AAAAswAAAHsiZmlsZXMiOnsiYmFyLnR4dCI6eyJzaXplIjoxNCw\
ib2Zmc2V0IjoiMCJ9LCJmb28udHh0Ijp7InNpemUiOjE2LCJvZmZzZXQiOiIxNC\
J9LCJOZXcgZm9sZGVyIjp7ImZpbGVzIjp7ImJhci50eHQiOnsic2l6ZSI6MTQsI\
m9mZnNldCI6IjMwIn0sImZvby50eHQiOnsic2l6ZSI6MTYsIm9mZnNldCI6IjQ0\
In19fX19AHF1eCBxdXV4IHF1dXV4Zm9vIGJhciBiYXogYWFhYXF1eCBxdXV4IHF\
1dXV4Zm9vIGJhciBiYXogYWFhYQ==`
const packedPkg = Buffer.from(base64Pkg, 'base64')

extractFile(packedPkg, '/New folder/foo.txt')
  .then(v => console.log(v.toString()))
