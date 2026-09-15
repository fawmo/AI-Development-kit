#!/usr/bin/env node

/**
 * AI Development Kit - Smart Git Sync & AI Categorization Engine
 * 
 * Analyzes commit inputs, changed files, and raw text to automatically
 * determine which repository folder and .md file the content belongs to.
 * 
 * Supports:
 * - Smart git status and diff analysis
 * - Automatic categorization into the 9 repository layers
 * - Conventional commit message generation based on categorized targets
 * - Direct content routing / auto-insertion via --add / -a
 * - Optional Gemini API semantic reasoning if GEMINI_API_KEY is configured
 * - High-precision offline semantic classification engine
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI Color codes for clean terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m',
    gray: '\x1b[90m'
};

const log = {
    step: (msg) => console.log(`\n${colors.cyan}${colors.bright}==> ${msg}${colors.reset}`),
    ai: (msg) => console.log(`${colors.magenta}${colors.bright}[AI Categorizer]${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
    err: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`)
};

const REPO_ROOT = path.resolve(__dirname, '..');

// ==========================================
// 1. REPOSITORY TAXONOMY & KEYWORD CATALOG
// ==========================================
const TAXONOMY = [
    // Skills
    {
        category: 'skills',
        folder: 'skills/react-development',
        file: 'skills/react-development/SKILL.md',
        keywords: ['react', 'jsx', 'tsx', 'hooks', 'usestate', 'useeffect', 'usecontext', 'component', 'props', 'vite', 'next.js', 'frontend', 'virtual dom', 'ui state', 'tanstack', 'tailwind']
    },
    {
        category: 'skills',
        folder: 'skills/react-native-development',
        file: 'skills/react-native-development/SKILL.md',
        keywords: ['react native', 'expo', 'mobile', 'android', 'ios', 'touchable', 'flatlist', 'screens', 'react-navigation', 'native module', 'mobile app']
    },
    {
        category: 'skills',
        folder: 'skills/backend-nodejs',
        file: 'skills/backend-nodejs/SKILL.md',
        keywords: ['node', 'nodejs', 'express', 'fastify', 'nest', 'backend', 'middleware', 'server', 'routing', 'api controller', 'backend service']
    },
    {
        category: 'skills',
        folder: 'skills/api-design',
        file: 'skills/api-design/SKILL.md',
        keywords: ['api', 'rest', 'restful', 'endpoint', 'http status', 'crud', 'json payload', 'request response', 'openapi', 'swagger', 'api design']
    },
    {
        category: 'skills',
        folder: 'skills/database-design',
        file: 'skills/database-design/SKILL.md',
        keywords: ['database', 'sql', 'postgres', 'schema', 'migration', 'table', 'foreign key', 'normalization', 'erd', 'indexing', 'query', 'prisma', 'drizzle']
    },
    {
        category: 'skills',
        folder: 'skills/esp32-development',
        file: 'skills/esp32-development/SKILL.md',
        keywords: ['esp32', 'arduino', 'microcontroller', 'embedded', 'gpio', 'sensor', 'i2c', 'spi', 'uart', 'firmware', 'esp-idf', 'freertos', 'hardware']
    },
    {
        category: 'skills',
        folder: 'skills/iot-systems',
        file: 'skills/iot-systems/SKILL.md',
        keywords: ['iot', 'mqtt', 'broker', 'telemetry', 'edge computing', 'actuator', 'device management', 'pubsub', 'gateway', 'internet of things']
    },
    {
        category: 'skills',
        folder: 'skills/testing',
        file: 'skills/testing/SKILL.md',
        keywords: ['test', 'testing', 'unit test', 'integration test', 'jest', 'vitest', 'cypress', 'playwright', 'tdd', 'mock', 'assert', 'coverage', 'smoke test']
    },
    {
        category: 'skills',
        folder: 'skills/debugging',
        file: 'skills/debugging/SKILL.md',
        keywords: ['debug', 'debugging', 'bug', 'fix', 'error', 'stack trace', 'root cause', 'crash', 'exception', 'diagnose', 'investigate', 'log analysis']
    },
    {
        category: 'skills',
        folder: 'skills/code-review',
        file: 'skills/code-review/SKILL.md',
        keywords: ['review', 'code review', 'standards', 'code quality', 'pr review', 'clean code', 'linting', 'refactor check', 'code smell']
    },
    {
        category: 'skills',
        folder: 'skills/git-workflow',
        file: 'skills/git-workflow/SKILL.md',
        keywords: ['git', 'commit', 'branch', 'merge', 'rebase', 'pull request', 'github', 'tag', 'cherry-pick', 'repository', 'vcs']
    },
    {
        category: 'skills',
        folder: 'skills/ui-ux-implementation',
        file: 'skills/ui-ux-implementation/SKILL.md',
        keywords: ['ui', 'ux', 'css', 'design system', 'styling', 'flexbox', 'grid', 'responsive', 'animation', 'typography', 'theme', 'dark mode']
    },
    {
        category: 'skills',
        folder: 'skills/documentation',
        file: 'skills/documentation/SKILL.md',
        keywords: ['doc', 'documentation', 'readme', 'api docs', 'docstring', 'comments', 'user guide', 'technical writing', 'markdown']
    },
    {
        category: 'skills',
        folder: 'skills/supabase',
        file: 'skills/supabase/SKILL.md',
        keywords: ['supabase', 'baas', 'rls', 'row level security', 'supabase auth', 'supabase storage', 'edge functions', 'realtime']
    },
    {
        category: 'skills',
        folder: 'skills/devops-ci-cd',
        file: 'skills/devops-ci-cd/SKILL.md',
        keywords: ['devops', 'ci', 'cd', 'github actions', 'docker', 'pipeline', 'workflow', 'deploy', 'deployment', 'hosting', 'container', 'build']
    },

    // Rules
    {
        category: 'rules',
        folder: 'rules',
        file: 'rules/coding-standards.md',
        keywords: ['standard', 'convention', 'naming convention', 'formatting', 'prettier', 'eslint', 'style guide', 'clean architecture']
    },
    {
        category: 'rules',
        folder: 'rules',
        file: 'rules/security.md',
        keywords: ['security', 'secret', 'api key', 'env', 'password', 'token', 'credential', 'auth', 'injection', 'xss', 'csrf', 'vulnerability', 'owasp']
    },
    {
        category: 'rules',
        folder: 'rules',
        file: 'rules/git-conventions.md',
        keywords: ['git rule', 'commit convention', 'conventional commit', 'branch naming', 'pr rule', 'git policy']
    },
    {
        category: 'rules',
        folder: 'rules',
        file: 'rules/architecture.md',
        keywords: ['architecture rule', 'separation of concerns', 'modularity', 'single responsibility', 'solid', 'system design principle']
    },
    {
        category: 'rules',
        folder: 'rules',
        file: 'rules/dependency-management.md',
        keywords: ['dependency', 'package', 'npm install', 'package.json', 'vetting', 'lockfile', 'third-party', 'library rule']
    },
    {
        category: 'rules',
        folder: 'rules',
        file: 'rules/file-modification.md',
        keywords: ['file modification', 'minimal edit', 'preserve comments', 'no collateral change', 'focused diff', 'file rule']
    },
    {
        category: 'rules',
        folder: 'rules',
        file: 'rules/ai-behavior.md',
        keywords: ['ai behavior', 'agent rule', 'hallucination', 'agent constraint', 'no assumption', 'ai instruction', 'agent guideline']
    },

    // Agents
    {
        category: 'agents',
        folder: 'agents',
        file: 'agents/planner.md',
        keywords: ['agent planner', 'planner role', 'scoping', 'breakdown', 'requirements planning', 'roadmap', 'architect agent']
    },
    {
        category: 'agents',
        folder: 'agents',
        file: 'agents/developer.md',
        keywords: ['agent developer', 'developer role', 'coder agent', 'implementation agent', 'build feature']
    },
    {
        category: 'agents',
        folder: 'agents',
        file: 'agents/debugger.md',
        keywords: ['agent debugger', 'debugger role', 'troubleshooter', 'investigator agent', 'diagnostician']
    },
    {
        category: 'agents',
        folder: 'agents',
        file: 'agents/reviewer.md',
        keywords: ['agent reviewer', 'reviewer role', 'auditor agent', 'code inspector', 'quality gate']
    },
    {
        category: 'agents',
        folder: 'agents',
        file: 'agents/tester.md',
        keywords: ['agent tester', 'tester role', 'qa agent', 'quality assurance', 'test generator']
    },
    {
        category: 'agents',
        folder: 'agents',
        file: 'agents/documenter.md',
        keywords: ['agent documenter', 'documenter role', 'technical writer agent', 'docs generator']
    },

    // Workflows
    {
        category: 'workflows',
        folder: 'workflows',
        file: 'workflows/new-project.md',
        keywords: ['workflow new project', 'project kickoff workflow', 'scaffold workflow', 'greenfield']
    },
    {
        category: 'workflows',
        folder: 'workflows',
        file: 'workflows/new-feature.md',
        keywords: ['workflow new feature', 'feature lifecycle', 'add feature workflow', 'feature pipeline']
    },
    {
        category: 'workflows',
        folder: 'workflows',
        file: 'workflows/bug-fix.md',
        keywords: ['workflow bug fix', 'fix workflow', 'troubleshooting process', 'patch workflow']
    },
    {
        category: 'workflows',
        folder: 'workflows',
        file: 'workflows/refactoring.md',
        keywords: ['workflow refactoring', 'code cleanup workflow', 'modernization workflow']
    },
    {
        category: 'workflows',
        folder: 'workflows',
        file: 'workflows/code-review.md',
        keywords: ['workflow review', 'pr review workflow', 'inspection workflow']
    },
    {
        category: 'workflows',
        folder: 'workflows',
        file: 'workflows/testing.md',
        keywords: ['workflow testing', 'test lifecycle workflow', 'qa process']
    },
    {
        category: 'workflows',
        folder: 'workflows',
        file: 'workflows/deployment.md',
        keywords: ['workflow deploy', 'deployment process', 'release pipeline workflow']
    },
    {
        category: 'workflows',
        folder: 'workflows',
        file: 'workflows/documentation.md',
        keywords: ['workflow docs', 'doc generation workflow', 'documentation process']
    },

    // Prompts
    {
        category: 'prompts',
        folder: 'prompts/planning',
        file: 'prompts/planning/project-kickoff.md',
        keywords: ['prompt kickoff', 'prompt plan', 'prompt feature breakdown', 'prompt architecture decision']
    },
    {
        category: 'prompts',
        folder: 'prompts/development',
        file: 'prompts/development/implement-feature.md',
        keywords: ['prompt implement', 'prompt refactor', 'prompt api endpoint', 'prompt write code']
    },
    {
        category: 'prompts',
        folder: 'prompts/debugging',
        file: 'prompts/debugging/diagnose-issue.md',
        keywords: ['prompt debug', 'prompt diagnose', 'prompt trace error', 'prompt analyze stack trace']
    },
    {
        category: 'prompts',
        folder: 'prompts/testing',
        file: 'prompts/testing/write-unit-tests.md',
        keywords: ['prompt test', 'prompt unit test', 'prompt integration test']
    },
    {
        category: 'prompts',
        folder: 'prompts/review',
        file: 'prompts/review/code-review.md',
        keywords: ['prompt review', 'prompt code review', 'prompt architecture review']
    },
    {
        category: 'prompts',
        folder: 'prompts/documentation',
        file: 'prompts/documentation/write-readme.md',
        keywords: ['prompt readme', 'prompt docs', 'prompt api docs']
    },

    // Templates
    {
        category: 'templates',
        folder: 'templates',
        file: 'templates/project-spec.md',
        keywords: ['template project spec', 'spec template', 'specification format']
    },
    {
        category: 'templates',
        folder: 'templates',
        file: 'templates/feature-spec.md',
        keywords: ['template feature spec', 'feature specification template']
    },
    {
        category: 'templates',
        folder: 'templates',
        file: 'templates/implementation-plan.md',
        keywords: ['template plan', 'implementation plan template', 'execution plan format']
    },
    {
        category: 'templates',
        folder: 'templates',
        file: 'templates/bug-report.md',
        keywords: ['template bug', 'bug report format', 'issue template']
    },
    {
        category: 'templates',
        folder: 'templates',
        file: 'templates/architecture-doc.md',
        keywords: ['template architecture', 'architecture design document format']
    },
    {
        category: 'templates',
        folder: 'templates',
        file: 'templates/api-spec.md',
        keywords: ['template api', 'api spec format', 'endpoint doc template']
    },
    {
        category: 'templates',
        folder: 'templates',
        file: 'templates/project-readme.md',
        keywords: ['template readme', 'readme format template']
    },
    {
        category: 'templates',
        folder: 'templates',
        file: 'templates/changelog.md',
        keywords: ['template changelog', 'changelog format']
    },

    // Knowledge
    {
        category: 'knowledge',
        folder: 'knowledge/react',
        file: 'knowledge/react/patterns.md',
        keywords: ['knowledge react', 'react patterns', 'react gotchas', 'react reference']
    },
    {
        category: 'knowledge',
        folder: 'knowledge/react-native',
        file: 'knowledge/react-native/patterns.md',
        keywords: ['knowledge react native', 'react native patterns', 'mobile reference']
    },
    {
        category: 'knowledge',
        folder: 'knowledge/nextjs',
        file: 'knowledge/nextjs/patterns.md',
        keywords: ['knowledge nextjs', 'nextjs patterns', 'app router', 'server components']
    },
    {
        category: 'knowledge',
        folder: 'knowledge/nodejs',
        file: 'knowledge/nodejs/patterns.md',
        keywords: ['knowledge nodejs', 'nodejs patterns', 'event loop', 'node streams']
    },
    {
        category: 'knowledge',
        folder: 'knowledge/supabase',
        file: 'knowledge/supabase/patterns.md',
        keywords: ['knowledge supabase', 'supabase patterns', 'supabase gotchas']
    },
    {
        category: 'knowledge',
        folder: 'knowledge/esp32',
        file: 'knowledge/esp32/patterns.md',
        keywords: ['knowledge esp32', 'esp32 patterns', 'freertos patterns', 'esp pinout']
    },
    {
        category: 'knowledge',
        folder: 'knowledge/iot',
        file: 'knowledge/iot/patterns.md',
        keywords: ['knowledge iot', 'iot patterns', 'mqtt QoS', 'telemetry format']
    },
    {
        category: 'knowledge',
        folder: 'knowledge/databases',
        file: 'knowledge/databases/patterns.md',
        keywords: ['knowledge databases', 'sql patterns', 'indexing patterns', 'query optimization']
    },

    // Checklists
    {
        category: 'checklists',
        folder: 'checklists',
        file: 'checklists/before-coding.md',
        keywords: ['checklist before coding', 'pre-dev checklist', 'planning checklist']
    },
    {
        category: 'checklists',
        folder: 'checklists',
        file: 'checklists/pre-commit.md',
        keywords: ['checklist pre-commit', 'commit checklist', 'pre-commit gate']
    },
    {
        category: 'checklists',
        folder: 'checklists',
        file: 'checklists/pre-pull-request.md',
        keywords: ['checklist pr', 'pull request checklist', 'pre-merge checklist']
    },
    {
        category: 'checklists',
        folder: 'checklists',
        file: 'checklists/security-review.md',
        keywords: ['checklist security', 'security audit checklist']
    },
    {
        category: 'checklists',
        folder: 'checklists',
        file: 'checklists/testing.md',
        keywords: ['checklist testing', 'test completion checklist', 'qa checklist']
    },
    {
        category: 'checklists',
        folder: 'checklists',
        file: 'checklists/deployment.md',
        keywords: ['checklist deployment', 'deployment checklist', 'deploy', 'deploying', 'production readiness', 'release checklist', 'cloud deployment']
    },
    {
        category: 'checklists',
        folder: 'checklists',
        file: 'checklists/ai-code-review.md',
        keywords: ['checklist ai', 'ai review checklist', 'ai-generated code audit']
    },

    // Root Master files
    {
        category: 'root',
        folder: '.',
        file: 'AGENTS.md',
        keywords: ['master agent', 'agents.md', 'ai behavior contract', 'global instructions', 'agent system prompt']
    },
    {
        category: 'root',
        folder: '.',
        file: 'PROJECT_CONTEXT.md',
        keywords: ['project context', 'project definition', 'tech stack context', 'project metadata']
    }
];

// ==========================================
// 2. AI CATEGORIZATION ENGINE
// ==========================================
function stemWord(word) {
    if (!word || word.length <= 3) return word;
    return word
        .replace(/(?:ing|ment|tion|able|ness|less|ive|ed|es|s)$/, '')
        .replace(/(.)\1$/, '$1');
}

function categorizeText(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return null;
    }

    const clean = text.toLowerCase();
    const rawWords = clean.split(/[\s,./\\;:'"!@#$%^&*()_+=\-[\]{}<>?|`~]+/).filter(w => w.length > 2);
    const stemmedWords = rawWords.map(stemWord);

    const scores = TAXONOMY.map(item => {
        let score = 0;
        const matchedKeywords = [];

        // Direct path match
        if (clean.includes(item.folder.toLowerCase()) || clean.includes(item.file.toLowerCase())) {
            score += 25;
            matchedKeywords.push('path_match');
        }

        // Category match & intent boost
        if (clean.includes(item.category)) {
            score += 15;
            matchedKeywords.push(`category:${item.category}`);
        }

        // Specific category intent indicators
        if (item.category === 'prompts' && /\b(prompt|prompts)\b/.test(clean)) {
            score += 25;
            matchedKeywords.push('intent:prompts');
        }
        if (item.category === 'checklists' && /\b(checklist|checklists)\b/.test(clean)) {
            score += 25;
            matchedKeywords.push('intent:checklists');
        }
        if (item.category === 'workflows' && /\b(workflow|workflows|lifecycle|process)\b/.test(clean)) {
            score += 25;
            matchedKeywords.push('intent:workflows');
        }
        if (item.category === 'rules' && /\b(rule|rules|convention|conventions|standard|standards)\b/.test(clean)) {
            score += 20;
            matchedKeywords.push('intent:rules');
        }
        if (item.category === 'agents' && /\b(agent|agents|persona|role)\b/.test(clean)) {
            score += 25;
            matchedKeywords.push('intent:agents');
        }
        if (item.category === 'templates' && /\b(template|templates|skeleton|spec)\b/.test(clean)) {
            score += 25;
            matchedKeywords.push('intent:templates');
        }
        if (item.category === 'knowledge' && /\b(knowledge|pattern|patterns|gotcha|gotchas)\b/.test(clean)) {
            score += 25;
            matchedKeywords.push('intent:knowledge');
        }
        if (item.category === 'skills' && /\b(skill|skills|how-to|guide)\b/.test(clean)) {
            score += 20;
            matchedKeywords.push('intent:skills');
        }

        // Keyword matching with phrase boost & stemming
        for (const kw of item.keywords) {
            const kwLower = kw.toLowerCase();
            if (clean.includes(kwLower)) {
                const kwWordCount = kwLower.split(' ').length;
                const weight = kwWordCount > 1 ? 10 : 5;
                score += weight;
                matchedKeywords.push(kw);
            } else {
                // Stemmed comparison for keywords
                const kwStemmed = kwLower.split(' ').map(stemWord).join(' ');
                if (stemmedWords.join(' ').includes(kwStemmed)) {
                    score += 6;
                    matchedKeywords.push(`stem:${kw}`);
                }
            }
        }

        // Token match against target file
        for (let i = 0; i < rawWords.length; i++) {
            const w = rawWords[i];
            const sw = stemmedWords[i];
            const fileLower = item.file.toLowerCase();
            if (fileLower.includes(w)) {
                score += 3;
            } else if (fileLower.includes(sw)) {
                score += 2;
            }
        }

        return {
            ...item,
            score,
            matchedKeywords
        };
    });

    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];

    // Determine confidence
    const totalTop = scores.slice(0, 3).reduce((acc, curr) => acc + curr.score, 0);
    const confidence = totalTop > 0 ? Math.min(99, Math.round((best.score / (totalTop + 1)) * 100)) : 50;

    return {
        bestMatch: best.score > 0 ? best : null,
        topRanked: scores.slice(0, 3).filter(s => s.score > 0),
        confidence: best.score > 0 ? confidence : 0
    };
}

// Optional Gemini API query if GEMINI_API_KEY is available in env
async function tryGeminiCategorize(input) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
        const prompt = `You are an AI categorization system for an AI development toolkit repository.
Categorize the following input into exactly one target file from this repository taxonomy:
Available categories: skills, prompts, rules, agents, workflows, templates, knowledge, checklists.
Taxonomy targets:
${TAXONOMY.map(t => `- ${t.file} (category: ${t.category})`).join('\n')}

Input to categorize:
"""
${input}
"""

Respond ONLY in JSON format:
{
  "category": "<category>",
  "folder": "<folder>",
  "file": "<file>",
  "explanation": "<1-sentence reason>",
  "suggestedCommit": "<conventional commit message e.g. feat(skills/react-development): ...>"
}`;

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        if (res.ok) {
            const data = await res.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textResponse) {
                return JSON.parse(textResponse);
            }
        }
    } catch (e) {
        // Fall back to offline analyzer gracefully
    }
    return null;
}

// ==========================================
// 3. GIT HELPER UTILITIES
// ==========================================
function run(cmd, silent = false) {
    try {
        return execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf-8', stdio: silent ? 'pipe' : 'pipe' }).trim();
    } catch (e) {
        if (!silent) {
            throw e;
        }
        return '';
    }
}

function promptUser(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise(resolve => rl.question(query, ans => {
        rl.close();
        resolve(ans);
    }));
}

// ==========================================
// 4. MAIN SYNC & CATEGORIZATION WORKFLOW
// ==========================================
async function main() {
    // Parse arguments
    const args = process.argv.slice(2);
    let autoMode = false;
    let addMode = false;
    let addContent = '';
    let userMessage = '';

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--auto' || arg === '-a' || arg === '-Auto') {
            autoMode = true;
        } else if (arg === '--add' || arg === '-add' || arg === '--route') {
            addMode = true;
            addContent = args[++i] || '';
        } else if (!userMessage && !arg.startsWith('-')) {
            userMessage = arg;
        }
    }

    log.step('AI Development Kit - Smart Git Sync & AI Categorizer');

    // Verify git
    try {
        const isRepo = run('git rev-parse --is-inside-work-tree', true);
        if (isRepo !== 'true') {
            log.err('Not inside a git repository.');
            process.exit(1);
        }
    } catch {
        log.err('Git command failed or not in a git repository.');
        process.exit(1);
    }

    const currentBranch = run('git branch --show-current') || 'main';
    const remote = run('git remote').split('\n')[0] || 'origin';
    log.info(`Branch: ${colors.green}${currentBranch}${colors.reset} | Remote: ${colors.green}${remote}${colors.reset}`);

    // Handling --add / direct content routing
    if (addMode && addContent) {
        log.step(`Analyzing input to categorize and route into target file...`);
        const cat = categorizeText(addContent);
        if (cat && cat.bestMatch) {
            log.ai(`Input belongs to: ${colors.bright}${colors.cyan}${cat.bestMatch.file}${colors.reset} (Confidence: ${cat.confidence}%)`);
            log.ai(`Category: ${colors.yellow}${cat.bestMatch.category}${colors.reset} | Folder: ${colors.cyan}${cat.bestMatch.folder}${colors.reset}`);

            const targetFilePath = path.join(REPO_ROOT, cat.bestMatch.file);
            const shouldAdd = autoMode || (await promptUser(`\nAppend this content to '${cat.bestMatch.file}'? [Y/n]: `)).toLowerCase() !== 'n';
            if (shouldAdd) {
                const formattedContent = `\n\n## Added on ${new Date().toISOString().replace('T', ' ').substring(0, 16)}\n${addContent}\n`;
                fs.appendFileSync(targetFilePath, formattedContent, 'utf-8');
                log.success(`Appended content to ${cat.bestMatch.file}`);
                if (!userMessage) {
                    userMessage = `feat(${cat.bestMatch.folder}): add content via AI categorizer`;
                }
            }
        } else {
            log.warn('Could not definitively categorize the input. Please specify target file manually.');
        }
    }

    // Inspect git status
    const statusOutput = run('git status --porcelain', true);
    const hasChanges = statusOutput.length > 0;

    // Check unpushed commits
    let hasUnpushed = false;
    try {
        const unpushed = run(`git log ${remote}/${currentBranch}..${currentBranch} --oneline`, true);
        hasUnpushed = unpushed.length > 0;
    } catch {
        // remote tracking might not exist yet
    }

    if (!hasChanges && !hasUnpushed) {
        log.success('Working tree clean and up to date with remote. Nothing to sync.');
        process.exit(0);
    }

    if (hasChanges) {
        log.step('Detected repository changes:');
        console.log(run('git status --short'));

        // AI analysis on changed files & git diff
        const changedFiles = statusOutput.split('\n').map(l => l.substring(3).trim()).filter(Boolean);
        const diffText = run('git diff', true).slice(0, 3000); // sample diff
        const combinedContext = `${userMessage}\n${changedFiles.join('\n')}\n${diffText}`;

        // Run AI categorization on changes + user input
        let aiResult = null;
        if (process.env.GEMINI_API_KEY) {
            aiResult = await tryGeminiCategorize(combinedContext);
        }

        if (!aiResult) {
            const localCat = categorizeText(combinedContext);
            if (localCat && localCat.bestMatch) {
                aiResult = {
                    category: localCat.bestMatch.category,
                    folder: localCat.bestMatch.folder,
                    file: localCat.bestMatch.file,
                    suggestedCommit: `feat(${localCat.bestMatch.folder}): update ${path.basename(localCat.bestMatch.file, '.md')} and related assets`
                };
            }
        }

        if (aiResult) {
            log.ai(`Analyzed changes and categorized target:`);
            console.log(`   ${colors.cyan}• Target Category:${colors.reset} ${colors.yellow}${aiResult.category}${colors.reset}`);
            console.log(`   ${colors.cyan}• Target Folder:  ${colors.reset} ${colors.bright}${aiResult.folder}${colors.reset}`);
            console.log(`   ${colors.cyan}• Target File:    ${colors.reset} ${aiResult.file}`);
            console.log(`   ${colors.cyan}• Suggested Scope:${colors.reset} ${colors.green}${aiResult.suggestedCommit}${colors.reset}\n`);
        }

        // Commit message determination
        let finalMessage = userMessage;
        if (!finalMessage) {
            const defaultMessage = aiResult ? aiResult.suggestedCommit : `chore(toolkit): sync updates (${new Date().toISOString().substring(0, 16).replace('T', ' ')})`;
            if (autoMode) {
                finalMessage = defaultMessage;
            } else {
                const input = await promptUser(`Enter commit message [Default: '${defaultMessage}']: `);
                finalMessage = input.trim() || defaultMessage;
            }
        }

        // Stage and commit
        log.step('Staging changes (respecting .gitignore)...');
        run('git add .');

        log.step(`Committing: "${finalMessage}"`);
        run(`git commit -m "${finalMessage.replace(/"/g, '\\"')}"`);
        log.success('Committed cleanly.');
    } else {
        log.info('No new uncommitted files, pushing existing commits.');
    }

    // Pull / Rebase & Push
    try {
        log.step(`Checking remote updates from ${remote}/${currentBranch}...`);
        run(`git fetch ${remote} ${currentBranch} --quiet`, true);

        const behind = run(`git rev-list --count ${currentBranch}..${remote}/${currentBranch}`, true);
        if (behind && parseInt(behind, 10) > 0) {
            log.warn(`Branch is ${behind} commit(s) behind remote. Rebasing...`);
            run(`git pull --rebase ${remote} ${currentBranch}`);
        }

        log.step(`Pushing to ${remote}/${currentBranch}...`);
        run(`git push ${remote} ${currentBranch}`);
        log.success(`Successfully pushed all commits to ${remote}/${currentBranch}!`);
    } catch (e) {
        log.err(`Git push or network operation failed: ${e.message}`);
        process.exit(1);
    }

    console.log(`\n${colors.green}${colors.bright}✔ All operations finished successfully.${colors.reset}\n`);
}

main().catch(err => {
    log.err(err.message);
    process.exit(1);
});
