/* eslint-disable import-x/no-nodejs-modules -- Bind the production time gate to each isolated AST fixture. */
import { readFileSync } from 'node:fs';
import * as ts from 'typescript';

const source = readFileSync(new URL('../../../src/人妻公寓/脚本/游戏逻辑/时间事务写入门.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

/** Execute the unchanged production module with the caller's variable reader and chat identity. */
export function 装配真实时间事务门(dependencies) {
  const host = dependencies.SillyTavern ?? globalThis.SillyTavern;
  const scopedHost = typeof dependencies.当前聊天ID === 'function'
    ? new Proxy(host ?? {}, {
        get(target, key, receiver) {
          return key === 'getCurrentChatId' ? dependencies.当前聊天ID : Reflect.get(target, key, receiver);
        },
      })
    : host;
  const globals = {
    getVariables: dependencies.getVariables ?? globalThis.getVariables,
    SillyTavern: scopedHost,
    window: dependencies.window,
  };
  // Fixtures without a window still receive their own lease/revision root; no other fixture is mutated.
  globals.globalThis = globals;
  const module = { exports: {} };
  Function('module', 'exports', ...Object.keys(globals), compiled)(
    module, module.exports, ...Object.values(globals),
  );
  return { ...module.exports, ...dependencies };
}
