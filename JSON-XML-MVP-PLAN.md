# Route Catalog And Conversion Policy

This file defines the route catalog for the conversion platform.

All 10 routes listed here must be implemented in the current repository. Route implementations live under `api/src/converters/` in the new code at the repo root. Legacy quote-demo code under `legacy/` is not part of this catalog.

## 1. Route Registry Contract

Each route must be described in code by a metadata object with at least:

- `key`
- `label`
- `description`
- `acceptedExtensions`
- `acceptedMimeTypes`
- `outputExtension`
- `outputMimeType`
- `exampleInput`
- `exampleOutput`
- `validate(input)`
- `convert(input, options?)`

The frontend should read shared route metadata so the help text and backend behavior stay aligned.

## 2. Global Conversion Rules

These rules apply to all routes:

- input is always treated as text
- output is always returned as text
- blank input is rejected unless a route explicitly allows it
- output must be deterministic
- validation failures return `400`
- malformed request bodies return structured errors
- converted filenames must change extension appropriately
- original and converted blobs must be stored for every successful conversion

Recommended filename pattern:

```text
originals/{route}/{timestamp}_{safeInputName}
converted/{route}/{timestamp}_{safeOutputName}
```

## 3. Supported Routes

## 3.1 `json_to_html`

Purpose:

- convert a flat JSON object into a basic HTML snippet

Accepted input:

- `.json`
- `application/json`

Output:

- `.html`
- `text/html; charset=utf-8`

Validation:

- input must be valid JSON
- input must parse to an object
- arrays are rejected for this route

Conversion policy:

- if `title` exists, output `<h1>`
- if `subtitle` exists, output `<h2>`
- all remaining top-level primitive fields become `<p><strong>Key:</strong> Value</p>`
- nested objects and arrays are stringified into paragraph content
- escape HTML special characters before output

Example input:

```json
{ "title": "Hello", "description": "Welcome to the app" }
```

Example output:

```html
<h1>Hello</h1>
<p><strong>Description:</strong> Welcome to the app</p>
```

## 3.2 `json_to_text`

Purpose:

- convert a JSON object into `Key: Value` lines

Accepted input:

- `.json`
- `application/json`

Output:

- `.txt`
- `text/plain; charset=utf-8`

Validation:

- input must be valid JSON
- input must parse to an object

Conversion policy:

- output one line per top-level key
- use display format `Key: Value`
- nested objects and arrays are JSON stringified
- preserve key insertion order from parsed object

Example output:

```text
Name: Jamie
Course: Cloud Platforms
Level: 5
```

## 3.3 `list_to_json_array`

Purpose:

- convert newline-delimited text into a JSON array

Accepted input:

- `.txt`
- `text/plain`

Output:

- `.json`
- `application/json; charset=utf-8`

Validation:

- at least one non-empty line must exist

Conversion policy:

- split by line break
- trim each line
- ignore blank lines
- preserve item order

Example output:

```json
["apple", "banana", "orange"]
```

## 3.4 `csv_to_json`

Purpose:

- convert a single CSV data row into one JSON object

Accepted input:

- `.csv`
- `text/csv`

Output:

- `.json`
- `application/json; charset=utf-8`

Validation:

- input must contain exactly one header row and one data row
- header names must be non-empty
- extra data rows are rejected

Conversion policy:

- use header row as keys
- use first data row as values
- all values remain strings
- use a proper CSV parser so commas in quoted fields are handled correctly

Example output:

```json
{ "name": "Jamie", "course": "Cloud Platforms", "level": "5" }
```

## 3.5 `json_array_to_csv`

Purpose:

- convert an array of objects into CSV

Accepted input:

- `.json`
- `application/json`

Output:

- `.csv`
- `text/csv; charset=utf-8`

Validation:

- input must be valid JSON
- input must parse to an array
- every item must be an object and not `null`

Conversion policy:

- determine headers by first-seen key order across the whole array
- first output line is the header row
- missing values become empty cells
- nested values are JSON stringified

Example output:

```csv
name,score
Alice,10
Bob,12
```

## 3.6 `form_to_json`

Purpose:

- convert URL encoded form data into JSON

Accepted input:

- `.txt`
- `.form`
- `application/x-www-form-urlencoded`
- `text/plain`

Output:

- `.json`
- `application/json; charset=utf-8`

Validation:

- at least one key-value pair must exist

Conversion policy:

- parse with `URLSearchParams`
- decode percent-encoded values
- if a key appears once, output a string value
- if a key appears multiple times, output an array of strings

Example output:

```json
{ "name": "Jamie", "course": "Cloud Platforms", "level": "5" }
```

## 3.7 `json_to_keyvalue`

Purpose:

- convert a JSON object into `key=value` lines

Accepted input:

- `.json`
- `application/json`

Output:

- `.txt`
- `text/plain; charset=utf-8`

Validation:

- input must be valid JSON
- input must parse to an object

Conversion policy:

- one line per top-level key
- keys are emitted as-is
- primitive values are stringified directly
- nested values are JSON stringified
- reserved characters in values are URL encoded with `encodeURIComponent`

Example output:

```text
name=Jamie
city=Peterborough
```

## 3.8 `xml_to_text`

Purpose:

- convert an XML document into a plain-text summary sentence

Accepted input:

- `.xml`
- `application/xml`
- `text/xml`

Output:

- `.txt`
- `text/plain; charset=utf-8`

Validation:

- input must be valid XML
- document must contain a root element

Conversion policy:

- parse with `fast-xml-parser`
- if the document contains `student`, `name`, and `course`, output:
  - `Student <name> is enrolled on <course>.`
- otherwise output a generic summary:
  - `XML document '<rootName>' was parsed successfully.`

Example output:

```text
Student Jamie is enrolled on Cloud Platforms.
```

## 3.9 `markdown_to_html`

Purpose:

- convert basic Markdown into HTML

Accepted input:

- `.md`
- `.markdown`
- `text/markdown`
- `text/plain`

Output:

- `.html`
- `text/html; charset=utf-8`

Validation:

- input must contain non-whitespace content

Conversion policy:

- use `marked`
- support headings, paragraphs, emphasis, code, and lists
- do not add full-page HTML boilerplate
- return snippet HTML only

Example output:

```html
<h1>Title</h1>
<p>This is a paragraph.</p>
```

## 3.10 `json_to_xml`

Purpose:

- convert JSON into deterministic XML

Accepted input:

- `.json`
- `application/json`

Output:

- `.xml`
- `application/xml; charset=utf-8`

Validation:

- input must be valid JSON

Conversion policy:

- build XML using `fast-xml-parser`
- default root element is `root`
- if `options.rootElement` is supplied and valid, use it
- arrays become repeated `<item>` children
- `null` becomes an empty element
- primitive values become text node content
- escape XML special characters automatically through the builder

Example output:

```xml
<student><name>Jamie</name><course>Cloud Platforms</course></student>
```

## 4. Output Extension Map

Use this output mapping exactly:

- `json_to_html` -> `.html`
- `json_to_text` -> `.txt`
- `list_to_json_array` -> `.json`
- `csv_to_json` -> `.json`
- `json_array_to_csv` -> `.csv`
- `form_to_json` -> `.json`
- `json_to_keyvalue` -> `.txt`
- `xml_to_text` -> `.txt`
- `markdown_to_html` -> `.html`
- `json_to_xml` -> `.xml`

## 5. Testing Matrix

Every route should have at least:

- 1 happy-path test from the assignment example
- 1 validation failure test
- 1 edge-case formatting test

Additional route-specific expectations:

- `csv_to_json`: test quoted commas
- `json_array_to_csv`: test missing fields and header ordering
- `form_to_json`: test repeated keys
- `json_to_keyvalue`: test URL encoding
- `xml_to_text`: test fallback summary
- `markdown_to_html`: test list rendering
- `json_to_xml`: test arrays, `null`, and custom root element

## 6. Frontend Route UX Rules

For each route the frontend should show:

- a friendly label
- accepted formats
- a short example input
- the expected output extension

The frontend should also:

- disable Convert until a route is selected and input exists
- validate file extension before submission when a file is uploaded
- allow paste mode for quick demo input
- show the route key returned by the API
- show blob paths returned by the API
- show both browser download and Azure download options

## 7. Future Expansion Rules

If time remains after the 10 required routes:

- add more converters only if tests and deployment are already solid
- do not replace the single-endpoint design
- do not introduce background queues unless there is a clear assignment benefit
- prioritize better logging, smoke tests, and documentation over extra converter ideas
