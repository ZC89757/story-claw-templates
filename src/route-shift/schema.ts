import type {FunctionCallTiming} from "../function-call";
import {assertFunctionEnvelope, functionAtSchema, functionGroupSchema, functionOrderSchema, toLocalAt, type FunctionCallEnvelope, type ResolvedFunctionCall} from "../function-call";
import {assertRouteShiftSpec} from "./validate";
import type {RouteShiftFunctionArgs, RouteShiftSpec} from "./types";

export const routeShiftParametersSchema = {type: "object", additionalProperties: false, required: ["group", "order", "title", "first", "second", "switchTime", "switch"], properties: {group: functionGroupSchema, order: functionOrderSchema, title: {type: "string", minLength: 1, maxLength: 100}, first: {type: "string", minLength: 1, maxLength: 100, description: "The route or direction occupied at the beginning."}, second: {type: "string", minLength: 1, maxLength: 100, description: "The route or direction occupied after the switch."}, switchTime: {...functionAtSchema, description: "Absolute time when movement from First to Second begins."}, switch: {type: "string", minLength: 1, maxLength: 100, description: "Short text shown at the switching point, stating the switch action or destination."}}} as const;
export const routeShiftFunctionDefinition = {type: "function", name: "create_route_shift", description: "Create one fixed two-road route switch scene. First is the starting route and Second is the later route. At Switch time, animate the marker leaving First, crossing the junction, and settling on Second while showing the supplied Switch text. Do not supply route items or evidence lists; road geometry, colors, motion, background and sound design are fixed by the template.", strict: true, parameters: routeShiftParametersSchema} as const;
export const resolveRouteShiftFunctionArgs = (input: RouteShiftFunctionArgs & FunctionCallEnvelope, timing: FunctionCallTiming): ResolvedFunctionCall<RouteShiftSpec> => {
  const envelope = assertFunctionEnvelope(input, timing);
  const spec = assertRouteShiftSpec({title: input.title, first: input.first, second: input.second, switchTime: toLocalAt(input.switchTime, envelope.at), switch: input.switch});
  return {...envelope, spec};
};
