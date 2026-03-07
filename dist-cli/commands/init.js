import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// ─── Path resolution ───────────────────────────────────────────────────────────
// Walk up from the current file to find the package root (directory containing package.json).
// Works whether running from cli/commands/ (tsx dev) or dist-cli/commands/ (compiled npm install).
function findPackageRoot() {
    let dir = __dirname;
    for (let i = 0; i < 10; i++) {
        if (fs.existsSync(path.join(dir, 'package.json'))) {
            return dir;
        }
        const parent = path.dirname(dir);
        if (parent === dir)
            break; // reached filesystem root
        dir = parent;
    }
    throw new Error('Could not find package root (no package.json found walking up from ' +
        __dirname +
        '). Is gruai installed correctly?');
}
const REPO_ROOT = findPackageRoot();
const TEMPLATES_DIR = path.join(REPO_ROOT, 'cli', 'templates');
const SKILLS_SRC_DIR = path.join(REPO_ROOT, '.claude', 'skills');
const ROLE_TEMPLATES_DIR = path.join(TEMPLATES_DIR, 'agent-roles');
const ROLE_DEFINITIONS = [
    {
        id: 'cto',
        role: 'Chief Technology Officer',
        title: 'CTO',
        description: 'Architecture, security, code quality, technology intelligence',
        templateFile: 'cto.md',
        isCsuite: true,
        reportsTo: 'ceo',
        domains: ['Architecture', 'Security', 'Code Quality', 'Tech Intelligence'],
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/15',
        borderColor: 'border-violet-500/40',
        dotColor: 'bg-violet-500',
    },
    {
        id: 'coo',
        role: 'Chief Operating Officer',
        title: 'COO',
        description: 'Orchestration, planning, casting, ecosystem intelligence',
        templateFile: 'coo.md',
        isCsuite: true,
        reportsTo: 'ceo',
        domains: ['Planning', 'Casting', 'Sequencing', 'Ecosystem Intelligence'],
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/15',
        borderColor: 'border-emerald-500/40',
        dotColor: 'bg-emerald-500',
    },
    {
        id: 'cpo',
        role: 'Chief Product Officer',
        title: 'CPO',
        description: 'Product strategy, UX, feature prioritization, market intelligence',
        templateFile: 'cpo.md',
        isCsuite: true,
        reportsTo: 'ceo',
        domains: ['Product Strategy', 'UX', 'Prioritization', 'Market Intelligence'],
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/15',
        borderColor: 'border-blue-500/40',
        dotColor: 'bg-blue-500',
    },
    {
        id: 'cmo',
        role: 'Chief Marketing Officer',
        title: 'CMO',
        description: 'Growth, SEO, positioning, growth intelligence',
        templateFile: 'cmo.md',
        isCsuite: true,
        reportsTo: 'ceo',
        domains: ['Growth', 'SEO', 'Positioning', 'Growth Intelligence'],
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/15',
        borderColor: 'border-amber-500/40',
        dotColor: 'bg-amber-500',
    },
    {
        id: 'frontend',
        role: 'Frontend Developer',
        title: 'FE',
        description: 'React, Tailwind, component architecture, UI implementation',
        templateFile: 'frontend.md',
        isCsuite: false,
        reportsTo: 'cto',
        domains: ['React', 'Tailwind', 'Components', 'UI'],
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/15',
        borderColor: 'border-pink-500/40',
        dotColor: 'bg-pink-500',
    },
    {
        id: 'backend',
        role: 'Backend Developer',
        title: 'BE',
        description: 'Server, API, database, infrastructure implementation',
        templateFile: 'backend.md',
        isCsuite: false,
        reportsTo: 'cto',
        domains: ['Server', 'API', 'Database', 'Infra'],
        color: 'text-teal-400',
        bgColor: 'bg-teal-500/15',
        borderColor: 'border-teal-500/40',
        dotColor: 'bg-teal-500',
    },
    {
        id: 'fullstack',
        role: 'Full-Stack Engineer',
        title: 'FS',
        description: 'Cross-domain work spanning frontend and backend',
        templateFile: 'fullstack.md',
        isCsuite: false,
        reportsTo: 'cto',
        domains: ['Full-Stack', 'Cross-Domain'],
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/15',
        borderColor: 'border-indigo-500/40',
        dotColor: 'bg-indigo-500',
    },
    {
        id: 'data',
        role: 'Data Engineer',
        title: 'DE',
        description: 'Data pipelines, indexing, state management, parsers',
        templateFile: 'data.md',
        isCsuite: false,
        reportsTo: 'cto',
        domains: ['Pipelines', 'Indexing', 'State', 'Parsers'],
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/15',
        borderColor: 'border-cyan-500/40',
        dotColor: 'bg-cyan-500',
    },
    {
        id: 'qa',
        role: 'QA Engineer',
        title: 'QA',
        description: 'Testing, validation, quality assurance, edge cases',
        templateFile: 'qa.md',
        isCsuite: false,
        reportsTo: 'cto',
        domains: ['Testing', 'Validation', 'QA', 'Edge Cases'],
        color: 'text-lime-400',
        bgColor: 'bg-lime-500/15',
        borderColor: 'border-lime-500/40',
        dotColor: 'bg-lime-500',
    },
    {
        id: 'design',
        role: 'UI/UX Designer',
        title: 'UX',
        description: 'UI design, design review, wireframes, visual consistency, usability',
        templateFile: 'design.md',
        isCsuite: false,
        reportsTo: 'cpo',
        domains: ['UI Design', 'UX', 'Wireframes', 'Visual Review'],
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/15',
        borderColor: 'border-rose-500/40',
        dotColor: 'bg-rose-500',
    },
    {
        id: 'content',
        role: 'Content Builder',
        title: 'CB',
        description: 'MDX, copywriting, SEO content, documentation',
        templateFile: 'content.md',
        isCsuite: false,
        reportsTo: 'cmo',
        domains: ['MDX', 'Copywriting', 'SEO Content', 'Docs'],
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/15',
        borderColor: 'border-orange-500/40',
        dotColor: 'bg-orange-500',
    },
];
const ALL_SKILLS = ['directive', 'scout', 'healthcheck', 'report'];
// ─── Name generation ────────────────────────────────────────────────────────────
const FIRST_NAMES = [
    'Aiden', 'Alex', 'Amara', 'Aria', 'Avery', 'Blake', 'Cameron', 'Carmen',
    'Casey', 'Charlie', 'Clara', 'Dana', 'Devon', 'Elena', 'Elias', 'Emery',
    'Ethan', 'Finley', 'Harper', 'Hayden', 'Iris', 'Jade', 'Jamie', 'Jordan',
    'Kai', 'Kenji', 'Layla', 'Leo', 'Lina', 'Logan', 'Luna', 'Mara', 'Marco',
    'Maya', 'Mika', 'Morgan', 'Nadia', 'Nico', 'Nina', 'Noah', 'Nora', 'Oliver',
    'Priya', 'Quinn', 'Ravi', 'Reese', 'Riley', 'River', 'Robin', 'Rowan',
    'Sage', 'Sam', 'Sara', 'Sasha', 'Skyler', 'Sol', 'Talia', 'Taylor', 'Theo',
    'Valentina', 'Yuki', 'Zara', 'Zion',
];
const LAST_NAMES = [
    'Andersen', 'Bauer', 'Blake', 'Castillo', 'Chen', 'Cohen', 'Cruz', 'Davis',
    'Diaz', 'Ellis', 'Fischer', 'Garcia', 'Goldberg', 'Grant', 'Gupta', 'Hayes',
    'Huang', 'Ibrahim', 'Ishikawa', 'Jensen', 'Kaplan', 'Kim', 'Kumar', 'Laurent',
    'Lee', 'Lin', 'Lopez', 'Malik', 'Morales', 'Muller', 'Nakamura', 'Novak',
    'Okafor', 'Park', 'Patel', 'Perez', 'Quinn', 'Rao', 'Reeves', 'Rivera',
    'Robinson', 'Santos', 'Sato', 'Sharma', 'Silva', 'Singh', 'Tanaka', 'Torres',
    'Volkov', 'Wang', 'Weber', 'Williams', 'Wu', 'Yamamoto', 'Zhang',
];
function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
function generateUniqueName(usedFirstNames) {
    let first;
    let attempts = 0;
    do {
        first = pickRandom(FIRST_NAMES);
        attempts++;
    } while (usedFirstNames.has(first) && attempts < 100);
    usedFirstNames.add(first);
    const last = pickRandom(LAST_NAMES);
    return { first, last };
}
// ─── Helpers ────────────────────────────────────────────────────────────────────
function printInitHelp() {
    console.log(`
gruai init — Scaffold the gruai framework into a project

Usage:
  gruai init [options]

Options:
  --name <name>      Project name (prompted if omitted)
  --path <path>      Project path (default: current directory)
  --yes              Skip confirmations
  --help             Show this help message

Examples:
  gruai init
  gruai init --name "My Project" --path ./my-project
  gruai init --name "My App" --yes
`);
}
function ask(rl, question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer.trim()));
    });
}
async function promptConfig(flags) {
    const projectPath = typeof flags.path === 'string' ? path.resolve(flags.path) : process.cwd();
    // If project name is provided, skip interactive mode entirely
    if (typeof flags.name === 'string') {
        return { projectName: flags.name, projectPath };
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    try {
        console.log('\n  gruai — Project Setup\n');
        const projectName = await ask(rl, '  Project name: ');
        if (!projectName) {
            console.error('  Error: Project name is required.');
            process.exit(1);
        }
        if (!flags.yes) {
            console.log(`\n  Configuration:`);
            console.log(`    Name:  ${projectName}`);
            console.log(`    Path:  ${projectPath}`);
            const confirm = await ask(rl, `\n  Proceed? (Y/n): `);
            if (confirm.toLowerCase() === 'n') {
                console.log('  Cancelled.');
                process.exit(0);
            }
        }
        return { projectName, projectPath };
    }
    finally {
        rl.close();
    }
}
function ensureDir(dirPath) {
    fs.mkdirSync(dirPath, { recursive: true });
}
function writeFile(filePath, content) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf-8');
}
function copyFileSync(src, dest) {
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
}
/**
 * Recursively copy a directory tree from src to dest.
 */
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
function generateAgents() {
    const usedFirstNames = new Set();
    const agents = [];
    for (const roleDef of ROLE_DEFINITIONS) {
        const { first, last } = generateUniqueName(usedFirstNames);
        const fullName = `${first} ${last}`;
        const agentFileBase = `${first.toLowerCase()}-${roleDef.id}`;
        // For reportsTo, we need to resolve the role id to the generated agent's id (first name lowercase)
        // We'll do a second pass for this below.
        agents.push({
            id: first.toLowerCase(),
            name: fullName,
            firstName: first,
            title: roleDef.title,
            role: roleDef.role,
            description: roleDef.description,
            agentFile: `${agentFileBase}.md`,
            reportsTo: roleDef.reportsTo, // role-based for now, resolved below
            domains: roleDef.domains,
            color: roleDef.color,
            bgColor: roleDef.bgColor,
            borderColor: roleDef.borderColor,
            dotColor: roleDef.dotColor,
            isCsuite: roleDef.isCsuite,
        });
    }
    // Resolve reportsTo from role id (e.g. 'cto') to generated agent id
    const roleToId = new Map();
    for (let i = 0; i < ROLE_DEFINITIONS.length; i++) {
        roleToId.set(ROLE_DEFINITIONS[i].id, agents[i].id);
    }
    for (const agent of agents) {
        if (agent.reportsTo && agent.reportsTo !== 'ceo') {
            agent.reportsTo = roleToId.get(agent.reportsTo) ?? agent.reportsTo;
        }
    }
    return agents;
}
function generateRegistryJson(agents) {
    const ceoEntry = {
        id: 'ceo',
        name: 'CEO',
        title: 'CEO',
        role: 'Chief Executive Officer',
        description: 'Sets direction, reviews proposals, approves work',
        agentFile: null,
        reportsTo: null,
        domains: ['Strategy', 'Direction', 'Approval'],
        color: 'text-foreground',
        bgColor: 'bg-foreground/10',
        borderColor: 'border-foreground/30',
        dotColor: 'bg-foreground',
        isCsuite: true,
    };
    const agentEntries = agents.map((a) => ({
        id: a.id,
        name: a.name,
        title: a.title,
        role: a.role,
        description: a.description,
        agentFile: a.agentFile,
        reportsTo: a.reportsTo,
        domains: a.domains,
        color: a.color,
        bgColor: a.bgColor,
        borderColor: a.borderColor,
        dotColor: a.dotColor,
        isCsuite: a.isCsuite,
    }));
    const registry = {
        agents: [ceoEntry, ...agentEntries],
        teams: buildTeams(agents),
    };
    return JSON.stringify(registry, null, 2);
}
function buildTeams(agents) {
    const ctoAgent = agents.find((a) => a.title === 'CTO');
    const cpoAgent = agents.find((a) => a.title === 'CPO');
    const cmoAgent = agents.find((a) => a.title === 'CMO');
    const cooAgent = agents.find((a) => a.title === 'COO');
    const teams = [];
    if (ctoAgent) {
        const engineeringMembers = agents
            .filter((a) => a.reportsTo === ctoAgent.id || a.id === ctoAgent.id)
            .map((a) => a.id);
        teams.push({
            id: 'engineering',
            name: 'Engineering',
            description: 'Architecture, backend, data, full-stack engineering',
            leadAgentId: ctoAgent.id,
            memberAgentIds: engineeringMembers,
            color: 'text-violet-400',
            bgColor: 'bg-violet-500/10',
            borderColor: 'border-violet-500/30',
        });
    }
    if (cpoAgent) {
        const productMembers = agents
            .filter((a) => a.reportsTo === cpoAgent.id || a.id === cpoAgent.id)
            .map((a) => a.id);
        teams.push({
            id: 'product',
            name: 'Product',
            description: 'Frontend, UX, quality assurance',
            leadAgentId: cpoAgent.id,
            memberAgentIds: productMembers,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/30',
        });
    }
    if (cmoAgent) {
        const growthMembers = agents
            .filter((a) => a.reportsTo === cmoAgent.id || a.id === cmoAgent.id)
            .map((a) => a.id);
        teams.push({
            id: 'growth',
            name: 'Growth',
            description: 'Content, SEO, marketing, positioning',
            leadAgentId: cmoAgent.id,
            memberAgentIds: growthMembers,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/30',
        });
    }
    if (cooAgent) {
        teams.push({
            id: 'operations',
            name: 'Operations',
            description: 'Planning, orchestration, execution',
            leadAgentId: cooAgent.id,
            memberAgentIds: [cooAgent.id],
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/30',
        });
    }
    return teams;
}
function generatePersonalityFile(agent) {
    // The template file name is just the role part (e.g. 'cto.md', 'backend.md')
    const roleId = ROLE_DEFINITIONS.find((r) => r.title === agent.title)?.id;
    const actualTemplatePath = path.join(ROLE_TEMPLATES_DIR, `${roleId}.md`);
    if (!fs.existsSync(actualTemplatePath)) {
        return `# ${agent.name} — ${agent.role}\n\nRole template not found.\n`;
    }
    let content = fs.readFileSync(actualTemplatePath, 'utf-8');
    content = content.replace(/\{\{NAME\}\}/g, agent.name);
    content = content.replace(/\{\{FIRST_NAME\}\}/g, agent.firstName);
    content = content.replace(/\{\{FIRST_NAME_LOWER\}\}/g, agent.firstName.toLowerCase());
    return content;
}
// ─── Scaffolding functions ──────────────────────────────────────────────────────
function scaffoldAgents(projectPath, agents) {
    const destDir = path.join(projectPath, '.claude', 'agents');
    let count = 0;
    for (const agent of agents) {
        const content = generatePersonalityFile(agent);
        writeFile(path.join(destDir, agent.agentFile), content);
        count++;
    }
    return count;
}
function scaffoldRegistry(projectPath, agents) {
    const registryJson = generateRegistryJson(agents);
    writeFile(path.join(projectPath, '.claude', 'agent-registry.json'), registryJson);
}
function scaffoldSkills(projectPath) {
    const destDir = path.join(projectPath, '.claude', 'skills');
    let count = 0;
    for (const skill of ALL_SKILLS) {
        const skillDir = path.join(SKILLS_SRC_DIR, skill);
        const skillMd = path.join(skillDir, 'SKILL.md');
        if (!fs.existsSync(skillMd)) {
            console.warn(`  Warning: Skill file not found: ${skill}/SKILL.md (skipped)`);
            continue;
        }
        // Copy SKILL.md
        copyFileSync(skillMd, path.join(destDir, skill, 'SKILL.md'));
        // Recursively copy docs/ subdirectory if it exists
        const docsDir = path.join(skillDir, 'docs');
        if (fs.existsSync(docsDir) && fs.statSync(docsDir).isDirectory()) {
            copyDirRecursive(docsDir, path.join(destDir, skill, 'docs'));
        }
        count++;
    }
    return count;
}
function scaffoldContext(projectPath, config) {
    const contextDir = path.join(projectPath, '.context');
    // Vision template
    const visionTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'vision.md'), 'utf-8');
    const vision = visionTemplate.replace(/\{\{PROJECT_NAME\}\}/g, config.projectName);
    writeFile(path.join(contextDir, 'vision.md'), vision);
    // Lessons directory
    const lessonsTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'lessons.md'), 'utf-8');
    const lessons = lessonsTemplate.replace(/\{\{PROJECT_NAME\}\}/g, config.projectName);
    writeFile(path.join(contextDir, 'lessons', 'index.md'), lessons);
    // Empty directories with .gitkeep
    const emptyDirs = [
        path.join(contextDir, 'directives'),
        path.join(contextDir, 'reports'),
        path.join(contextDir, 'intel'),
    ];
    for (const dir of emptyDirs) {
        ensureDir(dir);
        const gitkeep = path.join(dir, '.gitkeep');
        if (!fs.existsSync(gitkeep)) {
            fs.writeFileSync(gitkeep, '', 'utf-8');
        }
    }
    // Preferences
    writeFile(path.join(contextDir, 'preferences.md'), `# CEO Preferences\n\n> Standing orders for the team. Agents read this before every task.\n\n## Standing Orders\n\n- (Add your preferences here)\n`);
    // Backlog
    const backlogTemplate = fs.readFileSync(path.join(TEMPLATES_DIR, 'backlog.json.template'), 'utf-8');
    writeFile(path.join(contextDir, 'backlog.json'), backlogTemplate);
}
function scaffoldClaudeMd(projectPath, config, agents) {
    const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'CLAUDE.md.template'), 'utf-8');
    // Build agent roster table
    const rosterLines = ['| Name | Title | Role |', '|------|-------|------|'];
    rosterLines.push('| (You) | CEO | Chief Executive Officer |');
    for (const agent of agents) {
        rosterLines.push(`| ${agent.name} | ${agent.title} | ${agent.role} |`);
    }
    const rosterTable = rosterLines.join('\n');
    let content = template
        .replace(/\{\{PROJECT_NAME\}\}/g, config.projectName)
        .replace(/\{\{AGENT_ROSTER\}\}/g, rosterTable);
    writeFile(path.join(projectPath, 'CLAUDE.md'), content);
}
function scaffoldGruaiConfig(projectPath, config, agents) {
    const template = fs.readFileSync(path.join(TEMPLATES_DIR, 'gruai.config.json.template'), 'utf-8');
    const agentsJson = JSON.stringify(agents.map((a) => ({ id: a.id, name: a.name, role: a.title })), null, 4);
    // Indent the agents JSON to align with the template's indentation
    const indentedAgentsJson = agentsJson
        .split('\n')
        .map((line, i) => (i === 0 ? line : '  ' + line))
        .join('\n');
    const content = template
        .replace(/\{\{PROJECT_NAME\}\}/g, config.projectName)
        .replace(/\{\{AGENTS_JSON\}\}/g, indentedAgentsJson);
    writeFile(path.join(projectPath, 'gruai.config.json'), content);
}
// ─── Main entry point ───────────────────────────────────────────────────────────
export async function runInit(flags) {
    if (flags.help) {
        printInitHelp();
        process.exit(0);
    }
    const config = await promptConfig(flags);
    // Validate project path
    if (!fs.existsSync(config.projectPath)) {
        console.error(`  Error: Project path does not exist: ${config.projectPath}`);
        process.exit(1);
    }
    console.log('\n  Scaffolding gruai...\n');
    // Generate agents with random names
    const agents = generateAgents();
    // 1. Generate agent-registry.json
    scaffoldRegistry(config.projectPath, agents);
    console.log(`  [+] Registry:      .claude/agent-registry.json (${agents.length} agents)`);
    // 2. Generate personality files from role templates
    const agentCount = scaffoldAgents(config.projectPath, agents);
    console.log(`  [+] Agents:        ${agentCount} personality files`);
    // 3. Copy skill files (with docs/ subdirs)
    const skillCount = scaffoldSkills(config.projectPath);
    console.log(`  [+] Skills:        ${skillCount} skill definitions`);
    // 4. Scaffold context tree
    scaffoldContext(config.projectPath, config);
    console.log(`  [+] Context:       vision.md, lessons/, directives/, backlog.json`);
    // 5. Generate CLAUDE.md
    scaffoldClaudeMd(config.projectPath, config, agents);
    console.log(`  [+] CLAUDE.md:     project rules with agent roster`);
    // 6. Generate gruai.config.json
    scaffoldGruaiConfig(config.projectPath, config, agents);
    console.log(`  [+] Config:        gruai.config.json`);
    // Output next steps
    console.log(`
  Done! gruai scaffolded into: ${config.projectPath}

  Your team:
`);
    for (const agent of agents) {
        const csuite = agent.isCsuite ? ' (C-suite)' : '';
        console.log(`    ${agent.name.padEnd(22)} ${agent.title.padEnd(5)} ${agent.role}${csuite}`);
    }
    console.log(`
  Next steps:

  1. Edit your project vision:
     ${path.join(config.projectPath, '.context', 'vision.md')}

  2. Set your preferences (standing orders for the team):
     ${path.join(config.projectPath, '.context', 'preferences.md')}

  3. Create your first directive:
     gruai directive my-first-task
     (or manually: mkdir -p .context/directives/my-task && create directive.json + directive.md)

  4. Run it through the pipeline:
     claude -p "/directive my-first-task"

  5. Update framework files later:
     gruai update

  Happy orchestrating!
`);
}
