const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const platforms = ['pcros', 'ps4', 'xboxone'];
const mainDir = 'bgtunables';

const mainDirPath = path.join(__dirname, '..', mainDir);

const calculateHashes = (data) => {
  const sha256 = crypto.createHash('sha256').update(data).digest('hex');
  const md5 = crypto.createHash('md5').update(data).digest('hex');
  return { sha256, md5 };
};

const downloadTunables = async (platform) => {
  try {
    const platformDir = path.join(mainDirPath, platform);
    await fs.mkdir(platformDir, { recursive: true });

    const url = `http://prod.cloud.rockstargames.com/titles/rdr2/${platform}/0x1a098062.json`;
    const response = await axios.get(url, { responseType: 'json', headers: { 'Content-Type': 'application/json' }, });

    const { sha256 } = calculateHashes(JSON.stringify(response.data));
    const { headers } = response;

    const lastModified = new Date(headers['last-modified']);
    const lastModifiedStr = `${lastModified.getMonth() + 1}-${lastModified.getDate()}-${lastModified.getFullYear()}`;
    const fileName = `tunable_${lastModifiedStr}_${sha256}.json`;

    const filePath = path.join(platformDir, fileName);
    await fs.writeFile(filePath, JSON.stringify(response.data, null, 2));

    const selectedHeaders = {
      'last-modified': headers['last-modified'],
      'date': headers['date'],
      'content-length': headers['content-length'],
      'sha256': sha256,
      'md5': calculateHashes(JSON.stringify(response.data)).md5
    };

    const headersFilePath = path.join(platformDir, `Last-Modified.json`);
    await fs.writeFile(headersFilePath, JSON.stringify(selectedHeaders, null, 2));
    console.log(`Downloaded tunable data for ${platform}`);
  } catch (error) {
    console.error(`Error downloading tunable data for ${platform}:`, error);
  }
};

(async () => {
  try {
    await fs.mkdir(mainDirPath, { recursive: true });
    await Promise.all(platforms.map(downloadTunables));
  } catch (error) {
    console.error('Error:', error);
  }
})();
