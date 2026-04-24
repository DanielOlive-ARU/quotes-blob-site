import { jsonToText } from "../converters/json-to-text";
import type { RouteDefinition, RouteKey } from "./route-types";

export const routeRegistry: Partial<Record<RouteKey, RouteDefinition>> = {
  json_to_text: jsonToText
};

export function isRouteImplemented(key: string): key is RouteKey {
  return Object.prototype.hasOwnProperty.call(routeRegistry, key);
}

export function getRouteDefinition(key: RouteKey): RouteDefinition | undefined {
  return routeRegistry[key];
}

export function listImplementedRoutes(): RouteDefinition[] {
  return Object.values(routeRegistry).filter(
    (def): def is RouteDefinition => def !== undefined
  );
}
