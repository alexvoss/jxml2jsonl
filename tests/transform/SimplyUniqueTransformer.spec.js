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

const assert = require('assert'),
      chai = require('chai'),
      sinon = require('sinon').createSandbox(),
      expect = chai.expect,
      stream = require('stream'),
      processor = require('../../lib/processor')
;

chai.use(require('sinon-chai'))

const json1 = 
{t: 'root',
  a: {
    b: 'b',
    c: 'c'
  },
  c: [
    
  ]
 }

describe('SimplifyUniqueTransformer', function() {

  let outputStream
  let inputStream

  beforeEach(function() {
    outputStream = {write: sinon.spy()}
  })

  afterEach(function(){
    sinon.restore()
  })

  it('moves children to top if unique', async function() {
    [json1]

  })

})