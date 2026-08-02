/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const 根 = fileURLToPath(new URL('../../src/人妻公寓/', import.meta.url));

function 源文件(目录) {
  return readdirSync(目录, { withFileTypes: true }).flatMap(项 => {
    const 路径 = `${目录}/${项.name}`;
    if (项.isDirectory()) return 源文件(路径);
    return /\.(?:ts|vue|yaml)$/.test(项.name) ? [路径] : [];
  });
}

test('世界绝对时段只有新游戏和时钟原语两个赋值点', () => {
  const 写点 = [];
  for (const 文件 of 源文件(根)) {
    const 相对 = 文件.slice(根.length + 1).replaceAll('\\', '/');
    const 行们 = readFileSync(文件, 'utf8').split(/\r?\n/);
    行们.forEach((行, index) => {
      if (/_绝对时段\s*(?:[+\-*/]?=|\+\+|--)/.test(行)) 写点.push(`${相对}:${index + 1}`);
    });
  }

  assert.equal(写点.length, 2, `发现未审计的世界时钟写点:\n${写点.join('\n')}`);
  assert.deepEqual(
    写点.map(项 => 项.split(':')[0]).sort(),
    ['脚本/游戏逻辑/回合引擎.ts', '脚本/游戏逻辑/楼层时钟.ts'].sort(),
  );
});

test('旧偏移钟和杀时间事件已从业务源码完全移除', () => {
  const 非法命中 = [];
  for (const 文件 of 源文件(根)) {
    const 相对 = 文件.slice(根.length + 1).replaceAll('\\', '/');
    const 行们 = readFileSync(文件, 'utf8').split(/\r?\n/);
    行们.forEach((行, index) => {
      if (/人妻公寓:杀时间/.test(行)) 非法命中.push(`${相对}:${index + 1}`);
      if (/_时段偏移楼|_上次杀时间楼层/.test(行)) 非法命中.push(`${相对}:${index + 1}`);
    });
  }
  assert.deepEqual(非法命中, []);
});
