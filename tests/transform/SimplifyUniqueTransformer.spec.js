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
      SimplifyUniqueTransformer = require('../../lib/transform/SimplifyUniqueTransformer').SimplifyUniqueTransformer
;

chai.use(require('sinon-chai'))

const json1 = JSON.stringify(
{t: 'root',
  a: {
    b: 'b',
    c: 'c'
  },
  c: [
    {t: 'child1', a: { attr1: 'val1'}},
    {t: 'child2', a: { attr1: 'val1'}}
  ]
 })

describe('SimplifyUniqueTransformer', function() {

  let outputStream
  let inputStream

  beforeEach(function() {
    outputStream = {write: sinon.spy(), on: sinon.spy(), once: sinon.spy(), emit: sinon.spy(), end: sinon.spy()}
  })

  afterEach(function(){
    sinon.restore()
  })

  it('turns children into properties if unique', async function() {

    let trans = new SimplifyUniqueTransformer()
    trans.pipe(outputStream)
    trans.write(JSON.parse(json1))
    trans.end()
    
    await new Promise((resolve, reject) => {
      stream.finished(trans, (err) => {
        resolve()
      })
    })

    let result = outputStream.write.getCall(0).args[0]
    console.log(json1)
    console.log(result)
    expect(result).to.not.be.null
    expect(result.child1).to.not.be.null
  })

  it('deletes children array if empty', async function() {

    let trans = new SimplifyUniqueTransformer()
    trans.pipe(outputStream)
    trans.write(JSON.parse(json1))
    trans.end()
    
    await new Promise((resolve, reject) => {
      stream.finished(trans, (err) => {
        resolve()
      })
    })

    let result = outputStream.write.getCall(0).args[0]
    expect(result).to.not.be.null
    expect(result.hasOwnProperty('c')).to.be.false
  })

  it('removes t property from child if turned into property', async function() {

    let trans = new SimplifyUniqueTransformer()
    trans.pipe(outputStream)
    trans.write(JSON.parse(json1))
    trans.end()
    
    await new Promise((resolve, reject) => {
      stream.finished(trans, (err) => {
        resolve()
      })
    })

    let result = outputStream.write.getCall(0).args[0]
    expect(result).to.not.be.null
    expect(result.child1.hasOwnProperty('t')).to.be.false
  })

})
