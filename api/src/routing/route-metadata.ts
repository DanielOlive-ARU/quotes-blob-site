import { csvToJson } from "../converters/csv-to-json";
import { formToJson } from "../converters/form-to-json";
import { jsonArrayToCsv } from "../converters/json-array-to-csv";
import { jsonToHtml } from "../converters/json-to-html";
import { jsonToKeyvalue } from "../converters/json-to-keyvalue";
import { jsonToText } from "../converters/json-to-text";
import { jsonToXml } from "../converters/json-to-xml";
import { listToJsonArray } from "../converters/list-to-json-array";
import { markdownToHtml } from "../converters/markdown-to-html";
import { xmlToText } from "../converters/xml-to-text";
import type { RouteDefinition, RouteKey } from "./route-types";

export const routeRegistry: Record<RouteKey, RouteDefinition> = {
  json_to_text: jsonToText,
  list_to_json_array: listToJsonArray,
  form_to_json: formToJson,
  json_to_keyvalue: jsonToKeyvalue,
  csv_to_json: csvToJson,
  json_array_to_csv: jsonArrayToCsv,
  json_to_html: jsonToHtml,
  markdown_to_html: markdownToHtml,
  json_to_xml: jsonToXml,
  xml_to_text: xmlToText
};

export function isRouteImplemented(key: string): key is RouteKey {
  return Object.prototype.hasOwnProperty.call(routeRegistry, key);
}

export function getRouteDefinition(key: RouteKey): RouteDefinition | undefined {
  return routeRegistry[key];
}

export function listImplementedRoutes(): RouteDefinition[] {
  return Object.values(routeRegistry);
}
