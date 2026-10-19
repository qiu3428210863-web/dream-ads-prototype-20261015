import {spawnSync} from 'node:child_process';
console.log('Checking the live page perspective and WebGL showcase renderer.');
const result=spawnSync(process.execPath,['--test','tests/render.test.mjs'],{stdio:'inherit'});
process.exitCode=result.status??1;