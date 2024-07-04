import * as fs from 'fs';
import * as path from 'path';

const filePath: string = path.join(__dirname, 'results/available_domains.json');
const outputPath: string = path.join(__dirname, 'results/filtered_domains.json');
const file: string = fs.readFileSync(filePath, 'utf8');
const domains: string[] = JSON.parse(file);

function filterDomains(domains: string[]): string[] {
  const arabicAndNumbersRegex: RegExp = /[\u0600-\u06FF0-9]/;
  const comDomainRegex: RegExp = /\.com$/;
  const filteredDomains: string[] = domains.filter(domain => 
    comDomainRegex.test(domain) && !arabicAndNumbersRegex.test(domain)
  );
  return filteredDomains;
}

async function main(): Promise<void> {
  const filteredDomains: string[] = filterDomains(domains);
  fs.writeFileSync(outputPath, JSON.stringify(filteredDomains, null, 2));
  console.log(filteredDomains);
}

main();