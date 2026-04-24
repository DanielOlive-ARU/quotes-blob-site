window.ROUTES = [
  {
    key: "json_to_text",
    label: "JSON to plain text",
    description:
      "Flatten a JSON object into one 'Key: Value' line per top-level field. Nested values are JSON-stringified.",
    acceptedExtensions: [".json"],
    exampleInput: '{ "name": "Student One", "course": "Cloud Platforms", "level": 5 }',
    exampleOutput: "Name: Student One\nCourse: Cloud Platforms\nLevel: 5"
  }
];
