import type {EraShiftSpec} from "./types";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const validateItems = (value: unknown, side: string, errors: string[]) => {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) {
    errors.push(`${side}Items must contain 1-8 items`);
    return;
  }
  value.forEach((raw, index) => {
    if (!isRecord(raw)) {
      errors.push(`${side}Items[${index}] must be an object`);
      return;
    }
    if (typeof raw.text !== "string" || !raw.text.trim() || raw.text.length > 80) {
      errors.push(`${side}Items[${index}].text must be a non-empty string of at most 80 characters`);
    }
    if (raw.logo !== undefined && (typeof raw.logo !== "string" || !raw.logo.trim() || raw.logo.length > 240)) {
      errors.push(`${side}Items[${index}].logo must be a non-empty string of at most 240 characters`);
    }
  });
};

const validateForeground = (value: unknown, errors: string[]) => {
  if (!isRecord(value)) {
    errors.push("foreground must be an object");
    return;
  }
  const mode = value.mode;
  if (mode !== "existing" && mode !== "generate") {
    errors.push("foreground.mode must be existing or generate");
  }
  const image = value.image;
  if (mode === "existing") {
    if (typeof image !== "string" || !image.trim() || image.length > 240) {
      errors.push("foreground.image must be a non-empty string of at most 240 characters in existing mode");
    }
  } else if (image !== null) {
    errors.push("foreground.image must be null in generate mode");
  }

  const person = value.person;
  if (mode === "generate") {
    if (typeof person !== "string" || !person.trim() || person.length > 160) {
      errors.push("foreground.person must be a non-empty string of at most 160 characters in generate mode");
    }
  } else if (person !== null) {
    errors.push("foreground.person must be null in existing mode");
  }

  if (!Array.isArray(value.references) || value.references.length > 3 || (mode === "generate" && value.references.length < 1)) {
    errors.push(mode === "generate"
      ? "foreground.references must contain 1-3 image URLs in generate mode"
      : "foreground.references must be an empty array in existing mode");
    return;
  }
  if (mode === "existing" && value.references.length !== 0) {
    errors.push("foreground.references must be an empty array in existing mode");
  }
  value.references.forEach((reference, index) => {
    if (typeof reference !== "string" || !reference.trim() || reference.length > 2000) {
      errors.push(`foreground.references[${index}] must be a non-empty string of at most 2000 characters`);
    }
  });
};

export const validateEraShiftSpec = (input: unknown): string[] => {
  if (!isRecord(input)) return ["spec must be an object"];
  const errors: string[] = [];
  if (typeof input.image !== "string" || input.image.length > 2000) {
    errors.push("image must be a string of at most 2000 characters");
  }
  if (input.foreground === undefined) {
    // Older runtime specs carried only image; keep them readable while all new
    // Function Calls use the explicit foreground selection object.
    if (typeof input.image === "string" && !input.image.trim()) errors.push("image must be non-empty");
  } else {
    validateForeground(input.foreground, errors);
    if (isRecord(input.foreground) && input.foreground.mode === "existing" && typeof input.image === "string" && !input.image.trim()) {
      errors.push("image must be non-empty in existing mode");
    }
  }
  if (typeof input.switchAt !== "number" || !Number.isFinite(input.switchAt) || input.switchAt < 0) {
    errors.push("switchAt must be a non-negative finite number");
  }
  validateItems(input.startItems, "start", errors);
  validateItems(input.endItems, "end", errors);
  return errors;
};

export const assertEraShiftSpec = (input: unknown): EraShiftSpec => {
  const errors = validateEraShiftSpec(input);
  if (errors.length) throw new Error(`Invalid EraShiftSpec:\n- ${errors.join("\n- ")}`);
  return input as EraShiftSpec;
};
