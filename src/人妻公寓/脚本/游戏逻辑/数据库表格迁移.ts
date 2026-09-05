interface 可迁移表 {
  name?: string;
  content?: unknown[][];
}

/** 只重排明确对应的列；未知额外列、重复列名或无法归属的单元格必须留给调用方停止导入。 */
export function 按列名迁移游戏表(旧表: 可迁移表, 新表: 可迁移表, 可补充列: readonly string[] = []): boolean {
  const 旧内容 = 旧表.content;
  const 新内容 = 新表.content;
  if (!旧内容?.length || !新内容?.length || !Array.isArray(旧内容[0]) || !Array.isArray(新内容[0])) return false;
  const 旧列 = 旧内容[0].map(String);
  const 新列 = 新内容[0].map(String);
  if (旧列.some(列 => !列.trim()) || 新列.some(列 => !列.trim())) return false;
  if (new Set(旧列).size !== 旧列.length || new Set(新列).size !== 新列.length) return false;
  const 旧索引 = new Map(旧列.map((列, 索引) => [列, 索引]));
  if (旧列.some(列 => !新列.includes(列))) return false;
  if (新列.some(列 => !旧索引.has(列) && !可补充列.includes(列))) return false;
  if (旧内容.slice(1).some(行 => !Array.isArray(行) || 行.length > 旧列.length)) return false;
  新表.content = [
    新内容[0],
    ...旧内容.slice(1).map(行 =>
      新列.map(列 => {
        const 索引 = 旧索引.get(列);
        return 索引 === undefined ? '' : (行[索引] ?? null);
      }),
    ),
  ];
  return true;
}
