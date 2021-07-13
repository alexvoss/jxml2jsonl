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

//let wtf = require('wtf_wikipedia')  // https://github.com/spencermountain/wtf_wikipedia
let Xml2JsonlProcessor = require('../../lib/Xml2JsonlProcessor')
let SimplifyUniqueTransformer = require('../../lib/transform/SimplifyUniqueTransformer')
let FilterTransformer = require('../../lib/transform/FilterTransformer')
let JsonTransformer = require('../../lib/transform/JsonTransformer')

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

let jsonTransformer = new JsonTransformer()
filterTransformer.pipe(jsonTransformer)

jsonTransformer.pipe(process.stdout)

let proc = new Xml2JsonlProcessor({
  inputStream: inputStream,  // the inputstream connected to stdin
  outputStream: pipeline,    // the outputstream we assembled
  tags: null,                // let's match all tags, see what's in the dataset
  filter: null,              // we already assembled those
  procroot: false            // don't process root element
})

proc.process()
