# jXml2jsonl

*Note*: this version of the code is no longer supported. I ran into some problems with JavaScript itself that made me re-think the approach and I am writing a [new implementation using Kotlin](https://github.com/alexvoss/xml2jsonl) now, which should not only be faster but also deal with larger individual records.

Xml2jsonl is a utility to convert large XML files into files with one JSON object per line, allowing
the data to be filtered on the way.

This can be useful when working with large datasets that come as one
big XML file but contain repeated elements that are of interest. There
are plenty of examples of datasets published as very large XML
documents. Notorious examples are the [Wikipedia data
dumps](https://dumps.wikimedia.org/backup-index.html) or the
[Stack Exchange data
dumps](https://archive.org/details/stackexchange). 

Converting to JSONL files before trying to work with such files has the following advantages:

* JSON is less verbose than XML, leading to a reduction of file sizes, at least for uncompressed
  versions but quite possibly also for compressed files.  
* Because not all the data is stored in a single object, document-oriented parsers can be used to
  read the data back into memory, one object at a time. This makes writing code for analysing the
  data much, much simpler to write.
* JSON parsers are available in many languages out of the box while XML parsers usually come in the
  form of libraries that need to be made available as dependencies.
* **I will need to check performance!**

An additional function this tool serves is to enable filtering of the
data, so that subsets of the elements can be created. The tool can
call a user-defined function for every object that is read.  This
function can filter the data to be written to the output or can
transform it by removing properties that are not required.

## Unique versus non-unique elements

In XML, elements can be repeated any number of times. A
straightforward translation into JSON is to store child nodes as
arrays be default. This is the approach taken by `xml2json`. The JSON
produced looks like this:

```javascript
{
  '__t': 'tagname', 
  '__a': {<attributes>},
  '__c': [<child_nodes],
  '__x': 'text content'
}
```

Each information-carrying part of an XML element is mapped to an
attribute in the object. The XML attributes are mapped to a JSON
object since attributes in XML cannot repeat. Child elements, however,
can and so the child nodes are mapped to an array. Also, note that tag
names and attribute names can collide, so the element's tag name, its
attribute and the tag names of its children need to be in separate
attributes.

Now, this representation is not terribly convenient to work with. One 
solution would have been to create an alternative representation that 
assumes non-repeating elements. However, there will be cases where *some* 
of the elements are repeating and some are not. 

As a consequence, *prettifying* the generated JSON is left to filters
that can be applied before data gets written out to disk. The
`SimplifyUniqueTransformer` class provides functionality to simplify
the format while checking that there are no clashes. This may work out
of the box for a given dataset or may need to be adapted.

## Limitations

The tool does not support XML documents that contain mixed content
models, sorry. It is not easy to represent a mixed content model in
JSON, though I bet it is not impossible.

Another limitation is that the ordering of elements is not preserved.
Depending on ordering is common in document-oriented uses of XML that
involve mixed content models but not in uses of XML to represent more
structured data.

### Object Size

Because the tool uses `JSON.stringify()` to turn objects into
JSON-encoded strings, it inherits any limitations of this function. 
There does seem to be a limit to how large the individual objects in
the processing pipeline can get before a `RangeError` is thrown. One 
limitation is the heap space available to Node.js and the other seems 
to be a [limitation on the
length of a String](https://stackoverflow.com/questions/44533966/v8-node-js-increase-max-allowed-string-length).

The heap size can be expanded using the `--max-old-space-size`
[documentation](https://nodejs.org/api/cli.html#cli_max_old_space_size_size_in_megabytes) option. It seems, though, that the maximum string length is [hard-coded into V8, so Node.js inherits this](https://github.com/nodejs/node/issues/33960). Version 12 of Node.js seems to have a higher limit than either the current latest versions (16) or the current LTS versions (14), so it is best to use these if the object size is an issue. (On a 32 bit system, the limit is lower than on a 64 bit system, so I would not recommend using one of these.)

## Performance

This tool is written in JavaScript for [Node.js](https://nodejs.org). There is a specific reason for
this (to do with Wikipedia and libraries available for parsing MediaWiki content). JavaScript is probably 
not the best language for implementing a tool like this but it also likely is not the worst. The
parsing of the XML data is done using the [Expat XML parser](https://libexpat.github.io/), which is
written in C, is very mature and performs really well. Everything from there onwards is JavaScript
code.

As it stands, the code does not make use of worker threads. There is not much to be gained for the
sorts of things the tool itself does. The user-defined function can, of course, be implemented to
make use of workers if this makes sense for the operations to be performed. 

## Usage

The basic usage of the tool is fairly straightforward. It reads input either from a given input file
or from standard input. Likewise, it writes to standard output by default but this can be changed
by passing a suitable filename on the command line. This means that `xml2jsonl` can work as a filter
like so: `bzcat large_file.xml | xml2jsonl | bzip2 > output.jsonl`.

By default, `xml2jsonl` processes all child objects of the root
object. The `--tags` argument can be used to specify the tag names of
the elements that should be processed. A user-specified filter
function can be provided with `--filter` to reduce the output to only
the data needed and to transform the objects (see below).

```
--input <filename>        provides an input file to read from. The default is to 
                          read from standad input.
--output <filename>       provides an output file to write to. The default is to 
                          write to standard output.
--tags <element name(s)>  the tag name(s) of elements to be extracted from the 
                          XML document parsed. If none are provided then all
                          child elements of the root element are processed.
--filter <js file>        the name of a Javascript module to load via require; 
                          must export a filter() function.
--root                    process the root element as well (to create
                          a single JSON object)
```


## Implementing filters

**TODO**

## Testing

The code comes with a range of unit tests written with
[Mocha](https://mochajs.org/). They can be run using `npm test`. A
number of acceptance tests can be run using `npm run acceptance`.
These are potentially longer running and work with more complex data.

The tests are run routinely on (Jenkins? GitHub Actions? **TODO**)
