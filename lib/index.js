/**
 *
 * xml2jsonl - convert XML to a sequence of JSON objects, written out
 *             one object per line.
 *
 * (c) 2021 Alexander Voss (alex@corealisation.com)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

let proc = require('processor')

// Parse command line arguments.
let args = require('minimist')(process.argv.slice(2), {
  'string': ['input', 'output', 'filter', 'tags'],
})

if(args.help) {
  console.log(`
Usage: xml2json <args>

--input <filename>        provides an input file to read from. The default is to 
                          read from standad input.
--output <filename>       provides an output file to write to. The default is to 
                          write to standard output.
--tags <element name(s)>  the tag name(s) of elements to be extracted from the 
                          XML document parsed. If none are provided then all
                          child elements of the root element are processed.
--filter <js file>        the name of a Javascript module to load via require; 
                          must export a filter() function.
--root                    process the root element as well (to create
                          a single JSON object)
`)
  return
}

let inputStream = process.stdin
if(args.input) {
  inputStream = fs.createReadStream(args.input)
  
} 

let outputStream = process.stdout
if(args.output) {
  outputStream = fs.createWriteStream(args.output)
}

proc.process({
  inputStream: inputStream,
  outputStream: outputStream, 
  tags: args.tags, 
  filter: args.filter,
  root: args.root
})
