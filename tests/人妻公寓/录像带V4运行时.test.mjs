/* eslint-disable import-x/no-nodejs-modules -- Node-only VTR V4 runtime regression */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

import lodash from 'lodash';

globalThis._ = lodash;
process.env.TS_NODE_COMPILER_OPTIONS = JSON.stringify({
  module: 'CommonJS',
  moduleResolution: 'node',
  resolveJsonModule: true,
});
const require = createRequire(import.meta.url);
require('ts-node/register/transpile-only');

const { Schema } = require('../../src/人妻公寓/schema.ts');
const {
  构造录像带V4行动文本,
  构造录像带V4客户端快照,
  录像带V4候选图片地址,
  录像带V4正文越拍原因,
} = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4运行时.ts');
const {
  录像带V4镜头卡们,
  读取录像带V4候选,
  读取录像带V4镜头卡,
} = require('../../src/人妻公寓/脚本/游戏逻辑/录像带V4契约.ts');

function 场景数据() {
  const data = Schema.parse({});
  data.系统._特殊场景.id = '录像带V4';
  data.系统._特殊场景.地点 = '302';
  data.系统._录像带V4.阶段 = '观看中';
  data.系统._录像带V4.场景.状态 = '观看中';
  data.系统._录像带V4.场景.场次标识 = 'runtime-001';
  return data;
}

test('候选原图不被安装进生产包；只有显式开发基址才产生可请求地址', () => {
  const 候选 = 读取录像带V4候选('102', 8);
  assert.ok(候选);
  assert.equal(录像带V4候选图片地址(候选, ''), '');
  assert.equal(
    录像带V4候选图片地址(候选, 'https://assets.example/vtr-v4/'),
    'https://assets.example/vtr-v4/VTR-V4-102-B08-draw2.png',
  );
});

test('38个运行时快照逐一绑定正确CAM、候选文件、SHA与时间码', () => {
  const 旧基址 = globalThis.__RQGY_VTR_V4_CANDIDATE_BASE__;
  globalThis.__RQGY_VTR_V4_CANDIDATE_BASE__ = 'https://assets.example/vtr-v4';
  try {
    const 已见 = new Set();
    for (const 房间 of ['102', '202']) {
      for (let 幕次 = 1; 幕次 <= 19; 幕次 += 1) {
        const data = 场景数据();
        data.系统._录像带V4.场景.共享幕次 = 幕次;
        data.系统._录像带V4.场景.当前房间 = 房间;
        data.系统._录像带V4.场景.时间码秒 = 幕次 * 8;
        data.系统._录像带V4.场景.锁具状态 =
          幕次 === 19 ? { 102: 'settled', 202: 'settled' } : { 102: 'locked', 202: 'locked' };
        const 快照 = 构造录像带V4客户端快照(data, `${房间}-${幕次}`);
        assert.equal(快照.当前房间, 房间);
        assert.equal(快照.画面键, `VTR-V4-${房间}-B${String(幕次).padStart(2, '0')}`);
        assert.equal(快照.候选ID, 快照.画面键);
        assert.match(
          快照.候选文件,
          new RegExp(`^VTR-V4-${房间}-B${String(幕次).padStart(2, '0')}(?:-draw\\d+)?\\.png$`, 'u'),
        );
        assert.match(快照.候选SHA256, /^[A-F0-9]{64}$/u);
        assert.match(快照.候选地址, /^https:\/\/assets\.example\/vtr-v4\/VTR-V4-/u);
        assert.equal(快照.时间码秒, 幕次 * 8);
        assert.equal(快照.正文, `${房间}-${幕次}`);
        assert.equal(快照.可完成, 幕次 === 19);
        已见.add(快照.候选SHA256);
      }
    }
    assert.equal(已见.size, 38);
  } finally {
    if (旧基址 === undefined) delete globalThis.__RQGY_VTR_V4_CANDIDATE_BASE__;
    else globalThis.__RQGY_VTR_V4_CANDIDATE_BASE__ = 旧基址;
  }
});

test('38张冻结镜头卡自身的停止结果全部通过硬校验，不与机器契约互相打架', () => {
  assert.equal(录像带V4镜头卡们.length, 38);
  for (const 卡 of 录像带V4镜头卡们) {
    const 结果 = String(卡.runtimeOutcome ?? 卡.runtimeStopBoundary ?? 卡.stopBoundary ?? '').trim();
    assert.ok(结果, `${卡.id}必须有停止结果`);
    assert.equal(录像带V4正文越拍原因(卡, 结果), '', `${卡.id}机器停止结果不得被自身校验拒绝`);
  }
});

test('逐幕正文硬校验拒绝串房、界面串词、现场接触和提前完成，但不误判明确否定句', () => {
  const 第二幕 = 读取录像带V4镜头卡('102', 2);
  const 第四幕 = 读取录像带V4镜头卡('102', 4);
  const 第八幕 = 读取录像带V4镜头卡('102', 8);
  const 第十五幕 = 读取录像带V4镜头卡('202', 15);
  const 第十六幕 = 读取录像带V4镜头卡('202', 16);
  const 第十七幕 = 读取录像带V4镜头卡('102', 17);
  const 第十八幕 = 读取录像带V4镜头卡('102', 18);
  const 第十九幕 = 读取录像带V4镜头卡('202', 19);
  assert.ok(第二幕 && 第四幕 && 第八幕 && 第十五幕 && 第十六幕 && 第十七幕 && 第十八幕 && 第十九幕);

  assert.equal(
    录像带V4正文越拍原因(第二幕, '顾国栋看见平板里沈静仪过去留下的录像，仍没有解锁，也尚未开始自己的动作。'),
    '',
  );
  assert.match(录像带V4正文越拍原因(第二幕, '何俊生看着平板里的沈静仪。'), /当前CAM|另一房间/u);
  assert.match(录像带V4正文越拍原因(第二幕, '顾国栋看见CAM-102和REC灯。'), /客户端覆盖层/u);
  assert.match(
    录像带V4正文越拍原因(第二幕, '顾国栋看着平板里的沈静仪。周小满伸手帮他套弄下身。'),
    /无接触边界/u,
  );
  assert.match(录像带V4正文越拍原因(第二幕, '顾国栋看着平板里的沈静仪，随后解锁。'), /第4幕之前/u);
  assert.match(
    录像带V4正文越拍原因(第二幕, '顾国栋看见平板里播放的是周小满的过去录像。'),
    /没有正确建立平板中的沈静仪过去录像/u,
    'CAM-102第2幕明确把陪看人妻写进平板时必须拒绝',
  );
  assert.equal(录像带V4正文越拍原因(第四幕, '顾国栋亲自解锁腰间装置，周小满只站在远处看着。'), '');
  assert.equal(
    录像带V4正文越拍原因(第四幕, '顾国栋终于完成解锁，周小满只站在远处看着。'),
    '',
    '完成解锁不得被误判成丈夫提前完成性行为',
  );
  assert.equal(
    录像带V4正文越拍原因(第八幕, '顾国栋继续看平板里的沈静仪。周小满离开沙发走到桌边，仍与他保持距离。'),
    '',
    '普通室内走位不得被误判为离场',
  );
  assert.equal(录像带V4正文越拍原因(第十五幕, '何俊生仍未射精。沈静仪看着平板中的片尾，按下停录遥控器，录制停止。'), '');
  assert.match(
    录像带V4正文越拍原因(第十五幕, '何俊生仍未射精，片刻后却射了。沈静仪才按下停录遥控器。'),
    /第16幕之前/u,
    '同一句先否定后肯定时也必须识别后一个越拍事实',
  );
  assert.equal(录像带V4正文越拍原因(第十六幕, '何俊生只用自己的手射精了，沈静仪始终保持距离，尚未开始清理复锁。'), '');
  assert.equal(录像带V4正文越拍原因(第十七幕, '顾国栋清理后亲自把装置重新锁上，拔出钥匙；周小满还没有进行目视核验。'), '');
  assert.match(
    录像带V4正文越拍原因(第十七幕, '顾国栋亲自把装置重新锁上，拔出钥匙；周小满还没有进行目视核验。'),
    /没有同时写出丈夫本人清理与复锁/u,
  );
  assert.equal(录像带V4正文越拍原因(第十八幕, '顾国栋站好，周小满保持距离完成目视核验，确认装置已经锁好；钥匙尚未交接。'), '');
  assert.equal(录像带V4正文越拍原因(第十九幕, '何俊生把平板和钥匙交出，沈静仪收走后离开202，桌上留下完成凭条。'), '');
  assert.match(
    录像带V4正文越拍原因(第十九幕, '何俊生把平板和钥匙交出，沈静仪收走后离开202。'),
    /没有同时完成平板钥匙交接、留下凭条与离场/u,
  );
});

test('切房操作明确进入目标CAM的下一共享幕，不复述为停留原幕', () => {
  const 文 = 构造录像带V4行动文本({
    操作标识: 'switch-2',
    类型: '切房',
    场次标识: 'runtime-001',
    基线世代: 1,
    基线幕次: 1,
    基线房间: '102',
    目标房间: '202',
    目标幕次: 2,
    画面键: 'VTR-V4-202-B02',
    需要生成: true,
  });
  assert.match(文, /切换到CAM-202/u);
  assert.match(文, /共享第2幕/u);
  assert.doesNotMatch(文, /仍停留/u);
});

test('第19幕停在CAM-202且两户均settled时也允许结束监控', () => {
  const data = 场景数据();
  data.系统._录像带V4.场景.共享幕次 = 19;
  data.系统._录像带V4.场景.当前房间 = '202';
  data.系统._录像带V4.场景.锁具状态 = { 102: 'settled', 202: 'settled' };
  const 快照 = 构造录像带V4客户端快照(data, '最后一幕正文');
  assert.equal(快照.当前房间, '202');
  assert.equal(快照.画面键, 'VTR-V4-202-B19');
  assert.equal(快照.可完成, true);
  assert.equal(快照.可切房, false, '第19幕不能再用切房偷推进不存在的第20幕');
  assert.equal(快照.可下一幕, false);
});
