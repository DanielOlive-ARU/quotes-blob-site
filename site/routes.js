window.ROUTES = [
  {
    key: "json_to_text",
    label: "JSON to plain text",
    description:
      "Flatten a JSON object into one 'Key: Value' line per top-level field. Nested values are JSON-stringified.",
    acceptedExtensions: [".json"],
    exampleInput: '{ "name": "Student One", "course": "Cloud Platforms", "level": 5 }',
    exampleOutput: "Name: Student One\nCourse: Cloud Platforms\nLevel: 5"
  },
  {
    key: "list_to_json_array",
    label: "Text list to JSON array",
    description:
      "Split newline-separated text into a JSON array of trimmed strings. Blank lines are ignored and order is preserved.",
    acceptedExtensions: [".txt"],
    exampleInput: "apple\nbanana\norange",
    exampleOutput: '["apple","banana","orange"]'
  },
  {
    key: "form_to_json",
    label: "URL-encoded form to JSON",
    description:
      "Parse URL-encoded form data (key=value&key=value) into a JSON object. Percent-encoded values are decoded. Repeated keys become arrays.",
    acceptedExtensions: [".txt", ".form"],
    exampleInput: "name=Student%20One&course=Cloud%20Platforms&level=5",
    exampleOutput:
      '{"name":"Student One","course":"Cloud Platforms","level":"5"}'
  },
  {
    key: "json_to_keyvalue",
    label: "JSON to key=value",
    description:
      "Emit a JSON object as one 'key=value' line per top-level field. Values are URL-encoded so reserved characters are safe.",
    acceptedExtensions: [".json"],
    exampleInput: '{ "name": "Student One", "city": "Peterborough" }',
    exampleOutput: "name=Student%20One\ncity=Peterborough"
  },
  {
    key: "csv_to_json",
    label: "CSV row to JSON",
    description:
      "Parse a CSV with exactly one header row and one data row into a JSON object. Values remain strings. Quoted fields with commas are handled.",
    acceptedExtensions: [".csv"],
    exampleInput: "name,course,level\nStudent One,Cloud Platforms,5",
    exampleOutput:
      '{"name":"Student One","course":"Cloud Platforms","level":"5"}'
  },
  {
    key: "json_array_to_csv",
    label: "JSON array to CSV",
    description:
      "Emit a JSON array of objects as CSV. Columns are the union of keys in first-seen order. Missing values are left empty. Nested values are JSON-stringified.",
    acceptedExtensions: [".json"],
    exampleInput:
      '[{ "name": "Alice", "score": 10 }, { "name": "Bob", "score": 12 }]',
    exampleOutput: "name,score\nAlice,10\nBob,12\n"
  },
  {
    key: "json_to_html",
    label: "JSON to HTML snippet",
    description:
      "Render a JSON object as an HTML snippet. 'title' becomes an <h1>, 'subtitle' an <h2>, and all other primitive fields become <p><strong>Key:</strong> Value</p> paragraphs. HTML special characters are escaped.",
    acceptedExtensions: [".json"],
    exampleInput: '{ "title": "Hello", "description": "Welcome to the app" }',
    exampleOutput:
      "<h1>Hello</h1>\n<p><strong>Description:</strong> Welcome to the app</p>"
  },
  {
    key: "markdown_to_html",
    label: "Markdown to HTML",
    description:
      "Render Markdown as an HTML snippet. Supports headings, paragraphs, emphasis, code, and lists. The output is snippet HTML without a full page wrapper.",
    acceptedExtensions: [".md", ".markdown", ".txt"],
    exampleInput: "# Title\nThis is a paragraph.",
    exampleOutput: "<h1>Title</h1>\n<p>This is a paragraph.</p>"
  }
];
