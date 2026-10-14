const https = require('https');
const http = require('http');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const prodId = '6accbc6176484a630e66584d';
  console.log('Testing prodId:', prodId);

  const urls = [
    `http://localhost:9000/api/store/products/${prodId}`,
    `https://metafit-omega.vercel.app/api/store/products/${prodId}`,
    `http://localhost:9000/api/products/${prodId}`,
    `https://metafit-omega.vercel.app/api/products/${prodId}`
  ];

  for (const url of urls) {
    try {
      console.log(`\nFetching ${url}...`);
      const res = await fetchUrl(url);
      console.log('Status:', res.status);
      if (res.data) {
        console.log('Data:', JSON.stringify(res.data, null, 2));
      } else {
        console.log('Text preview:', res.text.slice(0, 300));
      }
    } catch (err) {
      console.error(`Error fetching ${url}:`, err.message);
    }
  }
}

main();
