/* eslint-disable import-x/no-nodejs-modules -- Node-only regression test */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import test from 'node:test';

process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({ module: 'CommonJS', moduleResolution: 'node' });
const require = createRequire(import.meta.url);
const { 构造私聊自然回复纪律, 识别最近私聊惯用元素 } = require('../../src/人妻公寓/脚本/游戏逻辑/手机/私聊自然度.ts');

const 手机目录 = new URL('../../src/人妻公寓/脚本/游戏逻辑/手机/', import.meta.url);
const 私聊交互源码 = readFileSync(new URL('./交互/邀约与发消息.ts', 手机目录), 'utf8');
const 节拍引擎源码 = readFileSync(new URL('./节拍引擎.ts', 手机目录), 'utf8');

test('近期三轮可识别截图中的丈夫、害羞、家务与警告四类惯用元素', () => {
  assert.deepEqual(
    识别最近私聊惯用元素(
      [
        '陆嘉明刚才还从我旁边走过去，差点把我吓出冷汗。',
        '我在厨房择菜呢，被你说得脸都烫了。',
        '你给我老实点，不许再乱撩，听见没！',
      ],
      '陆嘉明',
    ),
    ['丈夫或婚姻对照', '脸红心跳式害羞', '家务或当前位置过场', '警告或嘴硬收尾'],
  );
});

test('去重窗口只看近期六条，普通代词与日常短答不会被误判成丈夫模板', () => {
  assert.deepEqual(
    识别最近私聊惯用元素(
      [
        '顾国栋今天回来了，我还在做饭，你别再胡闹。',
        '他刚才发的表情挺好笑。',
        '楼下快递到了。',
        '嗯，知道了。',
        '明天再说吧。',
        '这张照片拍得不错。',
        '收到。',
      ],
      '顾国栋',
    ),
    [],
  );
});

test('自然回复纪律明确拆掉固定链，并把近期命中变成有条件的避让而非永久禁用', () => {
  const 纪律 = 构造私聊自然回复纪律(
    ['顾国栋刚出门。', '我刚给琴盖上盖，耳根还是烫的。', '你安分些，别再发这些话。'],
    '顾国栋',
  );
  assert.match(纪律, /不是把状态表、人设、丈夫资料和当前位置逐项翻译成台词/);
  assert.match(纪律, /复述或改写玩家原话→提丈夫或婚姻作对照→脸红心跳等害羞反应→交代家务或当前位置→警告玩家安分/);
  assert.match(纪律, /没有实际使用.*引用.*协议时，不要改写或复述玩家原话充当开场/);
  assert.match(纪律, /丈夫姓名和家庭资料只用于事实校验，不是每轮必写素材/);
  assert.match(纪律, /不要默认用.*安分点.*收尾/);
  assert.match(纪律, /近期几轮她已经明显用过：丈夫或婚姻对照、脸红心跳式害羞、家务或当前位置过场、警告或嘴硬收尾/);
  assert.match(纪律, /玩家本轮明确把对应话题重新提到台前.*当前硬事实确实要求/);
});

test('手动与自动私聊共用去重纪律，手动回复默认收缩到一至两只气泡', () => {
  assert.match(私聊交互源码, /import \{ 构造私聊自然回复纪律 \} from '\.\.\/私聊自然度';/);
  assert.match(私聊交互源码, /能用1只微信气泡说清就只发1只，通常最多2只/);
  assert.match(私聊交互源码, /只有本批确有多个互不相同且都必须分别回答的事项时，才可使用3至5只/);
  assert.match(私聊交互源码, /不要把一个完整意思拆成多只气泡凑数量/);
  assert.match(私聊交互源码, /构造私聊自然回复纪律\(最近角色回复, 配\.夫名\)/);
  assert.match(私聊交互源码, /先选出本轮最值得回应的核心，再生成真正需要的回复气泡/);
  assert.doesNotMatch(私聊交互源码, /再用1至5只微信气泡自然回应/);

  assert.match(节拍引擎源码, /import \{ 构造私聊自然回复纪律 \} from '\.\/私聊自然度';/);
  assert.match(节拍引擎源码, /构造私聊自然回复纪律\(最近角色回复, 配\.夫名\)/);
  assert.match(节拍引擎源码, /消息\.会话 === m && 消息\.发 === '对方' && 消息\.类 !== '撤回'/);
});
