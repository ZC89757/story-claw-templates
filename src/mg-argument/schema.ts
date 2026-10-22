import type {FunctionCallTiming} from "../function-call";
import {closedObject, envelopeFields, functionAtSchema, listField, localEventTime, orderedTimes, readEnvelope, readList, readText, recordOf, textField} from "../authoring-contract";
export type ArgumentSpec = {title: string; claims: {premise: string; conclusion: string; missingEvidence: string[]; at: number}[]};
export const argumentParametersSchema = closedObject({
  ...envelopeFields(["evidence-gap"]), title: textField(),
  claims: listField(closedObject({premise: textField(60), conclusion: textField(60), missingEvidence: listField(textField(32), 1, 4), at: functionAtSchema}), 1, 4),
});
export const argumentFunctionDefinition = {type: "function", name: "create_evidence_gap", strict: true, parameters: argumentParametersSchema,
  description: "表达一个前提尚不足以直接推出结论，以及缺少哪些证据。claims 在绝对 at 切换，前项缩为记录；连线停在证据缺口。missingEvidence 是需要检验的证据类别，不能捏造已有数据，不用红叉把未知宣判为假，不代表现实中增长或租金为零。不是两个主体的普通对比。"} as const;
export const resolveArgumentFunctionArgs = (input: unknown, timing: FunctionCallTiming) => {
  const envelope = readEnvelope(input, timing, ["evidence-gap"]);
  const r = recordOf(input, ["group", "order", "title", "claims"], "mg-argument");
  const claims = readList(r.claims, "claims", 1, 4).map((raw) => {
    const c = recordOf(raw, ["premise", "conclusion", "missingEvidence", "at"], "claim");
    return {premise: readText(c.premise, "premise", 60), conclusion: readText(c.conclusion, "conclusion", 60), missingEvidence: readList(c.missingEvidence, "missingEvidence", 1, 4).map((v) => readText(v, "evidence", 32)), at: localEventTime(c.at, timing)};
  }); orderedTimes(claims, true);
  return {...envelope, spec: {title: readText(r.title, "title"), claims} satisfies ArgumentSpec};
};
