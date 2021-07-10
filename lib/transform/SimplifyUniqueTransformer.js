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
 * Transforms the generic JSON format that the Xml2JsonlProcessor produces 
 * into a more convenient format provided that attribute names do not collide.
 */

class SimplifyUniqueTransformer extends Transform {
  
  constructor(options) {
    if(!options) {
      options = {objectMode: true}
    } else {
      options.objectMode = true
    }
    super(options)
  }

  _transform = function(object, encoding, callback) {
    this.simplify(object)
    callback(null, object)
  }

  /**
   * Simplify the data format 
   */
  simplify(object) {
    this.simplifyChildren(object)
    this.childrenToProperties(object)
    this.attributesToProperties(object)
  }

  /**
   * Turn XML attributes into properties as long as there are no name clashes.
   */
  attributesToProperties(object) {
    if(object.__a) {
      let keep = {}
      let attrs = Object.keys(object.__a)
      while(attrs.length > 0) {
        let attr = attrs.pop()
        if(!object.hasOwnProperty(attr)) {
          object[attr] = object.__a[attr]
        } else {
          keep[attr] = object.__a[attr]
        }
      }
      if(Object.keys(keep).length > 0) {
        object.__a = keep
      } else {
        delete object.__a
      }
    }
  }

  /**
   * Turn XML child nodes into properties as long as there are no name clashes.
   */
  childrenToProperties(object) {
    if(object.__c) {
      let keep = []
      while(object.__c.length > 0) {
        let child = object.__c.pop()
        if(!object.hasOwnProperty(child.__t)) {
          object[child.__t] = this.simplifyTextOnly(child)
          this.addRepeatedElements(object, child.__t)
          delete child.__t
        } else {
          keep.push(child)
        }
      }
      if(keep.length > 0) {
        object.__c = keep
      } else {
        delete object.__c
      }
    }
  }

  /**
   * Child nodes that repeat can be turned into arrays. This is called by childrenToproperties.
   */
  addRepeatedElements(object, type) {
    let children = object.__c
    for(let i = 0; i < children.length; i++) {
      if(children[i].__t == type) {
        if(!(object[type] instanceof Array)) {
          object[type] = [object[type]]
        }
        object[type].push(children[i])
        children.splice(i, 1)
        i--
      }
    }
  }

  /**
   * If the object has only a '__x' attribute, return the text content, otherwise
   * return the object itself.
   */
  simplifyTextOnly(obj) {
    if(obj.hasOwnProperty('__x') && Object.keys(obj).length == 2) {
      return obj.__x
    }
    return obj
  }

  /**
   * Go through all the children that are objects and simplify them.
   */
  simplifyChildren(object) {
    for(let childIdx in object.__c) {
      if(object.__c[childIdx] instanceof Object) {
        this.simplify(object.__c[childIdx])
      }
    }
  }
}

module.exports = SimplifyUniqueTransformer
