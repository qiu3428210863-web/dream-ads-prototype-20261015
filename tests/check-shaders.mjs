import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import vm from 'node:vm';

// Validate the actual embedded shaders as GLSL ES 1.00, rather than only parsing the JS wrapper.
const source=readFileSync(new URL('../dist/crt.js',import.meta.url),'utf8');
const compiler=process.env.GLSLANG_VALIDATOR||resolve('.tools/glslang/bin/glslang.exe');
if(!existsSync(compiler))throw Error('Set GLSLANG_VALIDATOR to a Khronos glslang executable. See docs/v1.10-changes.md.');
const directory=resolve('.tools/shader-check');mkdirSync(directory,{recursive:true});
const vertex=source.match(/const vertex='([^']+)'/)[1];
const template=source.match(/const fragment=`([\s\S]*?)`;/)[1];
const curve=Number(source.match(/CURVE=([.\d]+)/)[1]);
const fragment=vm.runInNewContext('`'+template+'`',{cards:{length:6},CURVE:curve});
const vertexPath=resolve(directory,'crt.vert'),fragmentPath=resolve(directory,'crt.frag');
writeFileSync(vertexPath,'#version 100\n'+vertex);writeFileSync(fragmentPath,'#version 100\n'+fragment);
process.stdout.write(execFileSync(compiler,['-l',vertexPath,fragmentPath],{encoding:'utf8'}));
console.log('GLSL ES 1.00 vertex/fragment compilation and linking passed.');
