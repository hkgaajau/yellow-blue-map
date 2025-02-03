import { open, opendir, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import path from 'node:path';

const shopsPath = 'content/shops/';

const titleMapping = {};
const dir = await opendir(shopsPath);

for await (const dirent of dir) {
  let readHandle = null;
  try {
    readHandle = await open(path.join(shopsPath, dirent.name));
    const rl = createInterface({ input: readHandle.createReadStream({ encoding: 'utf-8' }), crlfDelay: Infinity });

    for await (const line of rl) {
      let match = null;
      if ((match = /^title: '(.+)'/.exec(line)) != null) {
        const originalTitle = match[1].replaceAll("''", "'")
        // convert title to NFKD form and remove combining diacritical marks
        const newTitle = originalTitle.normalize('NFKD').replace(/[\u0300-\u036f]/g, "");

        // add mapping only if titles are different to save space; hugo can handle simple lowercase conversion
        if (newTitle !== originalTitle) {
          // convert to lowercase for searching
          titleMapping[originalTitle] = newTitle.toLowerCase();
        }

        // stop processing current file
        break;
      }
    }
  } finally {
    readHandle?.close();
  }
}

await writeFile('assets/data/shop_search_titles.json', JSON.stringify(titleMapping))
