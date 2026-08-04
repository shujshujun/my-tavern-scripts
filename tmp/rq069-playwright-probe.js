async page => {
  return await page.evaluate(async () => {
    const source = await (await fetch('/scripts/itemized-prompts.js')).text();
    const start = source.indexOf('function promptItemize');
    return source.slice(start, start + 5000);
  });
}
