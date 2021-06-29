# xml2jsonl

Xml2jsonl is a utility to convert large XML files into files with one JSON object per line, allowing
the data to be filtered on the way.

This can be useful when working with large datasets that come as one big XML file but contain
repeated elements that are of interest. There are plenty of examples of datasets published as 
very large XML documents. One notorious example is the [Wikipedia data
dump](https://dumps.wikimedia.org/backup-index.html) files. These data files will be used as a
running example in the description below.

Converting to JSONL files before trying to work with such files has the following advantages:

* JSON is less verbose than XML, leading to a reduction of file sizes, at least for uncompressed
  versions but quite possibly also for compressed files.  
* Because not all the data is stored in a single object, document-oriented parsers can be used to
  read the data back into memory, one object at a time. This makes writing code for analysing the
  data much, much simpler to write.
* JSON parsers are available in many languages out of the box while XML parsers usually come in the
  form of libraries that need to be made available as dependencies.
* **I will need to check performance!**

An additional function this tool serves is to enable filtering of the data, so that subsets of the
elements can be created. The tool can call a user-defined function for every object that is read.
This function can filter or transform the data to be written to the output  For example, it could
look for matches against a regular expression or might use a MediaWiki parser to parse the text
content of each article and make decisions, for example, based on the presence of tags. It could
also delete attributes from the data that are superfluous or transform the data in any way, really.

## Unique versus non-unique elements

In XML, elements can be repeated any number of times. A
straightforward translation into JSON is to store child nodes as
arrays be default. This is the approach taken by `xml2json`. The JSON
produced looks like this:

```javascript
{
  't': 'tagname', 
  'a': {<attributes>},
  'c': [<child_nodes],
  'x': 'text content'
}
```

Each information-carrying part of an XML element is mapped to an
attribute in the object. The XML attributes are mapped to a JSON
object since attributes in XML cannot repeat. Child elements, however,
can and so the child nodes are mapped to an array.

Now, this representation is not terribly convenient to work with. One 
solution would have been to create an alternative representation that 
assumes non-repeating elements. However, there will be cases where *some* 
of the elements are repeating and some are not. 

As a consequence, *prettifying* the generated JSON is left to the
application-specific filters that can be applied before data gets
written out to disk. Examples of these are included in the `examples`
folder.

## Limitations

The tool does not support XML documents that contain mixed content models, sorry. It is not easy to
represent a mixed content model in JSON, though I bet it is not impossible.

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

Likewise, it does not implement asynchronous IO since doing so runs the risk that the input side
is much faster than the output side (which might pipe into a compression algorithm, for example),
leading to excessive memory use. Any counter-measures would risk the advantage of asynchronous IO
being negated. 

So, how fast does this go? **TODO**

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

The code comes with a range of unit tests written with [Mocha](https://mochajs.org/). They can be
run using `npm test`. The tests are run routinely on (Jenkins? **TODO**)
