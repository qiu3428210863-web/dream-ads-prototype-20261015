// Backward-compatible command: v1.11 uses a live SVG lens, with no GPU shader compiler dependency.
import {spawnSync} from 'node:child_process';
console.log('The renderer now uses the live viewport lens. Running lens checks.');
const result=spawnSync(process.execPath,['--test','tests/lens.test.mjs'],{stdio:'inherit'});
process.exitCode=result.status??1;
