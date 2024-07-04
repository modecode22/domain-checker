import * as whois from 'whois';
import * as fs from 'fs/promises';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface DomainResult {
  domain: string;
  available: boolean;
}

function checkDomain(domain: string): Promise<DomainResult> {
  return new Promise((resolve, reject) => {
    whois.lookup(domain, (err: Error | null, data: string) => {
      if (err) {
        reject(err);
      } else {
        const available = !data.includes('Domain Name:') || data.toLowerCase().includes('no match');
        resolve({ domain, available });
      }
    });
  });
}

async function checkDomains(names: string[]): Promise<string[]> {
  const domainExtensions = ['.com', '.net'];
  const results: DomainResult[] = [];

  for (const name of names) {
    for (const extension of domainExtensions) {
      const domain = `${name}${extension}`;
      try {
        const result = await checkDomain(domain);
        results.push(result);
        console.log(`Checked ${domain}: ${result.available ? 'Available ✔️' : 'Not available ❌'}`);
      } catch (error) {
        console.error(`Error checking ${domain}:`, (error as Error).message);
      }
      await delay(1000); // 1 second delay between each check
    }
  }

  return results.filter(result => result.available).map(result => result.domain);
}

async function main(): Promise<void> {
  const names = ['booooolean', 'striiing'];  // Change this to your list of names

  const chunkSize = 20; // Reduced chunk size
  let allAvailableDomains: string[] = [];

  console.log('Starting domain availability check...');

  for (let i = 0; i < names.length; i += chunkSize) {
    const chunk = names.slice(i, i + chunkSize);
    console.log(`Checking domains for names ${i + 1} to ${Math.min(i + chunkSize, names.length)}...`);
    
    const availableDomains = await checkDomains(chunk);
    allAvailableDomains = allAvailableDomains.concat(availableDomains);
    
    console.log(`Found ${availableDomains.length} available domains in this group.`);
    console.log('---');
    await delay(10000); // 10 second delay between chunks
  }

  console.log(`Total available domains found: ${allAvailableDomains.length}`);

  // Write the results to a JSON file
  try {
    await fs.writeFile('src/results/available_domains.json', JSON.stringify(allAvailableDomains, null, 2));
    console.log('Available domains have been written to available_domains.json');
  } catch (err) {
    console.error('Error writing to file:', (err as Error).message);
  }
}

main().catch(err => console.error('Unhandled error:', (err as Error).message));