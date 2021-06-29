
const stream = require('stream')

const is = stream.Readable.from("Hello")
is.pipe(process.stdout)
