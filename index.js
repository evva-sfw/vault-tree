import { got } from 'got';
import setPath from 'object-path-set';
import { writeFile, open } from 'node:fs/promises';


const VAULT_ADDR = process.env.VAULT_ADDR;
const VAULT_TOKEN = process.env.VAULT_TOKEN;
var pathArray = [];

const BASE_PATH = '/'
await listPath(BASE_PATH);

for (const element of pathArray) {
  await listKeys(element);
}

console.log(pathArray.length);

let baseObject = {};

const filehandle = await open('./paths.txt', 'w+');
for (const element of pathArray.sort()) {
  console.log(element);
  await writeFile(filehandle, element + '\n', 'utf8');
  let oPath = element.replaceAll('/', '.').slice(1);
  baseObject = setPath(baseObject, oPath, null);
}
await filehandle.close();


async function listPath(path) {
  return new Promise(async (resolve, reject) => {
    if(path.startsWith('/users/')){ //ignore path because of personal vault space
      resolve();
      return;
    }
    let keys;
    const data = await got(VAULT_ADDR + '/v1/secret' + path, {
      method: 'LIST',
      headers: {
        'X-Vault-Token': VAULT_TOKEN
      },
      https: {
        rejectUnauthorized: false
      },
      throwHttpErrors: false
    });
    if (data.statusCode != 200) {
      // No permissions
      resolve();
      return;
    }
    console.log('DATA from', path);
    keys = JSON.parse(data.body).data.keys;

    for (let index = 0; index < keys.length; index++) {
      const element = keys[index];
      pathArray.push(path + element);
      await listPath(path + element);
    }
    resolve();
  });
}

async function listKeys(path) {
  return new Promise(async (resolve, reject) => {
    const data = await got(VAULT_ADDR + '/v1/secret' + path, {
      method: 'GET',
      headers: {
        'X-Vault-Token': VAULT_TOKEN
      },
      https: {
        rejectUnauthorized: false
      },
      throwHttpErrors: false
    });
    if (data.statusCode != 200) {
      // No permissions
      resolve();
      return;
    }
    console.log('DATA from', path);
    let object = JSON.parse(data.body).data;
    for (const [key, value] of Object.entries(object)) {
      let keyWithNoSpaces = key.replaceAll(' ', '').replaceAll('"', '');
      pathArray.push(path + '/' + keyWithNoSpaces + '');
    }
    resolve();
  });
}