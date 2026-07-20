// 人妻公寓：补齐“每位角色 × 外装/制服/内衣”立绘差分。
// 本地 ComfyUI + Nova Anime XL + 六角色 LoRA；纯文生图，不使用 IPAdapter。
// 用法：node util/人妻公寓_补齐服装立绘.mjs [--limit=1] [--only=夏乔_一字肩] [--character=周小满] [--default=周小满] [--preview]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const HOST = 'http://127.0.0.1:8188';
const CKPT = 'novaAnimeXL_ilV190.safetensors';
const PYTHON = 'E:\\ComfyUI-aki-v3\\python\\python.exe';
const OUT = path.resolve('dist/人妻公寓/素材/立绘');
const TMP = path.join(os.tmpdir(), 'rqgy_missing_sprites');

const only = process.argv.find(x => x.startsWith('--only='))?.slice(7);
const character = process.argv.find(x => x.startsWith('--character='))?.slice(12);
const defaultCharacter = process.argv.find(x => x.startsWith('--default='))?.slice(10);
const limit = Number(process.argv.find(x => x.startsWith('--limit='))?.slice(8) ?? Infinity);
const force = process.argv.includes('--force');
const preview = process.argv.includes('--preview');
const cleanBackground = process.argv.includes('--clean-background');

const 质量头 =
  'masterpiece, best quality, amazing quality, 4k, very aesthetic, high resolution, ultra-detailed, absurdres, newest, ';
// 以下摄影尾与负向词逐字继承 Fable 的 prod_b2_sprites.mjs，保证新旧批次同一画质管线。
const 摄影尾 =
  ', standing, furniture only in the far background, not touching anything, cowboy shot, from thighs up, looking at viewer, detailed beautiful face, warm cinematic soft lighting, rim light, depth of field, elegant mature atmosphere, rich vivid colors, (soft gradient shading:1.1), delicate detailed rendering';
const 负基 =
  '(child:1.2), loli, teenager, underage, young girl, aged down, petite, chibi, kid, photorealistic, realistic, 3d, lowres, worst quality, bad quality, bad anatomy, bad hands, extra fingers, jpeg artifacts, blurry, (watermark:1.3), (text:1.2), signature, painting, cartoon, deformed, ugly, animal ears, tail, plump, chubby, fat, multiple views, border, full body, wide shot, backlit silhouette, (overexposed:1.2), blown highlights, high key lighting, washed out colors, faded colors, (furniture in foreground:1.2), leaning on furniture, table in front, desk, counter, sitting, lying, on bed, (bed in foreground:1.2), pillow in foreground, lamp in foreground, sofa in foreground';

const 人物 = {
  夏乔: {
    trigger: 'xiaqiao_rqgy',
    lora: 'rqgy_xiaqiao_rqgy.safetensors',
    seed: 501101,
    肤负: '(dark skin:1.3), (tan:1.2), tanned, ',
    体: '(healthy peachy fair skin:1.1), (bright brown eyes:1.15), (warm chestnut brown hair:1.15), messy hair bun, slim toned body, medium breasts',
    姿: 'leaning forward slightly, energetic cheerful pose',
  },
  沈静仪: {
    trigger: 'shenjingyi_rqgy',
    lora: 'rqgy_shenjingyi_rqgy.safetensors',
    seed: 502101,
    肤负: '(dark skin:1.35), (tan:1.25), tanned, dusky skin, ',
    体: '(porcelain fair skin with rosy glow:1.2), (very dark brown eyes:1.15), (jet black hair:1.2), immaculate updo, tall slender elegant body, medium breasts',
    姿: 'hands elegantly folded in front, straight graceful posture',
  },
  许曼君: {
    trigger: 'xumanjun_rqgy',
    lora: 'rqgy_xumanjun_rqgy.safetensors',
    seed: 503101,
    肤负: '(dark skin:1.3), (tan:1.2), tanned, ',
    体: '(natural fair skin:1.1), (amber brown eyes:1.15), (half-lidded eyes:1.1), (dark brown hair:1.15), loose low ponytail, (voluptuous hourglass figure:1.15), (large breasts:1.15), wide hips, slim waist, mature woman',
    姿: 'arms crossed under chest, head tilted, appraising look',
  },
  周小满: {
    trigger: 'zhouxiaoman_rqgy',
    lora: 'rqgy_zhouxiaoman_rqgy.safetensors',
    seed: 504101,
    肤负:
      '(gray skin:1.4), (ashen skin:1.4), corpse-like pallor, chalk-white skin, bluish skin, colorless skin, washed-out skin, (dark skin:1.2), (deep tan:1.15), ',
    体: '(soft warm ivory skin with a natural peach undertone:1.25), (healthy rosy cheeks:1.18), subtle warm skin translucency, (soft dark eyes:1.1), tareme, (black hair:1.2), (medium hair:1.2), blunt bangs, slender delicate body, small waist, modest breasts',
    姿: 'holding her own arm shyly, timid posture',
  },
  安若妍: {
    trigger: 'anruoyan_rqgy',
    lora: 'rqgy_anruoyan_rqgy.safetensors',
    seed: 505101,
    肤负: '(very dark skin:1.3), ganguro, gyaru, kogal, (pink hair:1.3), (purple hair:1.3), (blonde hair:1.25), (silver hair:1.25), (grey hair:1.2), pink lighting, magenta tint, ',
    体: '(sun-kissed lightly tanned skin:1.1), (light brown eyes:1.15), sharp cat-like eyes, (long wavy chestnut brown hair:1.3), tall model body, long legs, medium breasts',
    姿: 'one hand on hip, confident model pose',
  },
  母亲: {
    trigger: 'muqin_rqgy',
    lora: 'rqgy_muqin_rqgy.safetensors',
    seed: 506101,
    肤负: '(dark skin:1.3), (tan:1.2), tanned, ',
    体: '(warm fair complexion:1.1), (warm dark brown eyes:1.1), tareme, (dark brown hair:1.15), loose low bun, (voluptuous hourglass MILF figure:1.15), (large breasts:1.15), round wide hips, slim waist, mature woman',
    姿: 'hands gently clasped in front, warm welcoming posture',
  },
};

const 服装 = {
  碎花连衣裙: 'a knee-length cotton floral dress with a small delicate flower print, fitted waist, short sleeves',
  牛仔背带裙: 'a denim pinafore dress over a crisp blouse, fitted adult cut, knee-length skirt',
  毛衣裙: 'a fitted high-neck ribbed knit sweater dress, long sleeves, knee-length hem',
  收腰连衣裙: 'an elegant solid-color fitted-waist dress, clean tailored silhouette, short sleeves, knee-length hem',
  一字肩: 'an off-shoulder blouse, both shoulders and collarbones exposed, puff sleeves, a fitted high-waist skirt',
  开叉旗袍: 'a fitted silk qipao, high side slit, traditional frog buttons, subtle floral pattern',
  低胸晚礼裙: 'an elegant satin evening gown, deep v neckline, fitted waist, tasteful thigh slit',
  露背装:
    'an elegant backless halter dress, entire back exposed, fitted waist, turning three-quarter back toward viewer',
  透视装: 'a sheer gauze dress, translucent fabric, provocative adult fashion, matching lingerie visible underneath',
  露出装: 'an explicit cutout dress, open chest and open sides, very little fabric, provocative adult clothing',
  外出无内套装:
    'a refined fitted wrap dress worn with no underwear, discreet but provocative adult outfit, deep neckline',
  微布料比基尼: 'an extremely tiny micro bikini, minimal triangular fabric and thin strings, adult swimwear',
  女仆装: 'a classic modest maid dress, contrasting apron, long knee-length skirt, matching frilled headband',
  JK水手服: 'an adult-sized Japanese sailor uniform, blouse, contrasting neckerchief, pleated skirt',
  裸体围裙: 'a kitchen apron worn alone and nothing else, bare sides, bare back, apron ties, adult woman',
  情趣女仆装:
    'a two-tone erotic maid outfit, very short skirt, open neckline, contrasting frills, adult lingerie costume',
  情趣护士装: 'a tight erotic nurse mini dress, contrasting trim, front zipper, matching nurse cap, adult costume',
  蕾丝套装: 'a matching elegant lace bra and high-waist lace panties, refined adult lingerie set',
  真丝吊带睡裙: 'a silk slip nightdress, thin shoulder straps, low neckline, thigh-length hem',
  情趣三点式:
    'an explicit string micro lingerie set, three tiny fabric patches connected by thin strings, adult lingerie',
  开裆款: 'a lace bra and matching crotchless lace panties, clearly open crotch, explicit adult lingerie',
  透明蕾丝: 'a completely sheer lace nightdress, transparent lace showing the body beneath, adult lingerie',
  乳贴: 'heart-shaped nipple pasties and a matching tiny thong, otherwise nude adult body',
  连体网衣: 'a fishnet bodystocking from neck to ankles, nothing underneath, adult erotic lingerie',
};

// 六个位置依次对应：夏乔、沈静仪、许曼君、周小满、安若妍、母亲。
// 只使用现实成衣中常见、耐看的配色；同款在角色之间有区分，但不引入荧光色或怪异撞色。
const 角色顺序 = Object.keys(人物);
const 服装配色 = {
  碎花连衣裙: [
    'cream with tiny red and blue flowers',
    'light blue with tiny white flowers',
    'navy with tiny ivory flowers',
    'dusty pink with tiny white flowers',
    'black with tiny muted red flowers',
    'ivory with tiny lavender flowers',
  ],
  牛仔背带裙: [
    'medium blue denim with a white blouse',
    'dark indigo denim with an ivory blouse',
    'black denim with a camel blouse',
    'light blue denim with a white blouse',
    'washed blue denim with a black blouse',
    'dark blue denim with a cream blouse',
  ],
  毛衣裙: ['oatmeal beige', 'charcoal gray', 'warm camel', 'dusty rose', 'deep burgundy', 'soft mocha brown'],
  收腰连衣裙: ['cornflower blue', 'forest green', 'deep burgundy', 'dusty rose', 'classic black', 'deep navy'],
  一字肩: [
    'pure white blouse with a navy skirt',
    'ivory blouse with a charcoal skirt',
    'wine-red blouse with a black skirt',
    'powder-blue blouse with an ivory skirt',
    'black blouse with a camel skirt',
    'dusty-rose blouse with a cream skirt',
  ],
  开叉旗袍: [
    'scarlet red with subtle gold pattern',
    'black with subtle gold pattern',
    'burgundy with subtle gold pattern',
    'navy with subtle silver pattern',
    'emerald green with subtle gold pattern',
    'champagne with subtle burgundy pattern',
  ],
  低胸晚礼裙: ['deep navy', 'classic black', 'burgundy', 'dusty rose', 'emerald green', 'champagne'],
  露背装: ['midnight blue', 'classic black', 'wine red', 'dusty blue', 'deep emerald', 'champagne beige'],
  透视装: ['black', 'deep navy', 'wine red', 'ivory white', 'dark emerald', 'smoky mauve'],
  露出装: ['black', 'wine red', 'deep navy', 'ivory white', 'dark emerald', 'dusty rose'],
  外出无内套装: ['warm beige', 'charcoal gray', 'deep burgundy', 'dusty blue', 'classic black', 'camel brown'],
  微布料比基尼: ['classic red', 'black', 'wine red', 'navy blue', 'ivory white', 'dusty rose'],
  女仆装: [
    'black with white apron',
    'navy with ivory apron',
    'burgundy with cream apron',
    'chocolate brown with cream apron',
    'charcoal with white apron',
    'deep green with ivory apron',
  ],
  JK水手服: [
    'navy and white with red neckerchief',
    'black and white with wine-red neckerchief',
    'gray and white with navy neckerchief',
    'beige and ivory with brown neckerchief',
    'dark green and white with navy neckerchief',
    'charcoal and ivory with burgundy neckerchief',
  ],
  裸体围裙: ['pure white', 'cream', 'pale blue', 'dusty pink', 'classic black', 'burgundy'],
  情趣女仆装: [
    'black with white frills',
    'navy with ivory frills',
    'wine red with black frills',
    'dusty pink with white frills',
    'black with burgundy frills',
    'deep green with cream frills',
  ],
  情趣护士装: [
    'white with red trim',
    'pale blue with white trim',
    'dusty pink with white trim',
    'white with navy trim',
    'black with red trim',
    'ivory with burgundy trim',
  ],
  蕾丝套装: ['black', 'ivory white', 'wine red', 'dusty pink', 'deep navy', 'champagne beige'],
  真丝吊带睡裙: ['champagne', 'pearl white', 'wine red', 'dusty pink', 'midnight blue', 'soft mocha'],
  情趣三点式: ['black', 'ivory white', 'wine red', 'dusty pink', 'deep navy', 'champagne'],
  开裆款: ['black', 'ivory white', 'wine red', 'dusty rose', 'deep navy', 'champagne beige'],
  透明蕾丝: ['ivory white', 'black', 'wine red', 'dusty pink', 'deep navy', 'champagne'],
  乳贴: ['black', 'wine red', 'deep navy', 'dusty pink', 'black with gold detail', 'champagne beige'],
  连体网衣: ['black', 'ivory white', 'wine red', 'dusty rose', 'deep navy', 'smoky gray'],
};

function 取服装提示(名, sku) {
  if (sku === '默认') {
    if (名 === '周小满')
      return 'a soft dusty-blue short-sleeved lounge dress, simple rounded neckline, fitted waist, modest body-hugging homewear';
    throw new Error(`尚未配置 ${名} 的默认服装提示`);
  }
  const 配色 = 服装配色[sku]?.[角色顺序.indexOf(名)];
  return `${服装[sku]}, (${配色}:1.35), coordinated popular commercial colorway`;
}

const 可穿SKU = Object.keys(服装);
const SKU景 = {
  碎花连衣裙: 'on an apartment balcony at golden hour',
  牛仔背带裙: 'in a bright living room at daytime, soft sunlight',
  毛衣裙: 'in a cozy living room at night, warm lamp light',
  收腰连衣裙: 'in front of a full-length mirror in a bedroom, warm light',
  一字肩: 'in a living room at evening, warm light',
  开叉旗袍: 'in an elegant dim living room at night, warm accent light',
  低胸晚礼裙: 'in an elegant living room at night, chandelier warm glow',
  露背装: 'in a living room at night, city lights through window behind',
  透视装: 'in a living room at evening, warm window light',
  露出装: 'in a dim apartment corridor at night, sparse lights',
  外出无内套装: 'in an apartment corridor at night, elevator light behind',
  微布料比基尼: 'in a warm steamy bathroom, soft light',
  女仆装: 'at the apartment entryway, warm hallway light',
  JK水手服: 'in a warm apartment corridor at evening',
  裸体围裙: 'in a warm small kitchen at night, gentle steam',
  情趣女仆装: 'at the apartment entryway at night, warm hallway light',
  情趣护士装: 'in a bedroom at night, warm lamp light',
  蕾丝套装: 'in a dim cozy bedroom at night, warm bedside lamp',
  真丝吊带睡裙: 'in a dim cozy bedroom at night, soft warm glow',
  情趣三点式: 'in a dim cozy bedroom at night, warm bedside lamp',
  开裆款: 'in a dim cozy bedroom at night, warm bedside lamp',
  透明蕾丝: 'in a dim cozy bedroom at night, soft warm glow',
  乳贴: 'in a dim cozy bedroom at night, warm bedside lamp',
  连体网衣: 'in a dim cozy bedroom at night, moody warm light',
};

/** 绘世长批次偶发复用到半断开的 keep-alive 连接；逐请求断连并设超时，防完成一张后永久挂住。 */
async function 请求(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: { ...(options.headers ?? {}), Connection: 'close' },
    signal: AbortSignal.timeout(30000),
  });
}

function 建图(名, sku) {
  const p = 人物[名];
  const seed = sku === '默认' ? p.seed : p.seed + (可穿SKU.indexOf(sku) + 1) * 7;
  const 正 =
    质量头 +
    `${p.trigger}, 1girl, solo, adult body proportions, mature female, ${p.体}, ${取服装提示(名, sku)}, ${p.姿}, ${
      cleanBackground
        ? 'against a plain empty neutral studio backdrop, isolated character, no visible furniture, no lamp, no table, no flowers, no props'
        : sku === '默认'
          ? 'in a modest apartment living room, warm soft evening light'
          : SKU景[sku]
    }` +
    摄影尾;
  const 负 =
    (cleanBackground
      ? '(furniture:1.5), (table:1.5), (lamp:1.5), (flowers:1.5), (fruit:1.5), food, bowl, kitchen counter, still life, background objects, '
      : '') +
    p.肤负 +
    负基;
  return {
    1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: CKPT } },
    2: {
      class_type: 'LoraLoader',
      inputs: { model: ['1', 0], clip: ['1', 1], lora_name: p.lora, strength_model: 0.9, strength_clip: 0.9 },
    },
    3: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 1], text: 正 } },
    4: { class_type: 'CLIPTextEncode', inputs: { clip: ['2', 1], text: 负 } },
    5: { class_type: 'EmptyLatentImage', inputs: { width: 1024, height: 1536, batch_size: 1 } },
    6: {
      class_type: 'KSampler',
      inputs: {
        model: ['2', 0],
        positive: ['3', 0],
        negative: ['4', 0],
        latent_image: ['5', 0],
        seed,
        steps: 20,
        cfg: 4.5,
        sampler_name: 'euler_ancestral',
        scheduler: 'normal',
        denoise: 1,
      },
    },
    7: { class_type: 'VAEDecode', inputs: { samples: ['6', 0], vae: ['1', 2] } },
    8: { class_type: 'RemBGSession+', inputs: { model: 'isnet-anime: anime illustrations', providers: 'CPU' } },
    9: { class_type: 'ImageRemoveBackground+', inputs: { rembg_session: ['8', 0], image: ['7', 0] } },
    // ImageRemoveBackground+ 返回的是“背景=1”的 mask；作为 alpha 前必须反转成人物=1。
    10: { class_type: 'InvertMask', inputs: { mask: ['9', 1] } },
    11: { class_type: 'JoinImageWithAlpha', inputs: { image: ['9', 0], alpha: ['10', 0] } },
    12: { class_type: 'SaveImage', inputs: { images: ['11', 0], filename_prefix: 'rqgy_clothing_missing' } },
  };
}

async function 等待(promptId) {
  for (let i = 0; i < 300; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    const history = await (await 请求(`${HOST}/history/${promptId}`)).json();
    const done = history[promptId];
    if (!done) continue;
    const error = (done.status?.messages ?? []).find(x => x[0] === 'execution_error');
    if (error) throw new Error(`${error[1].node_type}: ${error[1].exception_message}`);
    const image = Object.values(done.outputs ?? {}).flatMap(x => x.images ?? [])[0];
    if (!image) throw new Error('ComfyUI 没有返回图片');
    return image;
  }
  throw new Error('ComfyUI 生成超时');
}

async function 下载(image) {
  const url = `${HOST}/view?filename=${encodeURIComponent(image.filename)}&subfolder=${encodeURIComponent(image.subfolder || '')}&type=${encodeURIComponent(image.type)}`;
  return Buffer.from(await (await 请求(url)).arrayBuffer());
}

function 后处理(png, webp) {
  const py = [
    'from PIL import Image',
    'import cv2,numpy as np',
    'import sys',
    'im=Image.open(sys.argv[1]).convert("RGBA")',
    'arr=np.array(im)',
    // 高阈值先切断 rembg 留下的半透明环境细丝，再用原始 alpha 保留人物抗锯齿边缘。
    'mask=(arr[:,:,3]>96).astype("uint8")',
    'n,labels,stats,_=cv2.connectedComponentsWithStats(mask,8)',
    'keep=1+int(np.argmax(stats[1:,cv2.CC_STAT_AREA])) if n>1 else 0',
    'arr[:,:,3]=np.where(labels==keep,arr[:,:,3],0).astype("uint8") if keep else arr[:,:,3]',
    'im=Image.fromarray(arr,"RGBA")',
    'a=im.getchannel("A")',
    'box=a.getbbox()',
    'assert box, "empty alpha"',
    'im=im.crop(box)',
    'h=1024',
    'w=max(1,round(im.width*h/im.height))',
    'im=im.resize((w,h),Image.Resampling.LANCZOS)',
    'im.save(sys.argv[2],"WEBP",quality=82,method=6)',
  ].join(';');
  const done = spawnSync(PYTHON, ['-c', py, png, webp], { encoding: 'utf8' });
  if (done.status !== 0) throw new Error(`后处理失败: ${done.stderr || done.stdout}`);
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });

const jobs = [];
// --default 单独使用时只生成默认立绘；与 --character/--only 同用时才同时扫描服装差分。
if (!defaultCharacter || character || only) {
  for (const 名 of Object.keys(人物)) {
    if (character && character !== 名) continue;
    for (const sku of 可穿SKU) {
      const key = `${名}_${sku}`;
      const out = path.join(OUT, `${key}${preview ? '_肤色校准预览' : ''}.webp`);
      if ((!fs.existsSync(out) || force) && (!only || only === key)) jobs.push({ 名, sku, key, out });
    }
  }
}
if (defaultCharacter) {
  if (!人物[defaultCharacter]) throw new Error(`未知角色: ${defaultCharacter}`);
  const key = `${defaultCharacter}_默认`;
  const out = path.join(OUT, `${defaultCharacter}${preview ? '_默认_肤色校准预览' : ''}.webp`);
  if (!fs.existsSync(out) || force) jobs.push({ 名: defaultCharacter, sku: '默认', key, out });
}

console.log(`待生成 ${jobs.length} 张，本次最多 ${Math.min(jobs.length, limit)} 张。`);
let ok = 0;
for (const job of jobs.slice(0, limit)) {
  const started = Date.now();
  try {
    const queued = await (
      await 请求(`${HOST}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 建图(job.名, job.sku) }),
      })
    ).json();
    if (!queued.prompt_id) throw new Error(`排队失败: ${JSON.stringify(queued).slice(0, 400)}`);
    const image = await 等待(queued.prompt_id);
    const png = path.join(TMP, `${job.key}.png`);
    fs.writeFileSync(png, await 下载(image));
    后处理(png, job.out);
    fs.rmSync(png, { force: true });
    ok++;
    console.log(`OK ${job.key} ${((Date.now() - started) / 1000).toFixed(1)}s`);
  } catch (error) {
    console.error(`FAIL ${job.key}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(`完成 ${ok}/${Math.min(jobs.length, limit)}。`);
