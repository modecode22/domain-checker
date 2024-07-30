import net from 'net';
import fs from 'fs/promises';
import winston from 'winston';
import Bottleneck from 'bottleneck';
import NodeCache from 'node-cache';
import { Command } from 'commander';
import { domainNames } from './data';

// Improved TypeScript configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

const cache = new NodeCache({ stdTTL: 3600 }); // Cache WHOIS results for 1 hour

const program = new Command();
program
  .option('-c, --concurrency <number>', 'number of concurrent checks', '5')
  .option('-r, --retries <number>', 'number of retries for each domain', '3')
  .option('-d, --delay <number>', 'delay between checks in ms', '200')
  .parse(process.argv);

const options = program.opts();

// Custom error classes
class WhoisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WhoisError';
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Improved types
interface DomainResult {
  domain: string;
  available: boolean;
  error?: string;
}

// Helper function for delay
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Improved error handling and async/await usage
async function checkDomain(domain: string, retries: number = 3): Promise<DomainResult> {
  const cachedResult = cache.get<DomainResult>(domain);
  if (cachedResult) {
    logger.info(`Cache hit for ${domain}`);
    return cachedResult;
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await queryWhoisServer(domain);
      cache.set(domain, result);
      return result;
    } catch (error) {
      if (error instanceof TimeoutError || error instanceof WhoisError) {
        logger.warn(`Attempt ${attempt + 1} failed for ${domain}: ${error.message}`);
        if (attempt === retries - 1) {
          logger.error(`All attempts failed for ${domain}`);
          return { domain, available: false, error: error.message };
        }
        await delay(1000 * Math.pow(2, attempt)); // Exponential backoff
      } else {
        throw error; // Rethrow unexpected errors
      }
    }
  }
  return { domain, available: false, error: 'Max retries reached' };
}

async function queryWhoisServer(domain: string): Promise<DomainResult> {
  return new Promise<DomainResult>((resolve, reject) => {
    const whoisServer = 'whois.verisign-grs.com';
    const port = 43;
    const timeout = 2000;

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
      reject(new TimeoutError(`Timeout checking ${domain}`));
    });

    client.on('error', (err) => {
      reject(new WhoisError(`Error checking ${domain}: ${err.message}`));
      client.end();
    });
  });
}

function parseWhoisResponse(response: string, domain: string): boolean {
  return response.toLowerCase().includes('no match');
}

async function checkDomains(domainNames: string[]): Promise<DomainResult[]> {
  const domainExtensions = ['.com', '.net'];
  const limiter = new Bottleneck({
    maxConcurrent: Number(options.concurrency),
    minTime: Number(options.delay),
  });

  const checks = domainNames.flatMap(name => 
    domainExtensions.map(ext => 
      limiter.schedule(() => checkDomain(`${name}${ext}`, Number(options.retries)))
    )
  );

  return Promise.all(checks);
}

async function main(): Promise<void> {
  const chunkSize = 20;
  let allResults: DomainResult[] = [];

  logger.info('Starting domain availability check...');

  for (let i = 0; i < domainNames.length; i += chunkSize) {
    const chunk = domainNames.slice(i, i + chunkSize);
    logger.info(`Checking domains for domainNames ${i + 1} to ${Math.min(i + chunkSize, domainNames.length)}...`);
    
    try {
      const results = await checkDomains(chunk);
      allResults = allResults.concat(results);
      
      const availableDomains = results.filter(result => result.available);
      logger.info(`Found ${availableDomains.length} available domains in this group.`);
      availableDomains.forEach(domain => {
        logger.info(`${domain.domain} is available ✔️`);
      });
    } catch (error) {
      logger.error('Error checking domains:', error);
    }
    
    await delay(Number(options.delay));
  }

  const availableDomains = allResults.filter(result => result.available).map(result => result.domain);
  logger.info(`Total available domains found: ${availableDomains.length}`);

  try {
    await fs.writeFile('src/results/available_domains.json', JSON.stringify(availableDomains, null, 2));
    logger.info('Available domains have been written to available_domains.json');
  } catch (error) {
    logger.error('Error writing to file:', error);
  }
}

main().catch(error => {
  logger.error('Unhandled error in main:', error);
  process.exit(1);
});

// import * as net from 'net';
// import * as fs from 'fs';
// import { domainNames } from './data';

// function delay(ms: number): Promise<void> {
//   return new Promise(resolve => setTimeout(resolve, ms));
// }

// interface DomainResult {
//   domain: string;
//   available: boolean;
//   error?: string;
// }

// async function checkDomain(domain: string, retries: number = 3): Promise<DomainResult> {
//   for (let attempt = 0; attempt < retries; attempt++) {
//     try {
//       return await new Promise<DomainResult>((resolve, reject) => {
//         const whoisServer = 'whois.verisign-grs.com';
//         const port = 43;
//         const timeout = 2000; // 2 seconds timeout

//         const client = net.createConnection(port, whoisServer, () => {
//           client.write(`${domain}\r\n`);
//         });

//         let response = '';

//         client.setTimeout(timeout);

//         client.on('data', (data) => {
//           response += data.toString();
//         });

//         client.on('end', () => {
//           const available = parseWhoisResponse(response, domain);
//           resolve({ domain, available });
//           client.end();
//         });

//         client.on('timeout', () => {
//           client.destroy();
//           reject(new Error(`Timeout checking ${domain}`));
//         });

//         client.on('error', (err) => {
//           reject(err);
//           client.end();
//         });
//       });
//     } catch (error:any) {
//       if (attempt === retries - 1) {
//         console.error(`Error checking domain ${domain}:`, error?.message );
//         return { domain, available: false, error: error.message };
//       }
//       await delay(1000 * (attempt + 1)); // Exponential backoff
//     }
//   }
//   // This line is added to satisfy TypeScript, it should never be reached due to the loop above
//   return { domain, available: false, error: 'Max retries reached' };
// }

// function parseWhoisResponse(response: string, domain: string): boolean {
//   const noMatch = response.toLowerCase().includes('no match');
//   return noMatch;
// }

// async function checkDomains(domainNames: string[]): Promise<string[]> {
//   const domainExtensions = ['.com', '.net'];
//   const results: DomainResult[] = [];

//   for (const name of domainNames) {
//     for (const extension of domainExtensions) {
//       const domain = `${name}${extension}`;
//       results.push(await checkDomain(domain));
//       await delay(200); // Add a 200ms delay between requests
//     }
//   }

//   return results.filter(result => result.available).map(result => result.domain);
// }

// async function main(): Promise<void> {
//   const chunkSize = 20; // Reduced chunk size
//   let allAvailableDomains: string[] = [];

//   console.log('Starting domain availability check...');

//   for (let i = 0; i < domainNames.length; i += chunkSize) {
//     const chunk = domainNames.slice(i, i + chunkSize);
//     console.log(`Checking domains for domainNames ${i + 1} to ${Math.min(i + chunkSize, domainNames.length)}...`);
    
//     try {
//       const availableDomains = await checkDomains(chunk);
//       allAvailableDomains = allAvailableDomains.concat(availableDomains);
      
//       console.log(`Found ${availableDomains.length} available domains in this group.`);
//       availableDomains.forEach(domain => {
//         console.log(`${domain} is available ✔️`);
//       });
//     } catch (error) {
//       console.error('Error checking domains:', error);
//     }
    
//     console.log('---');
//     await delay(2000); // Add a 2-second delay between chunks
//   }

//   console.log(`Total available domains found: ${allAvailableDomains.length}`);

//   // Write the results to a JSON file
//   fs.writeFile('src/results/available_domains.json', JSON.stringify(allAvailableDomains, null, 2), (err) => {
//     if (err) {
//       console.error('Error writing to file:', err);
//     } else {
//       console.log('Available domains have been written to available_domains.json');
//     }
//   });
// }

// main();