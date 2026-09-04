import type { SchemaType } from '../../../schema';
import { 户静态表, type 门牌 } from '../../../stageConfig';
import { 取绝对时段 } from '../楼层时钟';
import { 姐妹群成员 } from '../雌竞系统';
import { 安若妍换掉商品ID } from '../安若妍换掉系统';
import { 安若妍换掉背景文件 } from '../安若妍换掉资源';
import { 构建角色结局后生活社交语义 } from '../结局后生活社交语义';
import { 构建结局社交画像 } from './结局社交语义';
import { 解析姐妹群公开事实 } from './姐妹群公开事实';
import { 读取群聊记忆上下文 } from './微信记忆上下文';
import { 小生成, 微信群文本, type 手机小生成控制 } from './生成引擎';
import { 手机可见单条硬上限, type 微信库, type 微信消息 } from './数据层';

export const 换照姐妹群照片键 = '301结局:换照:姐妹群照片';
export const 换照姐妹群反应前缀 = '301结局:换照:姐妹群反应:';

/** 301照片已发送后，校验仍未公开的跨线事实；当前照片的画面与拍摄者均属于本次公开范围。 */
export function 验收换照群公开事实(消息: string, 既有消息: readonly 微信消息[]): boolean {
  if (!既有消息.some(item => item.会话 === '姐妹群' && item.类 === '照片' && item.键 === 换照姐妹群照片键))
    return false;
  const 文 = 消息.normalize('NFKC').trim();
  const match = /^([^:：\n]+)[:：]\s*(.+)$/u.exec(文);
  if (!match) return false;
  const 发言人 = match[1].trim();
  const 正文 = match[2];
  const 公开 = 解析姐妹群公开事实(既有消息);
  // 只匹配传播其他记录／证据的具体表述；普通提及摄影、亲密或家庭成员不会单独触发拒收。
  if (
    /(?:公开|告诉大家|发到群里|给大家看).{0,24}(?:私聊记录|母带|外遇证据|CAM-?2录像|协议细节)|(?:私聊记录|母带|外遇证据|CAM-?2录像|协议细节).{0,24}(?:具体内容|原文是|写的是|告诉大家|发到群里|给大家看)/iu.test(
      正文,
    )
  )
    return false;
  if (!公开.借种家庭结构已公开) {
    const 指向夏乔家庭 =
      /(?:陆嘉明.{0,24}(?:知情|知道|同意|接受|默许).{0,24}(?:管理员|玩家|关系|家庭安排|家庭结构)|夏乔.{0,24}(?:生物学父亲|孩子(?:的)?父亲|家庭安排))/u.test(
        正文,
      );
    const 夏乔自述家庭 =
      发言人 === 户静态表['101'].妻名 &&
      /(?:我(?:的)?(?:丈夫|老公)).{0,24}(?:知情|知道|同意|接受).{0,24}(?:管理员|玩家|关系|家庭安排|家庭结构)|(?:我们三个|我们(?:的家庭)|我(?:的)?孩子(?:的)?父亲).{0,24}(?:知情|同意|接受|管理员|玩家)/u.test(
        正文,
      );
    if (指向夏乔家庭 || 夏乔自述家庭) return false;
  }
  const 涉及母亲 = 发言人 === 户静态表['302'].妻名 || /母亲|妈妈|302/u.test(正文);
  if (涉及母亲) {
    if (/机场.{0,24}(?:隐秘现场|镜头死角|镜头外的|隐瞒父亲)/u.test(正文)) return false;
    if (
      /(?:父亲|爸爸|你爸|他爸).{0,12}(?:已经|早就|其实|确实|明明)(?:知道|知情|看穿|发现|默许|成全).{0,24}(?:我|母亲|妈妈|302).{0,12}(?:管理员|玩家|关系)/u.test(
        正文,
      )
    )
      return false;
    if (
      !公开.母亲关系已公开 &&
      /(?:母亲|妈妈|我).{0,8}(?:和|跟|与).{0,8}(?:儿子|管理员|玩家).{0,12}(?:恋人|爱人|伴侣|情人|在一起|同床|共枕)|(?:母亲|妈妈).{0,8}(?:真实关系|隐秘关系)/u.test(
        正文,
      )
    )
      return false;
  }
  return true;
}

export function 构造换照成员差分(data: SchemaType, 门牌号: 门牌, 消息: readonly 微信消息[]) {
  const profile = 构建结局社交画像(data, 门牌号, 消息);
  const life = 构建角色结局后生活社交语义(data, 门牌号);
  return {
    门牌: 门牌号,
    姓名: profile.姓名,
    本人结局已完成: Boolean(profile.已完成结局),
    本人结局类型: profile.已完成结局,
    本人结局群内公开级: profile.关系公开级,
    本人丈夫边界: life.丈夫边界,
    本人当前阶段: profile.当前阶段,
    本人群内已知事实: profile.群内允许事实,
    本人群聊口吻: profile.群聊口吻变化,
    本次照片允许知道的事实:
      '安若妍已经公开301换照结果；照片记录她与玩家的亲密场景，两人面对镜头做鬼脸；江辰按约拍摄，玩家亲手换进原相框。',
  };
}
export function 换照群反应数量合格(lines: readonly string[], names: ReadonlySet<string>): boolean {
  if (lines.length < 6 || lines.length > 9) return false;
  const speakers = lines.map(line => /^([^:：\n]+)[:：]/u.exec(line)?.[1].trim() ?? '');
  return (
    speakers.every(name => names.has(name)) &&
    new Set(speakers).size >= 3 &&
    speakers.filter(name => name !== '安若妍').length >= 4 &&
    speakers.filter(name => name === '安若妍').length <= 2
  );
}
/** 每个调用只产出一个可原子提交批次：先照片，下次节拍才调用AI。手机库稳定键就是重试收据。 */
export async function 安若妍换照姐妹群一拍(
  data: SchemaType,
  库: 微信库,
  楼: number,
  控制: 手机小生成控制 = {},
): Promise<boolean | null> {
  const route = data.系统._安若妍换掉;
  if (
    !data.系统._已完成特殊场景.includes(安若妍换掉商品ID) ||
    !route.最终照片素材ID ||
    route.完成楼层 < 0 ||
    楼 < route.完成楼层
  )
    return null;
  if (控制.仍有效 && !控制.仍有效()) return false;
  const active = 库.消息.filter(message => message.会话 === '姐妹群' && message.类 !== '撤回');
  if (active.some(message => message.键?.startsWith(换照姐妹群反应前缀))) return null;
  const members = 姐妹群成员(data);
  if (!members.includes('301')) return false;
  const time = 取绝对时段(data);
  if (!active.some(message => message.键 === 换照姐妹群照片键)) {
    库.消息.push({
      楼,
      时: time,
      会话: '姐妹群',
      发: '对方',
      类: '照片',
      键: 换照姐妹群照片键,
      文: '安若妍：客厅这张换好了。江辰拍的，他点头以后，是管理员帮我换进去的。',
      图: `@ending/安若妍换掉/${安若妍换掉背景文件(data)}`,
    });
    return true;
  }
  if (members.length < 3) return false;
  const profiles = members.map(member => 构造换照成员差分(data, member, 库.消息));
  const memory = 读取群聊记忆上下文('姐妹群', 库, 楼);
  const text = await 小生成(
    '为都市生活游戏生成姐妹群收到301换照照片后的反应。只输出6至9行“姓名:内容”，至少3人发言，至少4条来自安若妍之外，安若妍最多回应2条。' +
      '围绕本次照片、拍摄安排和客厅变化交流。按每人自己的结局进度区分口吻；尚未完成时保留当前阶段的态度，已完成时可以更从容，但不能透露本人未公开的经历。' +
      '照片已经发出，本轮承接各成员看见照片后的反应；角色经历按下方各自的群内已知事实表达。',
    `成员与允许事实：${JSON.stringify(profiles)}\n${memory.群内记忆}\n${memory.最近聊天}`,
    { ...控制, 单次请求: true },
  );
  if (控制.仍有效 && !控制.仍有效()) return false;
  const names = new Set(members.map(member => 户静态表[member].妻名));
  const lines = await 微信群文本(text, names, 手机可见单条硬上限, 9, '301换照照片专场');
  if (控制.仍有效 && !控制.仍有效()) return false;
  if (!换照群反应数量合格(lines, names)) {
    console.warn('[301换照姐妹群] 本批次未满足条数与成员分布，保留待重试。');
    return false;
  }
  if (lines.some(line => !验收换照群公开事实(line, 库.消息))) {
    console.warn('[301换照姐妹群] 本批次未通过本线公开事实校验，保留待重试。');
    return false;
  }
  for (const [index, line] of lines.entries())
    库.消息.push({
      楼,
      时: time,
      会话: '姐妹群',
      发: '对方',
      文: line,
      键: `${换照姐妹群反应前缀}${index + 1}`,
    });
  return true;
}
