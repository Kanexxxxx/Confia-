import './sites-env.mjs';
import { spawn } from 'node:child_process';
const args=process.argv.slice(2);
const port=args[args.indexOf('--port')+1] || '4173';
const child=spawn(process.execPath,['./node_modules/wrangler/bin/wrangler.js','dev','--config','dist/server/wrangler.json','--local','--persist-to','.wrangler/state','--ip','0.0.0.0','--port',port,'--inspector-port','0'],{stdio:'inherit',env:process.env});
child.on('exit',code=>process.exit(code??1));
