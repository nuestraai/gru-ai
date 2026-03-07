#!/usr/bin/env node
import { runInit } from './commands/init.js';
import { runUpdate } from './commands/update.js';
const args = process.argv.slice(2);
const command = args[0];
function printUsage() {
    console.log(`
gruai — Autonomous AI company framework

Usage:
  gruai <command> [options]

Commands:
  init      Scaffold gruai into a project
  update    Update framework files to latest version

Options:
  --help  Show this help message

Run 'gruai <command> --help' for command-specific options.
`);
}
function parseFlags(argv) {
    const flags = {};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (!arg.startsWith('--'))
            continue;
        const key = arg.slice(2);
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
            flags[key] = next;
            i++;
        }
        else {
            flags[key] = true;
        }
    }
    return flags;
}
async function main() {
    if (!command || command === '--help' || command === '-h') {
        printUsage();
        process.exit(0);
    }
    const flags = parseFlags(args.slice(1));
    if (command === 'init') {
        await runInit(flags);
    }
    else if (command === 'update') {
        await runUpdate(flags);
    }
    else {
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
}
main().catch((err) => {
    console.error('Fatal error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
});
