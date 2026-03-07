import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function findPackageRoot() {
    let dir = __dirname;
    for (let i = 0; i < 10; i++) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            break;
        dir = parent;
    }
    throw new Error('Could not find package root (no package.json found walking up from ' +
        __dirname +
        '). Is gruai installed correctly?');
}
const REPO_ROOT = findPackageRoot();
const TEMPLATES_DIR = path.join(REPO_ROOT, 'cli', 'templates');
const SKILLS_SRC_DIR = path.join(REPO_ROOT, '.claude', 'skills');
const ALL_SKILLS = ['directive', 'scout', 'healthcheck', 'report'];
function printUpdateHelp() {
    console.log(`
gruai update — Update framework files to the latest version

Usage:
  gruai update [options]

Options:
  --path <path>      Project path (default: current directory)
  --help             Show this help message

Strategy: backup-and-overwrite
  - Backs up existing framework files to .gruai-backup/{timestamp}/
  - Overwrites skill files and CLAUDE.md with latest versions
  - Does NOT overwrite .context/ tree (your data) or agent-registry.json (your team names)

Examples:
  gruai update
  gruai update --path ./my-project
`);
}
function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}
function copyFileSync(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}
function copyDirRecursive(src, dest) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        }
        else {
            copyFileSync(srcPath, destPath);
        }
    }
}
/**
 * Back up a file or directory to the backup dir, preserving relative structure.
 */
function backupPath(filePath, projectPath, backupDir) {
    if (!fs.existsSync(filePath))
        return;
    const relativePath = path.relative(projectPath, filePath);
    const backupTarget = path.join(backupDir, relativePath);
    if (fs.statSync(filePath).isDirectory()) {
        copyDirRecursive(filePath, backupTarget);
    }
    else {
        copyFileSync(filePath, backupTarget);
    }
}
/**
 * Read the existing registry to extract agent names for CLAUDE.md re-rendering.
 */
function readExistingAgents(projectPath) {
    const registryPath = path.join(projectPath, '.claude', 'agent-registry.json');
    try {
        const data = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
        return data.agents
            .filter((a) => a.id !== 'ceo')
            .map((a) => ({
            name: a.name,
            title: a.title,
            role: a.role,
        }));
    }
    catch {
        return [];
    }
}
/**
 * Read the project name from gruai.config.json or CLAUDE.md.
 */
function readProjectName(projectPath) {
    // Try gruai.config.json first
    const configPath = path.join(projectPath, 'gruai.config.json');
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        if (config.name)
            return config.name;
    }
    catch {
        // fall through
    }
    // Try CLAUDE.md header
    const claudePath = path.join(projectPath, 'CLAUDE.md');
    try {
        const content = fs.readFileSync(claudePath, 'utf-8');
        const match = content.match(/^# (.+?) — Claude Code Rules/m);
        if (match)
            return match[1];
    }
    catch {
        // fall through
    }
    return 'My Project';
}
export async function runUpdate(flags) {
    if (flags.help) {
        printUpdateHelp();
        process.exit(0);
    }
    const projectPath = typeof flags.path === 'string' ? path.resolve(flags.path) : process.cwd();
    // Verify this is a gruai project
    const hasRegistry = fs.existsSync(path.join(projectPath, '.claude', 'agent-registry.json'));
    const hasClaudeMd = fs.existsSync(path.join(projectPath, 'CLAUDE.md'));
    const hasConfig = fs.existsSync(path.join(projectPath, 'gruai.config.json'));
    if (!hasRegistry && !hasClaudeMd && !hasConfig) {
        console.error('  Error: This does not appear to be a gruai project.');
        console.error('  Run "gruai init" first to scaffold the framework.');
        process.exit(1);
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = path.join(projectPath, '.gruai-backup', timestamp);
    console.log('\n  gruai update — backup-and-overwrite\n');
    console.log(`  Backup dir: ${backupDir}\n`);
    let backedUp = 0;
    let updated = 0;
    // ─── 1. Back up and update skill files ──────────────────────────────────────
    for (const skill of ALL_SKILLS) {
        const destSkillDir = path.join(projectPath, '.claude', 'skills', skill);
        const srcSkillDir = path.join(SKILLS_SRC_DIR, skill);
        const srcSkillMd = path.join(srcSkillDir, 'SKILL.md');
        if (!fs.existsSync(srcSkillMd))
            continue;
        // Back up existing
        if (fs.existsSync(destSkillDir)) {
            backupPath(destSkillDir, projectPath, backupDir);
            backedUp++;
        }
        // Copy SKILL.md
        copyFileSync(srcSkillMd, path.join(destSkillDir, 'SKILL.md'));
        // Recursively copy docs/ subdirectory if it exists
        const docsDir = path.join(srcSkillDir, 'docs');
        if (fs.existsSync(docsDir) && fs.statSync(docsDir).isDirectory()) {
            copyDirRecursive(docsDir, path.join(destSkillDir, 'docs'));
        }
        updated++;
    }
    console.log(`  [+] Skills:    ${updated} updated`);
    // ─── 2. Back up and re-render CLAUDE.md ─────────────────────────────────────
    const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
    if (fs.existsSync(claudeMdPath)) {
        backupPath(claudeMdPath, projectPath, backupDir);
        backedUp++;
    }
    const projectName = readProjectName(projectPath);
    const agents = readExistingAgents(projectPath);
    const templatePath = path.join(TEMPLATES_DIR, 'CLAUDE.md.template');
    if (fs.existsSync(templatePath) && agents.length > 0) {
        const template = fs.readFileSync(templatePath, 'utf-8');
        const rosterLines = ['| Name | Title | Role |', '|------|-------|------|'];
        rosterLines.push('| (You) | CEO | Chief Executive Officer |');
        for (const agent of agents) {
            rosterLines.push(`| ${agent.name} | ${agent.title} | ${agent.role} |`);
        }
        const rosterTable = rosterLines.join('\n');
        const content = template
            .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
            .replace(/\{\{AGENT_ROSTER\}\}/g, rosterTable);
        fs.writeFileSync(claudeMdPath, content, 'utf-8');
        updated++;
        console.log(`  [+] CLAUDE.md: re-rendered with latest template`);
    }
    else {
        console.log(`  [-] CLAUDE.md: skipped (no template or no agents found)`);
    }
    // ─── 3. Report what was preserved ───────────────────────────────────────────
    console.log(`\n  Preserved (not overwritten):`);
    console.log(`    .context/              (your data)`);
    console.log(`    .claude/agent-registry.json  (your team names)`);
    console.log(`    .claude/agents/*.md    (your personality files)`);
    console.log(`    gruai.config.json      (your configuration)`);
    console.log(`\n  Summary: ${updated} files updated, ${backedUp} backed up`);
    console.log(`  Backup location: ${backupDir}\n`);
}
