import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createReadStream} from 'node:fs';

export const fileSha256 = async (file) => {
  const hash=createHash('sha256');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
};
export const payloadFingerprint = async (root) => {
  const files=[];
  const visit=async(directory)=>{
    for(const entry of await fs.readdir(directory,{withFileTypes:true})){
      const target=path.join(directory,entry.name);
      if(entry.isDirectory())await visit(target);
      else if(entry.isFile())files.push(target);
    }
  };
  await visit(root);files.sort();
  const hash=createHash('sha256');
  for(const file of files)hash.update(path.relative(root,file).replaceAll(path.sep,'/')+'\0'+await fileSha256(file)+'\0');
  return {sha256:hash.digest('hex'),files:files.length};
};
/** Call only after makensis has returned exit code zero and the complete EXE was published. */
export const writePackReceipt = async ({installer,payloadRoot,compilerExitCode}) => {
  if(compilerExitCode!==0)throw new Error('A successful NSIS compiler result is required.');
  const manifest=JSON.parse(await fs.readFile(path.join(payloadRoot,'manifest.json'),'utf8'));
  const receipt={version:manifest.version,protocolVersion:manifest.protocolVersion,compilerExitCode,
    installerBytes:(await fs.stat(installer)).size,installerSha256:await fileSha256(installer),
    payload:await payloadFingerprint(payloadRoot),createdAt:new Date().toISOString()};
  const target=installer+'.receipt.json',next=target+'.next';
  await fs.writeFile(next,JSON.stringify(receipt,null,2));await fs.rename(next,target);
  return receipt;
};
