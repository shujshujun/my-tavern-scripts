#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const repoRoot = process.cwd();
const sourceRoot = 'src/人妻公寓';

const scopes = {
  app: {
    oldRoots: [`${sourceRoot}/界面/客户端/App.vue`],
    newRoots: [`${sourceRoot}/界面/客户端`],
  },
  phone: {
    oldRoots: [`${sourceRoot}/脚本/游戏逻辑/手机系统.ts`, `${sourceRoot}/脚本/游戏逻辑/手机/内核.ts`],
    newRoots: [`${sourceRoot}/脚本/游戏逻辑/手机系统.ts`, `${sourceRoot}/脚本/游戏逻辑/手机`],
  },
  game: {
    oldRoots: [`${sourceRoot}/脚本/游戏逻辑`],
    newRoots: [`${sourceRoot}/脚本/游戏逻辑`],
  },
  all: {
    oldRoots: [sourceRoot],
    newRoots: [sourceRoot],
  },
};

const scopeName = process.argv[2] ?? 'app';
const newSource = process.argv[3] ?? 'rq0.74';
const reportTopLevel = process.argv.includes('--top-level');
const scope = scopes[scopeName];
if (!scope || !['rq0.74', 'worktree'].includes(newSource)) {
  console.error('用法: node scripts/audit-rqgy-rq073-rq074.mjs <app|phone|game|all> <rq0.74|worktree>');
  process.exit(2);
}

function git(args) {
  return execFileSync('git', ['-c', 'core.quotepath=false', ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  });
}

function listAtRef(ref, roots) {
  return git(['ls-tree', '-r', '--name-only', ref, '--', ...roots])
    .split(/\r?\n/u)
    .filter(Boolean)
    .filter(file => /\.(?:ts|tsx|js|jsx|vue|css|scss)$/u.test(file));
}

function listWorktree(roots) {
  const files = [];
  for (const root of roots) {
    const absolute = path.join(repoRoot, root);
    if (!fs.existsSync(absolute)) continue;
    const stat = fs.statSync(absolute);
    if (stat.isFile()) {
      files.push(root);
      continue;
    }
    const stack = [absolute];
    while (stack.length > 0) {
      const directory = stack.pop();
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const child = path.join(directory, entry.name);
        if (entry.isDirectory()) stack.push(child);
        else if (/\.(?:ts|tsx|js|jsx|vue|css|scss)$/u.test(entry.name)) {
          files.push(path.relative(repoRoot, child).replaceAll('\\', '/'));
        }
      }
    }
  }
  return [...new Set(files)].sort();
}

function readAt(source, file) {
  if (source === 'worktree') return fs.readFileSync(path.join(repoRoot, file), 'utf8');
  return git(['show', `${source}:${file}`]);
}

function scriptBlocks(file, content) {
  if (!file.endsWith('.vue')) return [{ text: content, offset: 0 }];
  const blocks = [];
  const pattern = /<script\b[^>]*>([\s\S]*?)<\/script>/giu;
  let match;
  while ((match = pattern.exec(content))) {
    blocks.push({ text: match[1], offset: match.index });
  }
  return blocks;
}

function addNamedBinding(binding, target) {
  if (ts.isIdentifier(binding)) target.add(binding.text);
  else if (ts.isObjectBindingPattern(binding) || ts.isArrayBindingPattern(binding)) {
    for (const element of binding.elements) {
      if (ts.isBindingElement(element)) addNamedBinding(element.name, target);
    }
  }
}

function staticString(node) {
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return undefined;
}

function callName(expression) {
  if (ts.isIdentifier(expression)) return expression.text;
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text;
  return '';
}

function memberPath(node) {
  const parts = [];
  let cursor = node;
  while (ts.isPropertyAccessExpression(cursor)) {
    parts.unshift(cursor.name.text);
    cursor = cursor.expression;
  }
  if (ts.isIdentifier(cursor)) parts.unshift(cursor.text);
  return parts.join('.');
}

function analyzeFile(file, content) {
  const out = {
    declarations: new Set(),
    exports: new Set(),
    events: new Set(),
    storageKeys: new Set(),
    statePaths: new Set(),
    properties: new Set(),
    literals: new Set(),
    userStrings: new Set(),
    classes: new Set(),
    imports: new Set(),
  };

  for (const { text } of scriptBlocks(file, content)) {
    const scriptKind = /\.(?:tsx|jsx)$/u.test(file) ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, scriptKind);
    const visit = node => {
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isClassDeclaration(node) ||
        ts.isInterfaceDeclaration(node) ||
        ts.isTypeAliasDeclaration(node) ||
        ts.isEnumDeclaration(node)
      ) {
        if (node.name) {
          out.declarations.add(node.name.text);
          if (node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) out.exports.add(node.name.text);
        }
      } else if (ts.isVariableDeclaration(node)) {
        addNamedBinding(node.name, out.declarations);
        if (ts.isVariableDeclarationList(node.parent) && ts.isVariableStatement(node.parent.parent)) {
          if (node.parent.parent.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
            addNamedBinding(node.name, out.exports);
          }
        }
      } else if (ts.isImportDeclaration(node)) {
        const specifier = staticString(node.moduleSpecifier);
        if (specifier) out.imports.add(specifier);
      } else if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) out.exports.add(element.name.text);
      }

      if (
        ts.isPropertySignature(node) ||
        ts.isPropertyDeclaration(node) ||
        ts.isPropertyAssignment(node) ||
        ts.isMethodSignature(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isGetAccessorDeclaration(node) ||
        ts.isSetAccessorDeclaration(node)
      ) {
        const name = node.name;
        if (name && (ts.isIdentifier(name) || ts.isStringLiteralLike(name) || ts.isNumericLiteral(name))) {
          out.properties.add(name.text);
        }
      }

      if (ts.isCallExpression(node)) {
        const name = callName(node.expression);
        const first = node.arguments[0] ? staticString(node.arguments[0]) : undefined;
        if (first && /^(?:eventEmit|eventOn|eventOnce|eventRemoveListener|emit|on|off|trigger|dispatchEvent)$/u.test(name)) {
          out.events.add(first);
        }
        if (first && /^(?:getItem|setItem|removeItem)$/u.test(name)) out.storageKeys.add(first);
      }

      if (ts.isPropertyAccessExpression(node)) {
        const value = memberPath(node).replace(/\.value(?=\.|$)/gu, '');
        if (/^(?:data|store|stat_data|currentData|snapshot|schema)(?:\.|$)/u.test(value) && value.split('.').length >= 3) {
          out.statePaths.add(value);
        }
      }

      if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        const value = node.text.trim();
        if (value.length >= 1 && value.length <= 120) out.literals.add(value);
        if (/[\u3400-\u9fff]/u.test(value) && value.length >= 2 && value.length <= 120) out.userStrings.add(value);
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }

  const withoutScripts = file.endsWith('.vue') ? content.replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, '') : content;
  const attributePattern = /\b(:?)class\s*=\s*(["'])([\s\S]*?)\2/giu;
  let attributeMatch;
  while ((attributeMatch = attributePattern.exec(withoutScripts))) {
    const dynamic = attributeMatch[1] === ':';
    const attribute = attributeMatch[3];
    if (!dynamic) {
      for (const className of attribute.split(/\s+/u)) {
        if (/^[_a-zA-Z\u3400-\u9fff][\w\u3400-\u9fff-]*$/u.test(className)) out.classes.add(className);
      }
    } else {
      for (const raw of attribute.matchAll(/["'`]([_a-zA-Z\u3400-\u9fff][\w\u3400-\u9fff-]*)["'`]/gu)) {
        out.classes.add(raw[1]);
      }
    }
  }
  const styles = file.endsWith('.vue')
    ? [...content.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/giu)].map(match => match[1]).join('\n')
    : /\.(?:css|scss)$/u.test(file)
      ? content
      : '';
  for (const match of styles.matchAll(/(?<![\w/-])\.([_a-zA-Z\u3400-\u9fff][\w\u3400-\u9fff-]*)/gu)) out.classes.add(match[1]);
  return out;
}

function normalizedTokens(text) {
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text);
  const tokens = [];
  for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
    if (
      token === ts.SyntaxKind.WhitespaceTrivia ||
      token === ts.SyntaxKind.NewLineTrivia ||
      token === ts.SyntaxKind.SingleLineCommentTrivia ||
      token === ts.SyntaxKind.MultiLineCommentTrivia
    ) {
      continue;
    }
    tokens.push(`${token}:${scanner.getTokenText()}`);
  }
  return tokens.join('\u0001');
}

function declarationTextWithoutModuleModifiers(statement, source) {
  let text = statement.getText(source);
  if (
    ts.isFunctionDeclaration(statement) ||
    ts.isClassDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isEnumDeclaration(statement)
  ) {
    text = text.replace(/^(?:(?:export|default|declare)\s+)*/u, '');
  }
  return text;
}

function tokenSimilarity(left, right) {
  const leftTokens = left ? left.split('\u0001') : [];
  const rightTokens = right ? right.split('\u0001') : [];
  if (leftTokens.length === 0 && rightTokens.length === 0) return 1;
  const counts = new Map();
  for (const token of leftTokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  let intersection = 0;
  for (const token of rightTokens) {
    const count = counts.get(token) ?? 0;
    if (count <= 0) continue;
    intersection += 1;
    counts.set(token, count - 1);
  }
  return (2 * intersection) / (leftTokens.length + rightTokens.length);
}

function analyzeTopLevelFile(file, content) {
  const entries = [];
  for (const { text } of scriptBlocks(file, content)) {
    const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    for (const statement of source.statements) {
      if (ts.isVariableStatement(statement)) {
        for (const declaration of statement.declarationList.declarations) {
          if (!ts.isIdentifier(declaration.name)) continue;
          entries.push({
            name: declaration.name.text,
            kind: 'variable',
            body: normalizedTokens(declaration.getText(source)),
          });
        }
      } else if (
        ts.isFunctionDeclaration(statement) ||
        ts.isClassDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement) ||
        ts.isEnumDeclaration(statement)
      ) {
        if (!statement.name) continue;
        entries.push({
          name: statement.name.text,
          kind: ts.SyntaxKind[statement.kind],
          body: normalizedTokens(declarationTextWithoutModuleModifiers(statement, source)),
        });
      }
    }
  }
  return entries;
}

function analyze(source, roots) {
  const files = source === 'worktree' ? listWorktree(roots) : listAtRef(source, roots);
  const combined = {
    declarations: new Set(),
    exports: new Set(),
    events: new Set(),
    storageKeys: new Set(),
    statePaths: new Set(),
    properties: new Set(),
    literals: new Set(),
    userStrings: new Set(),
    classes: new Set(),
    imports: new Set(),
  };
  const owners = Object.fromEntries(Object.keys(combined).map(key => [key, new Map()]));
  const topLevel = new Map();
  for (const file of files) {
    const content = readAt(source, file);
    const result = analyzeFile(file, content);
    for (const [kind, values] of Object.entries(result)) {
      for (const value of values) {
        combined[kind].add(value);
        const current = owners[kind].get(value) ?? [];
        current.push(file);
        owners[kind].set(value, current);
      }
    }
    for (const declaration of analyzeTopLevelFile(file, content)) {
      const current = topLevel.get(declaration.name) ?? [];
      current.push({ file, ...declaration });
      topLevel.set(declaration.name, current);
    }
  }
  return { files, combined, owners, topLevel };
}

function difference(left, right) {
  return [...left].filter(value => !right.has(value)).sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function relativeDependencies(source, file, knownFiles) {
  const content = readAt(source, file);
  const specifiers = new Set();
  for (const { text } of scriptBlocks(file, content)) {
    const sourceFile = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    const visit = node => {
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        const specifier = node.moduleSpecifier ? staticString(node.moduleSpecifier) : undefined;
        if (specifier) specifiers.add(specifier);
      } else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        const specifier = node.arguments[0] ? staticString(node.arguments[0]) : undefined;
        if (specifier) specifiers.add(specifier);
      }
      ts.forEachChild(node, visit);
    };
    visit(sourceFile);
  }
  const dependencies = [];
  for (const specifier of specifiers) {
    if (!specifier.startsWith('.')) continue;
    const bare = path.posix.normalize(path.posix.join(path.posix.dirname(file), specifier));
    const candidates = [
      bare,
      `${bare}.ts`,
      `${bare}.tsx`,
      `${bare}.js`,
      `${bare}.vue`,
      `${bare}.css`,
      `${bare}.scss`,
      `${bare}/index.ts`,
      `${bare}/index.tsx`,
    ];
    const resolved = candidates.find(candidate => knownFiles.has(candidate));
    if (resolved) dependencies.push(resolved);
  }
  return dependencies;
}

function findUnreachable(source, files, entries) {
  const knownFiles = new Set(files);
  const reached = new Set();
  const stack = entries.filter(file => knownFiles.has(file));
  while (stack.length > 0) {
    const file = stack.pop();
    if (reached.has(file)) continue;
    reached.add(file);
    for (const dependency of relativeDependencies(source, file, knownFiles)) stack.push(dependency);
  }
  return files.filter(file => !reached.has(file));
}

function printSection(name, oldResult, newResult, limit) {
  const missing = difference(oldResult.combined[name], newResult.combined[name]);
  const added = difference(newResult.combined[name], oldResult.combined[name]);
  console.log(`\n## ${name}: 旧有 ${oldResult.combined[name].size} / 新有 ${newResult.combined[name].size}`);
  console.log(`旧有而新集合未原名命中: ${missing.length}`);
  for (const value of missing.slice(0, limit)) {
    console.log(`- ${JSON.stringify(value)} <- ${oldResult.owners[name].get(value).join(', ')}`);
  }
  if (missing.length > limit) console.log(`- ……另有 ${missing.length - limit} 项`);
  console.log(`新集合新增: ${added.length}`);
}

const oldResult = analyze('rq0.73', scope.oldRoots);
const newResult = analyze(newSource, scope.newRoots);
console.log(`# ${scopeName}: rq0.73 -> ${newSource}`);
console.log(`旧文件 ${oldResult.files.length}，新文件 ${newResult.files.length}`);
if (scopeName === 'phone') {
  const entry = `${sourceRoot}/脚本/游戏逻辑/手机系统.ts`;
  const unreachable = findUnreachable(newSource, newResult.files, [entry]);
  console.log(`\n## 从手机系统门面不可达: ${unreachable.length}`);
  for (const file of unreachable) console.log(`- ${file}`);
}
if (scopeName === 'all') {
  const entries = [
    `${sourceRoot}/脚本/MVU/index.ts`,
    `${sourceRoot}/脚本/游戏逻辑/index.ts`,
    `${sourceRoot}/界面/客户端/index.ts`,
  ];
  const unreachable = findUnreachable(newSource, newResult.files, entries);
  console.log(`\n## 从三个生产入口不可达: ${unreachable.length}`);
  for (const file of unreachable) console.log(`- ${file}`);
}
if (reportTopLevel) {
  const changes = [];
  for (const [name, oldEntries] of oldResult.topLevel) {
    const newEntries = newResult.topLevel.get(name) ?? [];
    if (oldEntries.length !== 1 || newEntries.length !== 1) continue;
    if (oldEntries[0].body === newEntries[0].body) continue;
    changes.push({
      name,
      oldFile: oldEntries[0].file,
      newFile: newEntries[0].file,
      oldTokens: oldEntries[0].body.split('\u0001').length,
      newTokens: newEntries[0].body.split('\u0001').length,
      similarity: tokenSimilarity(oldEntries[0].body, newEntries[0].body),
    });
  }
  changes.sort((a, b) => a.similarity - b.similarity || a.name.localeCompare(b.name, 'zh-CN'));
  console.log(`\n## 同名唯一顶层声明内容变化: ${changes.length}`);
  for (const change of changes) {
    console.log(
      `- ${change.name}: ${change.oldFile} (${change.oldTokens}) -> ${change.newFile} (${change.newTokens}), 相似度 ${(change.similarity * 100).toFixed(1)}%`,
    );
  }
}
for (const [kind, limit] of Object.entries({
  declarations: 400,
  exports: 400,
  events: 200,
  storageKeys: 200,
  statePaths: 400,
  properties: 500,
  literals: 500,
  userStrings: 200,
  classes: 300,
  imports: 100,
})) {
  printSection(kind, oldResult, newResult, limit);
}
