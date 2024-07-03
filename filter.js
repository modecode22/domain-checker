const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'available_domains.json');
const outputPath = path.join(__dirname, 'filtered_domains.json');
const file = fs.readFileSync(filePath, 'utf8');
const domains = JSON.parse(file);

function filterDomains(domains) {
  const arabicAndNumbersRegex = /[\u0600-\u06FF0-9]/;
  const comDomainRegex = /\.com$/;
  const filteredDomains = domains.filter(domain => 
    comDomainRegex.test(domain) && !arabicAndNumbersRegex.test(domain)
  );
  return filteredDomains;
}

async function main() {
  const filteredDomains = filterDomains(domains);
  fs.writeFileSync(outputPath, JSON.stringify(filteredDomains, null, 2));
  console.log(filteredDomains);
}

main();
