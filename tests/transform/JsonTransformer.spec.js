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
      JsonTransformer = require('../../lib/transform/JsonTransformer')
;

chai.use(require('sinon-chai'))

describe('JsonTransformer', function() {

  let outputStream
  let jsonTransformer

  beforeEach(function() {
    outputStream = {write: sinon.spy()}
    jsonTransformer = new JsonTransformer()
  })

  afterEach(function(){
    sinon.restore()
  })

  it("turns an empty object into '{}'", async function() {
    jsonTransformer.write({})
    let result = jsonTransformer.read()
    expect(result).to.equal('{}')
  })

  it("turns a complex object into JSON string", async function() {
    obj = {a:1,b:{c:2}}
    jsonTransformer.write(obj)
    let str = jsonTransformer.read()
    let result = JSON.parse(str)
    expect(result).to.deep.equal(obj)
  })

})
