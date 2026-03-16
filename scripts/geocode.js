const fs = require('fs');
const readline = require('readline');
const https = require('https');

// CSV columns: 연번,자치구,단지번호,소재지주소,호,저층여부,전용면적,방개수,승강기설치,기계식주차장,주차대수
const inputFile = '주택목록v2_filtered_over36_unique.csv';
const outputFile = 'src/data/locations.json';

// You will need to set NAVER_CLIENT_ID and NAVER_CLIENT_SECRET environment variables
let clientId = process.env.NAVER_CLIENT_ID;
let clientSecret = process.env.NAVER_CLIENT_SECRET;

// Manually parse .env.local if env variables not set
if ((!clientId || !clientSecret) && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      if (match[1] === 'NAVER_CLIENT_ID') clientId = match[2].trim();
      if (match[1] === 'NAVER_CLIENT_SECRET') clientSecret = match[2].trim();
    }
  });
}

if (!clientId || !clientSecret || clientId === '실제_아이디값을_넣어주세요' || clientSecret === '실제_시크릿값을_넣어주세요') {
  console.error("NAVER_CLIENT_ID and NAVER_CLIENT_SECRET environment variables are required and must be replaced with real values.");
  process.exit(1);
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function geocodeAddress(address) {
  return new Promise((resolve, reject) => {
    // Extract base address (remove parentheses details for better geocoding accuracy)
    let cleanedAddress = address.replace(/\([^)]+\)/g, '').trim();

    const encodedAddress = encodeURIComponent(cleanedAddress);
    const options = {
      // Changed to maps.apigw.ntruss.com based on updated Naver API docs
      hostname: 'maps.apigw.ntruss.com',
      port: 443,
      path: `/map-geocode/v2/geocode?query=${encodedAddress}`,
      method: 'GET',
      headers: {
        'x-ncp-apigw-api-key-id': clientId,
        'x-ncp-apigw-api-key': clientSecret,
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.addresses && result.addresses.length > 0) {
            resolve({
              lat: result.addresses[0].y,
              lng: result.addresses[0].x
            });
          } else {
            console.warn(`Could not geocode address: ${address} (Cleaned: ${cleanedAddress})`);
            resolve(null);
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function processCSV() {
  const locations = [];
  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    // Split by comma, handling case where address has commas inside quotes
    const columns = [];
    let curVal = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            columns.push(curVal.trim());
            curVal = '';
        } else {
            curVal += char;
        }
    }
    columns.push(curVal.trim());

    if (columns.length < 11) continue;

    const id = columns[0];
    const gu = columns[1];
    const complexId = columns[2];
    const address = columns[3];
    const floor = columns[4];
    const isLowFloor = columns[5];
    const area = columns[6];
    const rooms = columns[7];

    console.log(`Geocoding: ${address}`);
    
    try {
        const coords = await geocodeAddress(address);
        
        if (coords) {
            locations.push({
                id,
                gu,
                address,
                area,
                rooms,
                lat: coords.lat,
                lng: coords.lng
            });
        }
        
        // Rate limit 
        await sleep(100); 
    } catch (e) {
        console.error(`Error processing ${address}`, e);
    }
  }

  // create directory if not exists
  if (!fs.existsSync('src/data')) {
    fs.mkdirSync('src/data', { recursive: true });
  }

  fs.writeFileSync(outputFile, JSON.stringify(locations, null, 2));
  console.log(`Finished processing. Saved ${locations.length} locations to ${outputFile}`);
}

processCSV().catch(console.error);
