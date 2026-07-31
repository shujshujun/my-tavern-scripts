import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const 根 = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const 读取 = 相对路径 => readFileSync(resolve(根, 相对路径), 'utf8');
const 导入纯TS模块 = async 相对路径 => {
  const js = ts.transpileModule(读取(相对路径), {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
};

test('MVU 外置模型重试通过 MVU 脚本自己的按钮事件桥接', () => {
  const 回合引擎 = 读取('src/人妻公寓/脚本/游戏逻辑/回合引擎.ts');
  const MVU加载器 = 读取('src/人妻公寓/脚本/MVU/index.ts');

  assert.doesNotMatch(
    回合引擎,
    /eventEmit\(getButtonEvent\(['"]重试额外模型解析['"]\)\)/,
    '游戏逻辑脚本不能用自己的 script id 生成 MVU 按钮事件',
  );
  assert.match(回合引擎, /await eventEmit\(['"]人妻公寓:MVU外置模型重试['"]\)/, '游戏逻辑应等待稳定的跨脚本桥接事件');
  assert.match(MVU加载器, /eventOn\(['"]人妻公寓:MVU外置模型重试['"]/, 'MVU 加载器应在 MVU 脚本上下文注册桥接监听');
  assert.match(
    MVU加载器,
    /await eventEmit\(getButtonEvent\(['"]重试额外模型解析['"]\)\)/,
    '桥接监听应在 MVU 脚本上下文触发官方按钮并等待处理完成',
  );
});

test('CG 大图使用独立滚动容器，并由动态可视视口控制画幅', () => {
  const 客户端 = 读取('src/人妻公寓/界面/客户端/App.vue');
  const 入口 = 读取('src/人妻公寓/界面/客户端/index.ts');
  const 画幅 = 读取('src/人妻公寓/界面/客户端/viewport.ts');

  assert.match(客户端, /class="cg-preview-scroller"/, 'CG 预览缺少独立滚动容器');
  assert.match(客户端, /\.cg-preview-scroller\s*\{[\s\S]*?overflow(?:-y)?:\s*auto/, 'CG 预览滚动容器必须允许纵向滚动');
  assert.match(
    客户端,
    /\.cg-preview-scroller\s*>\s*img\s*\{[\s\S]*?height:\s*auto/,
    '手机大图应按宽等比显示，超高部分交给滚动容器',
  );
  assert.doesNotMatch(入口, /--frame-h['"],\s*['"]100vh/, '全屏画幅不能退回静态 100vh');
  assert.match(画幅, /visualViewport/, '画幅应跟随手机动态可视视口');
});

test('DeepSeek 识别只读取当前生效模型，不会被其他来源的遗留设置误导', async () => {
  const { 收集当前正文模型线索, 模型线索指向DeepSeek } = await 导入纯TS模块(
    'src/人妻公寓/脚本/游戏逻辑/正文模型识别.ts',
  );
  const 是DeepSeek = 上下文 => 模型线索指向DeepSeek(收集当前正文模型线索(上下文));

  assert.equal(
    是DeepSeek({
      mainApi: 'openai',
      onlineStatus: 'deepseek-chat',
      chatCompletionSettings: {
        chat_completion_source: 'openai',
        openai_model: 'gpt-4.1',
        deepseek_model: 'deepseek-v4-pro',
      },
      getChatCompletionModel: () => 'gpt-4.1',
    }),
    false,
    '当前 GPT 模型不能被未启用字段或切换瞬间遗留的 DeepSeek 在线状态误判',
  );
  assert.equal(
    是DeepSeek({
      mainApi: 'openai',
      onlineStatus: 'claude-sonnet-4',
      chatCompletionSettings: {
        chat_completion_source: 'claude',
        claude_model: 'claude-sonnet-4',
        custom_model: 'deepseek-r1',
      },
      getChatCompletionModel: () => 'claude-sonnet-4',
    }),
    false,
    '当前 Claude 模型不能被未启用的自定义模型字段误判',
  );
  assert.equal(
    是DeepSeek({
      mainApi: 'openai',
      onlineStatus: 'deepseek-v4-pro',
      chatCompletionSettings: { chat_completion_source: 'deepseek', deepseek_model: 'deepseek-v4-pro' },
      getChatCompletionModel: () => 'deepseek-v4-pro',
    }),
    true,
    'DeepSeek 官方来源应命中',
  );
  assert.equal(
    是DeepSeek({
      mainApi: 'openai',
      onlineStatus: 'deepseek/deepseek-r1',
      chatCompletionSettings: { chat_completion_source: 'openrouter', openrouter_model: 'deepseek/deepseek-r1' },
      getChatCompletionModel: () => 'deepseek/deepseek-r1',
    }),
    true,
    'OpenRouter 上的 DeepSeek 模型应命中',
  );
  assert.equal(
    是DeepSeek({
      mainApi: 'openai',
      onlineStatus: 'r1',
      chatCompletionSettings: {
        chat_completion_source: 'custom',
        custom_model: 'r1',
        custom_url: 'https://api.deepseek.com/v1',
      },
      getChatCompletionModel: () => 'r1',
    }),
    true,
    'DeepSeek 官方兼容端点即使使用模型别名也应命中',
  );
  assert.equal(
    是DeepSeek({
      mainApi: 'textgenerationwebui',
      onlineStatus: 'Connected',
      textCompletionSettings: { type: 'generic', generic_model: 'deepseek-v3' },
      getTextGenServer: () => 'https://proxy.example/v1',
    }),
    true,
    'Text Completion generic 的当前 DeepSeek 模型应命中',
  );
  assert.equal(
    是DeepSeek({
      mainApi: 'textgenerationwebui',
      onlineStatus: 'Connected',
      textCompletionSettings: { type: 'ooba', custom_model: 'deepseek-r1', generic_model: 'gpt-4.1' },
      getTextGenServer: () => 'http://127.0.0.1:5000',
    }),
    true,
    'Text Completion ooba 应读取当前 custom_model，而不是其他类型的遗留模型',
  );
  assert.equal(
    是DeepSeek({
      mainApi: 'textgenerationwebui',
      onlineStatus: 'deepseek-r1',
      textCompletionSettings: { type: 'generic', generic_model: 'qwen3', custom_model: 'deepseek-r1' },
      getTextGenServer: () => 'https://proxy.example/v1',
    }),
    false,
    'Text Completion 当前非 DeepSeek 模型不能被 ooba 遗留字段或在线状态误判',
  );
});

test('DeepSeek 兼容策略只在命中该模型时改变隔离生成', () => {
  const 隔离引擎 = 读取('src/人妻公寓/脚本/游戏逻辑/隔离事件引擎.ts');

  assert.match(隔离引擎, /const 是DeepSeek = 当前正文模型是DeepSeek\(\)/, '每次隔离生成都必须先读取当前模型');
  assert.match(
    隔离引擎,
    /should_stream:\s*是DeepSeek/,
    '流式兼容不能无条件影响其他模型',
  );
  assert.match(
    隔离引擎,
    /是DeepSeek\s*\?\s*\[\.\.\.后,\s*['"]user_input['"]\s+as const\]\s*:\s*\[['"]user_input['"]\s+as const,\s*\.\.\.后\]/,
    'DeepSeek 才把 user_input 放到预设尾段之后，其他模型必须保持 rq0.62 顺序',
  );
  assert.match(
    隔离引擎,
    /const 本拍用户输入 = 是DeepSeek\s*\?[\s\S]*?: 参数\.行动/,
    '只有 DeepSeek 能附加最终正文收尾指令',
  );
  assert.match(
    隔离引擎,
    /数据库状态\(\)\.可调用AI\s*&&\s*!是DeepSeek/,
    '数据库代理不公开实际模型，命中 DeepSeek 时必须改走可确认模型的正文专用路径',
  );
  assert.match(隔离引擎, /const 普通隔离事件生成上限\s*=\s*1400/, '其他模型必须保持 rq0.62 的 1400 token 上限');
  assert.doesNotMatch(隔离引擎, /DeepSeek隔离事件生成上限/, '不得按正文模型改写数据库代理中未知模型的生成预算');
});
