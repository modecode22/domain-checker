import * as net from 'net';
import * as fs from 'fs';
import { domainNames } from './data';

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface DomainResult {
  domain: string;
  available: boolean;
  error?: string;
}

async function checkDomain(domain: string, retries: number = 3): Promise<DomainResult> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await new Promise<DomainResult>((resolve, reject) => {
        const whoisServer = 'whois.verisign-grs.com';
        const port = 43;
        const timeout = 2000; // 2 seconds timeout

        const client = net.createConnection(port, whoisServer, () => {
          client.write(`${domain}\r\n`);
        });

        let response = '';

        client.setTimeout(timeout);

        client.on('data', (data) => {
          response += data.toString();
        });

        client.on('end', () => {
          const available = parseWhoisResponse(response, domain);
          resolve({ domain, available });
          client.end();
        });

        client.on('timeout', () => {
          client.destroy();
          reject(new Error(`Timeout checking ${domain}`));
        });

        client.on('error', (err) => {
          reject(err);
          client.end();
        });
      });
    } catch (error:any) {
      if (attempt === retries - 1) {
        console.error(`Error checking domain ${domain}:`, error?.message );
        return { domain, available: false, error: error.message };
      }
      await delay(1000 * (attempt + 1)); // Exponential backoff
    }
  }
  // This line is added to satisfy TypeScript, it should never be reached due to the loop above
  return { domain, available: false, error: 'Max retries reached' };
}

function parseWhoisResponse(response: string, domain: string): boolean {
  const noMatch = response.toLowerCase().includes('no match');
  return noMatch;
}

async function checkDomains(domainNames: string[]): Promise<string[]> {
  const domainExtensions = ['.com', '.net'];
  const results: DomainResult[] = [];

  for (const name of domainNames) {
    for (const extension of domainExtensions) {
      const domain = `${name}${extension}`;
      results.push(await checkDomain(domain));
      await delay(200); // Add a 200ms delay between requests
    }
  }

  return results.filter(result => result.available).map(result => result.domain);
}

async function main(): Promise<void> {
  const chunkSize = 20; // Reduced chunk size
  let allAvailableDomains: string[] = [];

  console.log('Starting domain availability check...');

  for (let i = 0; i < domainNames.length; i += chunkSize) {
    const chunk = domainNames.slice(i, i + chunkSize);
    console.log(`Checking domains for domainNames ${i + 1} to ${Math.min(i + chunkSize, domainNames.length)}...`);
    
    try {
      const availableDomains = await checkDomains(chunk);
      allAvailableDomains = allAvailableDomains.concat(availableDomains);
      
      console.log(`Found ${availableDomains.length} available domains in this group.`);
      availableDomains.forEach(domain => {
        console.log(`${domain} is available ✔️`);
      });
    } catch (error) {
      console.error('Error checking domains:', error);
    }
    
    console.log('---');
    await delay(2000); // Add a 2-second delay between chunks
  }

  console.log(`Total available domains found: ${allAvailableDomains.length}`);

  // Write the results to a JSON file
  fs.writeFile('available_domains.json', JSON.stringify(allAvailableDomains, null, 2), (err) => {
    if (err) {
      console.error('Error writing to file:', err);
    } else {
      console.log('Available domains have been written to available_domains.json');
    }
  });
}

main();