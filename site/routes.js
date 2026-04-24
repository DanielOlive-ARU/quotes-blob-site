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
  }
];
