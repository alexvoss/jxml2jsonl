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

/**
 * This example shows how to use xml2jsonl to convert data from the Wikipedia 
 * full page history data dumps, filter out page histories of interest and 
 * write them to Jsonl files. The pages of interest in this example are those
 * that at some point or another have had a tag applied that questioned the 
 * notability of the subject.
 */

const { Transform } = require('stream');
//let wtf = require('wtf_wikipedia')  // https://github.com/spencermountain/wtf_wikipedia
const Xml2JsonlProcessor = require('../../lib/Xml2JsonlProcessor')
const SimplifyUniqueTransformer = require('../../lib/transform/SimplifyUniqueTransformer')
const FilterTransformer = require('../../lib/transform/FilterTransformer')
const JsonTransformer = require('../../lib/transform/JsonTransformer')

class TextSimplifyTransformer extends Transform {
  constructor() {
    super({objectMode: true})
  }
  
  _transform = function(object, encoding, callback) {
    for(revision of object.revision) {
      if(revision.__x) {
        delete revision.__x
      }
      revision.text = revision.text.__x
    }
    this.removeEmptyText(object)
    callback(null, object)
  }

  removeEmptyText(object) {
    if(object.__x && object.__x.trim() == "") {
      delete object.__x
    }
    let props = Object.getOwnPropertyNames(object)
    for(let prop of props) {
      if(object[prop] instanceof Object) {
        this.removeEmptyText(object[prop])
      }
    }
  }
}

// we are running this as a filter, largely because input comes from bzip2 compressed
// files and these are better decompressed using a separate bzcat process
let inputStream = process.stdin

let pipeline = new SimplifyUniqueTransformer()

let filterTransformer = new FilterTransformer(obj => {
  if(obj.__t != 'page') return false
  let revisions = obj.revision
  if(!(revisions instanceof Array)) {
    revisions = [revisions]
  }
  for(revision of revisions) {
    if(!revision.text) {
      return false
    }
    if(!revision.text.__x) {
      return false
    }
    if(revision.text.__x.match(/{{[Nn]otability/g)
      ||revision.text.__x.match(/{{[Nn]onnotable/g)
      ||revision.text.__x.match(/{{N[Nn]/g)
    ) {
      return true
    }
  }
  return false
})
pipeline.pipe(filterTransformer)

let textTransformer = new TextSimplifyTransformer()
filterTransformer.pipe(textTransformer)

let jsonTransformer = new JsonTransformer()
textTransformer.pipe(jsonTransformer)

jsonTransformer.pipe(process.stdout)

let proc = new Xml2JsonlProcessor({
  inputStream: inputStream,  // the inputstream connected to stdin
  outputStream: pipeline,    // the outputstream we assembled
  tags: null,                // let's match all tags, see what's in the dataset
  filter: null,              // we already assembled those
  procroot: false            // don't process root element
})

proc.process()
