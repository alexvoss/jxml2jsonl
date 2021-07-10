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
      Xml2JsonlProcessor = require('../lib/Xml2JsonlProcessor')
;

chai.use(require('sinon-chai'))

const doc1 = 
`<?xml version='1.0'?>
<root len='2'>
  <a><b></b></a>
  <b attr='b'><c>Hi!</c><a></a></b>
</root>
`

describe('Xml2JsonlProcessor', function() {

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

    let processor = new Xml2JsonlProcessor({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: null, 
      filter: null, 
      procroot: false
    })

    await processor.process()

    if(outputStream.called) {
      let json = outputStream.write.getCall(0).args[0]
      expect(json.__t).to.not.equal('root')
    }
  })

  it('processes root when procroot is true', async function() {

    let processor = new Xml2JsonlProcessor({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: null, 
      filter: null, 
      procroot: true
    })

    await processor.process()

    expect(outputStream.write.called).to.be.true
    let json = outputStream.write.getCall(0).args[0]
    expect(json.__t).to.equal('root')
    expect(json.__a.len).to.equal('2')
  })

  it('ignores elements not specified in tags', async function() {
    
    let processor = new Xml2JsonlProcessor({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: [], 
      filter: null, 
      procroot: false
    })

    await processor.process()

    expect(outputStream.write.callCount).to.equal(0)
  })

  it('extracts elements specified in tags', async function() {

    let processor = new Xml2JsonlProcessor({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: ['b'], 
      filter: null, 
      procroot: false
    })

    await processor.process()

    expect(outputStream.write.called).to.be.true
    let json = outputStream.write.getCall(0).args[0]
    expect(json.__t).to.equal('b')
    expect(json.__a.attr).to.equal('b')
  })

  it('processes child elements of elements to be included', async function() {

    let processor = new Xml2JsonlProcessor({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: ['b'], 
      filter: null, 
      procroot: false
    })

    await processor.process()

    expect(outputStream.write.called).to.be.true
    let json = outputStream.write.getCall(0).args[0]
    expect(json.__c.__c).to.not.be.null
  })

  it('processes text content in elements', async function() {

    let processor = new Xml2JsonlProcessor({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: ['b'], 
      filter: null, 
      procroot: false
    })

    await processor.process()

    let json = outputStream.write.getCall(0).args[0]
    expect(json.__c[0].__x).to.equal('Hi!')
  })
})
