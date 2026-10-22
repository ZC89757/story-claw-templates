import {assertFunctionEnvelope,functionOrderSchema,type FunctionCallTiming} from "../function-call";
export type ImagePlateSpec={image:string;caption:string|null;prepared?:boolean};
export const imagePlateFunctionDefinition={
  type:"function",name:"create_image_plate",strict:true,
  description:"Create a static full-frame photograph background. It never zooms, pans or animates. Nest a transparent cutout-cue overlay for people or logos. Supply an accurate local or direct image URL and an optional short factual caption.",
  parameters:{type:"object",additionalProperties:false,required:["group","order","image","caption"],properties:{group:{type:"string",enum:["company","company-landscape"]},order:functionOrderSchema,image:{type:"string",minLength:1,maxLength:2000},caption:{anyOf:[{type:"string",minLength:1,maxLength:60},{type:"null"}]}}},
} as const;
export const assertImagePlateSpec=(input:unknown):ImagePlateSpec=>{
  const spec=input as ImagePlateSpec;
  if(!spec||typeof spec.image!=="string"||!spec.image.trim()||spec.image.length>2000)throw new Error("image-plate requires an image");
  if(spec.caption!==null&&(typeof spec.caption!=="string"||!spec.caption.trim()||spec.caption.length>60))throw new Error("invalid image-plate caption");
  return spec;
};
export const resolveImagePlateFunctionArgs=(input:unknown,timing:FunctionCallTiming)=>{
  const envelope=assertFunctionEnvelope(input,timing),value=input as ImagePlateSpec;
  if(!["company","company-landscape"].includes(envelope.group)||Object.keys(input as object).some(k=>!["group","order","image","caption"].includes(k)))throw new Error("invalid image-plate arguments");
  return {...envelope,spec:assertImagePlateSpec({image:value.image,caption:value.caption})};
};
