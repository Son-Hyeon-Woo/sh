const fs = require('fs');
const readline = require('readline');

const csvFile = '/Users/hyeonwoo.son/Desktop/sh/house_v2_filtered_over36_unique.csv';
const jsonFile = '/Users/hyeonwoo.son/Desktop/sh/src/data/locations.json';

async function mergeData() {
  console.log('Reading JSON...');
  const jsonRaw = fs.readFileSync(jsonFile, 'utf8');
  let locations = JSON.parse(jsonRaw);
  console.log(`Loaded ${locations.length} locations from JSON.`);

  console.log('Reading CSV...');
  const fileStream = fs.createReadStream(csvFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;
  let matchCount = 0;

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

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

    if (columns.length < 13) continue;

    const id = columns[0];
    const deposit = columns[11];
    const rent = columns[12];

    const loc = locations.find(l => String(l.id) === String(id));
    if (loc) {
      loc.deposit = deposit;
      loc.rent = rent;
      matchCount++;
    }
  }

  console.log(`Matched and updated ${matchCount} locations.`);
  fs.writeFileSync(jsonFile, JSON.stringify(locations, null, 2));
  console.log('Saved to locations.json');
}

mergeData().catch(console.error);
