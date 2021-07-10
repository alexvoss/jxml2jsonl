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
      fs = require('fs'),
      Xml2JsonlProcessor = require('../../lib/Xml2JsonlProcessor')
      SimplifyUniqueTransformer = require('../../lib/transform/SimplifyUniqueTransformer')
;

chai.use(require('sinon-chai'))

let wikidump = fs.readFileSync('tests/acceptance/wikipedia.xml', 'utf-8')

describe('Xml2JsonlProcessor', function() {

  let outputStream
  let processor

  beforeEach(function() {
    outputStream = {write: sinon.spy(), on: sinon.spy(), once: sinon.spy(), emit: sinon.spy(), end: sinon.spy()}
    inputStream = new stream.Readable()
    inputStream.push(wikidump)
    inputStream.push(null)

    processor = new Xml2JsonlProcessor({
      inputStream: inputStream,
      outputStream: outputStream, 
      tags: null, 
      filter: new SimplifyUniqueTransformer(), 
      procroot: false
    })

  })

  afterEach(function(){
    sinon.restore()
  })

  it('reads siteinfo', async function() {
    await processor.process()
    let json = outputStream.write.getCall(0).args[0]
    expect(json.__t).to.equal('siteinfo')
  })

  it('reads page', async function() {
    await processor.process()
    let json = outputStream.write.getCall(1).args[0]
    expect(json.__t).to.equal('page')
  })

  it('single revision is property', async function() {
    await processor.process()
    let json = outputStream.write.getCall(1).args[0]
    expect(json.revision instanceof Array).to.be.false;
  })

  it('multiple revisions are array', async function() {
    await processor.process()
    let json = outputStream.write.getCall(2).args[0]
    //console.log(JSON.stringify(json, null, 2))
    expect(json.revision instanceof Array).to.be.true;
  })

})
