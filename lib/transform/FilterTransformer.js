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

const { Transform } = require('stream');

/**
 * Filters out objects from the stream that match a given criterion
 * given by the filter function passed into the constructor.
 */
class FilterTransformer extends Transform {

  constructor(filterFunction) {
    super({
      readableObjectMode: true,
      writableObjectMode: true
    })

    this.filterFunction = filterFunction
  }

  _transform(chunk, encoding, next) {
    if(this.filterFunction(chunk)) {
      return next(null, chunk)
    }
    next()
  }
}

module.exports = FilterTransformer
