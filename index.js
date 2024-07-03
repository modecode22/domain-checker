const net = require('net');
const fs = require('fs');

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkDomain(domain, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const whoisServer = 'whois.verisign-grs.com';
        const port = 43;
        const timeout = 2000; // 3 seconds timeout

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
    } catch (error) {
      if (attempt === retries - 1) {
        console.error(`Error checking domain ${domain}:`, error.message);
        return { domain, available: false, error: error.message };
      }
      await delay(1000 * (attempt + 1)); // Exponential backoff
    }
  }
}

function parseWhoisResponse(response, domain) {
  const noMatch = response.toLowerCase().includes('no match');
  return noMatch;
}

async function checkDomains(names) {
  const domainExtensions = ['.com', '.net'];
  const results = [];

  for (const name of names) {
    for (const extension of domainExtensions) {
      const domain = `${name}${extension}`;
      results.push(await checkDomain(domain));
      await delay(200); // Add a 200ms delay between requests
    }
  }

  return results.filter(result => result.available).map(result => result.domain);
}

async function main() {
  const names = ['coooler', 'findeeer']  // Change this to your list of names

  const chunkSize = 20; // Reduced chunk size
  let allAvailableDomains = [];

  console.log('Starting domain availability check...');

  for (let i = 0; i < names.length; i += chunkSize) {
    const chunk = names.slice(i, i + chunkSize);
    console.log(`Checking domains for names ${i + 1} to ${Math.min(i + chunkSize, names.length)}...`);
    
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
