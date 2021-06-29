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
      processor = require('../lib/processor')
;

chai.use(require('sinon-chai'))

const doc1 = 
`<?xml version='1.0'?>
<root len='2'>
  <a><b></b></a>
  <b attr='b'><c>Hi!</c><a></a></b>
</root>
`

describe('processor', function() {

  let outputStream
  let inputStream

  beforeEach(function() {
    outputStream = {write: sinon.spy()}
    inputStream = new stream.Readable()
    inputStream.push(doc1)
    inputStream.push(null)
  })

  afterEach(function(){
    sinon.restore()
  })

  it('skips root when procroot is false', async function() {

    await processor.processXml({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: null, 
      filter: null, 
      procroot: false
    })

    if(outputStream.called) {
      let json = outputStream.write.getCall(0).args[0]
      expect(json.t).to.not.equal('root')
    }
  })

  it('processes root when procroot is true', async function() {

    await processor.processXml({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: null, 
      filter: null, 
      procroot: true
    })

    expect(outputStream.write.called).to.be.true
    let json = outputStream.write.getCall(0).args[0]
    expect(json.t).to.equal('root')
    expect(json.a.len).to.equal('2')
  })

  it('ignores elements not specified in tags', async function() {
    
    await processor.processXml({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: [], 
      filter: null, 
      procroot: false
    })

    expect(outputStream.write.callCount).to.equal(0)
  })

  it('extracts elements specified in tags', async function() {

    await processor.processXml({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: ['b'], 
      filter: null, 
      procroot: false
    })

    expect(outputStream.write.called).to.be.true
    let json = outputStream.write.getCall(0).args[0]
    expect(json.t).to.equal('b')
    expect(json.a.attr).to.equal('b')
  })

  it('processes child elements of elements to be included', async function() {

    await processor.processXml({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: ['b'], 
      filter: null, 
      procroot: false
    })

    expect(outputStream.write.called).to.be.true
    let json = outputStream.write.getCall(0).args[0]
    expect(json.c.c).to.not.be.null
  })

  it('processes text content in elements', async function() {

    await processor.processXml({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: ['b'], 
      filter: null, 
      procroot: false
    })

    let json = outputStream.write.getCall(0).args[0]
    console.log(json)
    expect(json.c[0].c[0]).to.equal('Hi!')
  })
})
