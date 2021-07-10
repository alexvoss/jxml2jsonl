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

/**
 * Parses and converts an XML document to JSONL. Create new objects for parsing subsequent
 * documents.
 */
class Xml2JsonlProcessor {

  constructor(args) {

    this.parser = new expat.Parser('UTF-8')
    this.parser.on('startElement', (name, attr) => {
      this.startElement(name, attr)
    })
    this.parser.on('endElement', (name) => {
      this.endElement(name)
    })
    this.parser.on('text', (frag) => {
      this.onText(frag)
    })

    this.inputStream = args.inputStream    // the input stream to parse from
    this.outputStream = args.outputStream   // the output stream to write toA
    if(args.filter) {
      args.filter.pipe(this.outputStream)
      this.outputStream = args.filter
    }
    this.tags = args.tags                  // optional tags names of the elements to process
    this.procroot = args.procroot          // process root element?

    this.stack = []      // stack of pointers to objects
    this.text = ""       // for joining together text nodes
    this.atroot = true  // flag to say whether the root has been visited

  }


  /**
   * Parse XML from the input stream. This asynchronous function 
   * returns a Promise that resolves when the parser produces 
   * the 'close' event 
   * (see https://nodejs.org/api/stream.html#stream_event_close).
   */
  async process() {

    this.inputStream.pipe(this.parser)
    return new Promise((resolve, reject) => {
      this.parser.on('close', () => resolve())
    })
  }

  /**
   * Depending on whether we are already processing a top-level element or not, 
   * check if it is to be included in the output or not.
   */
  startElement(name, attrs) {

    if(this.atroot) {    
      this.atroot = false
      if(this.procroot) {
        this.outputStream.write({__t: name, __a: attrs})
      }
      return
    }

    let elem = this.newElement(name, attrs)
    this.stack.push(elem)
  }

  /**
   * On encountering an endElement event, if we are not in an element to 
   * ignore then we flush the accumulated data to the outputStream. Either 
   * way, we pop() from the stack to keep tracking depth.
   */
  endElement(name) {

    let elem = this.stack.pop()
    if(elem == null) return // root

    if(this.text.length > 0) {
      elem.__x = this.text
      this.text = ""
    }

    if(this.stack.length == 0) {
      if(!this.tags || this.tags.includes(name)) {
        this.flushObject(elem)
      }
    } else {
      let par = this.stack.pop()
      par.__c.push(elem)
      this.stack.push(par)
    }
  }

  /**
   * Flush the accumulated object to the outputStream and reset the state.
   */
  flushObject(elem) {
    this.outputStream.write(elem)
  }

  /**
   * Create a new element with the top-level elements 't' (for the tagname), 
   * 'a' (for attributes) and 'c' (for children).
   */

  newElement(name, attrs) {
    return {
      __t: name,
      __a: attrs,
      __c: []
    }
  }


  /**
   * add a text node 
   */
  onText(frag) {
    if(frag.trim() != "") {
      this.text += frag
    }
  }
}

module.exports = {
  Xml2JsonlProcessor: Xml2JsonlProcessor
}
