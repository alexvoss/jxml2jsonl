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

const fs = require('fs')              // https://nodejs.org/api/fs.html
const expat = require('node-expat')   // https://github.com/astro/node-expat
const stream = require('stream')

let parser 

let outputStream   // the output stream to write to
let tags           // optional tags names of the elements to process
let filter         // optional filter function
let procroot       // process root element?

let stack          // stack of pointers to objects
let text           // for joining together text nodes
let atroot         // flag to say whether the root has been visited

const setup = function() {
  parser = new expat.Parser('UTF-8')
  parser.on('startElement', startElement)
  parser.on('endElement', endElement)
  parser.on('text', onText)
  atroot = true
  text = ""
  stack = []
  page = null
}

/**
 * Depending on whether we are already processing a top-level element or not, 
 * check if it is to be included in the output or not.
 */
const startElement = function(name, attrs) {

  if(atroot) {    
    atroot = false
    if(procroot) {
      outputStream.write({t: name, a: attrs})
    }
    return
  }

  elem = newElement(name, attrs)
  stack.push(elem)
}

/**
 * On encountering an endElement event, if we are not in an element to 
 * ignore then we flush the accumulated data to the outputStream. Either 
 * way, we pop() from the stack to keep tracking depth.
 */
const endElement = function(name) {

  let elem = stack.pop()
  if(elem == null) return // root

  if(text.length > 0) {
    elem.x = text
    text = ""
  }

  if(stack.length == 0) {
    if(!tags || tags.includes(name)) {
      flushObject(elem)
    }
  } else {
    let par = stack.pop()
    par.c.push(elem)
    stack.push(par)
  }
}

/**
 * Flush the accumulated object to the outputStream and reset the state.
 */
const flushObject = function(elem) {
  outputStream.write(elem)
}

/**
 * Create a new element with the top-level elements 't' (for the tagname), 
 * 'a' (for attributes) and 'c' (for children).
 */

const newElement = function(name, attrs) {
  return {
    t: name,
    a: attrs,
    c: []
  }
}


/**
 * add a text node 
 */
const onText = function(frag) {
  if(frag.trim() != "") {
    text += frag
  }
}

/**
 * Parse XML from the input stream. This asynchronous function 
 * returns a Promise that resolves when * the parser produces 
 * the 'close' event 
 * (see https://nodejs.org/api/stream.html#stream_event_close).
 */
let processXml = async function(args) {

  outputStream = args.outputStream
  tags = args.tags
  filter = args.filter
  procroot = args.procroot

  setup()
  args.inputStream.pipe(parser)
  return new Promise(function(resolve, reject) {
    parser.on('close', () => resolve())
  })
}

module.exports = {
  processXml: processXml
}
