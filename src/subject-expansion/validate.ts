import {SUBJECT_EXPANSION_GROUP, SUBJECT_EXPANSION_GROUPS, type SubjectExpansionFunctionArgs, type SubjectExpansionSource, type SubjectExpansionSpec} from "./types";

const fail = (message: string): never => {throw new Error(`subject-expansion: ${message}`);};
const object = (value: unknown, keys: string[], name: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail(`${name} must be an object`);
  const record = value as Record<string, unknown>;
  const extra = Object.keys(record).filter((key) => !keys.includes(key));
  if (extra.length) fail(`${name} does not accept extra fields: ${extra.join(", ")}`);
  const missing = keys.filter((key) => !(key in record));
  if (missing.length) fail(`${name} missing required fields: ${missing.join(", ")}`);
  return record;
};
const text = (value: unknown, max: number, name: string): string => {
  if (typeof value !== "string" || !value.trim() || value.length > max) return fail(`${name} must contain 1-${max} characters`);
  return value.trim();
};
const time = (value: unknown, name: string): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 36000) return fail(`${name} must be a finite time from 0 to 36000`);
  return value;
};

export const assertSubjectExpansionSource = (value: unknown): SubjectExpansionSource => {
  const source = object(value, ["mode", "prompt", "image"], "source");
  if (source.mode === "transparent") {
    if (source.prompt !== null) fail("transparent source.prompt must be null");
    const image = text(source.image, 2000, "source.image");
    // Do not let the host interpret a bare description as an image-generation prompt.
    if (!/^(https?:\/\/|file:\/\/|[A-Za-z]:[\\/]|[./\\])/.test(image) && !/\.(png|webp|svg)$/i.test(image)) {
      fail("transparent source.image must be an image URL or file path, not a prompt");
    }
    return {mode: "transparent", image, prompt: null};
  }
  if (source.mode === "generate") {
    if (source.image !== null) fail("generate source.image must be null");
    return {mode: "generate", prompt: text(source.prompt, 600, "source.prompt"), image: null};
  }
  return fail("source.mode must be transparent or generate");
};

export const assertSubjectExpansionArgs = (value: unknown): SubjectExpansionFunctionArgs => {
  const args = object(value, ["group", "order", "subject", "items", "highlights"], "arguments");
  if (!SUBJECT_EXPANSION_GROUPS.includes(args.group as never)) fail(`group must be ${SUBJECT_EXPANSION_GROUPS.join(" or ")}`);
  if (args.order !== null && (typeof args.order !== "number" || !Number.isInteger(args.order) || args.order < 1 || args.order > 999)) fail("order must be null or an integer from 1 to 999");
  const subject = object(args.subject, ["label", "source"], "subject");
  if (!Array.isArray(args.items) || args.items.length < 2 || args.items.length > 5) fail("items must contain 2-5 items");
  const ids = new Map<string, number>([["subject", 0]]);
  let lastAt = -1;
  const items = (args.items as unknown[]).map((raw, index) => {
    const item = object(raw, ["id", "label", "relation", "source", "at"], `items[${index}]`);
    const id = text(item.id, 40, "item.id");
    if (!/^[a-z][a-z0-9_-]*$/.test(id)) fail("item.id must be a lowercase identifier");
    if (ids.has(id)) fail(`duplicate or reserved item id: ${id}`);
    const at = time(item.at, "item.at");
    if (at < lastAt) fail("items.at must be non-decreasing");
    lastAt = at;
    ids.set(id, at);
    return {id, label: text(item.label, 24, "item.label"), relation: text(item.relation, 24, "item.relation"), source: item.source === null ? null : assertSubjectExpansionSource(item.source), at};
  });
  if (!Array.isArray(args.highlights) || args.highlights.length > 12) fail("highlights must be an array with at most 12 entries");
  lastAt = -1;
  const highlights = (args.highlights as unknown[]).map((raw, index) => {
    const event = object(raw, ["targets", "note", "at"], `highlights[${index}]`);
    const at = time(event.at, "highlight.at");
    if (at <= lastAt) fail("highlights.at must be strictly increasing");
    lastAt = at;
    if (!Array.isArray(event.targets) || event.targets.length < 1 || event.targets.length > 6) fail("highlight.targets must contain 1-6 IDs");
    const targets = (event.targets as unknown[]).map((target) => text(target, 40, "highlight.target"));
    if (new Set(targets).size !== targets.length) fail("highlight.targets must be unique");
    for (const target of targets) {
      if (!ids.has(target)) fail(`unknown highlight target: ${target}`);
      if (ids.get(target)! > at) fail(`highlight target ${target} has not appeared yet`);
    }
    return {targets, note: event.note === null ? null : text(event.note, 48, "highlight.note"), at};
  });
  return {
    group: args.group as SubjectExpansionFunctionArgs["group"], order: args.order as number | null,
    subject: {label: text(subject.label, 24, "subject.label"), source: assertSubjectExpansionSource(subject.source)},
    items, highlights,
  };
};

export const assertSubjectExpansionSpec = (value: unknown): SubjectExpansionSpec => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail("spec must be an object");
  const record = value as Record<string, unknown>;
  object(record, ["subject", "items", "highlights", ...("prepared" in record ? ["prepared"] : [])], "spec");
  const subject = object(record.subject, ["label", "source", "image"], "spec.subject");
  if (!Array.isArray(record.items)) return fail("spec.items must be an array");
  const items = record.items.map((raw, index) => object(raw, ["id", "label", "relation", "source", "at", "image"], `spec.items[${index}]`));
  assertSubjectExpansionArgs({group: SUBJECT_EXPANSION_GROUP, order: null, subject: {label: subject.label, source: subject.source}, items: items.map(({image: _, ...item}) => item), highlights: record.highlights});
  if (record.prepared !== undefined && typeof record.prepared !== "boolean") fail("prepared must be a boolean");
  if (typeof subject.image !== "string" || (record.prepared && !subject.image.trim())) fail("spec.subject.image must be a resolved image when prepared");
  for (const item of items) {
    if (item.source === null && item.image !== null) fail("an item without a source must have image=null");
    if (item.source !== null && (typeof item.image !== "string" || (record.prepared && !item.image.trim()))) fail("an item with a source must have a resolved image when prepared");
  }
  return value as SubjectExpansionSpec;
};
