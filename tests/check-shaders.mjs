// Backward-compatible command name. It checks the SVG lens and WebGL source contract;
// it does not compile the embedded GLSL or claim cross-browser visual verification.
import {spawnSync} from 'node:child_process';
console.log('Checking the SVG viewport lens and analytic WebGL showcase renderer.');
const result=spawnSync(process.execPath,['--test','tests/lens.test.mjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
