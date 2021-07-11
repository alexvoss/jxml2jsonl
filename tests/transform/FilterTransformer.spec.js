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
      FilterTransformer = require('../../lib/transform/FilterTransformer')
;

chai.use(require('sinon-chai'))

describe('FilterTransformer', function() {

  let outputStream

  beforeEach(function() {
    outputStream = {write: sinon.spy(), on: sinon.spy(), once: sinon.spy(), emit: sinon.spy(), end: sinon.spy()}
  })

  afterEach(function(){
    sinon.restore()
  })

  it('calls filter function', async function() {

    let filterFunction = sinon.stub()
    filterFunction.returns(true)

    let filter = new FilterTransformer(filterFunction)
    filter.pipe(outputStream)
    filter.write({x:true})
    filter.end()

    await new Promise((resolve, reject) => {
      stream.finished(filter, (err) => {
        resolve()
      })
    })

    expect(filterFunction.calledOnce).to.be.true
  })

  it('filters out objects that match filter function', async function() {

    let filter = new FilterTransformer(obj => obj.x)
    filter.pipe(outputStream)
    filter.write({x: true})
    filter.write({x: false})
    filter.write({x: true})
    filter.end()

    await new Promise((resolve, reject) => {
      stream.finished(filter, (err) => {
        resolve()
      })
    })

    expect(outputStream.write.callCount).to.equal(2)
  })


})
