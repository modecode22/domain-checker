const whois = require('whois');
const fs = require('fs').promises;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function checkDomain(domain) {
  return new Promise((resolve, reject) => {
    whois.lookup(domain, (err, data) => {
      if (err) {
        reject(err);
      } else {
        const available = !data.includes('Domain Name:') || data.toLowerCase().includes('no match');
        resolve({ domain, available });
      }
    });
  });
}

async function checkDomains(names) {
  const domainExtensions = ['.com', '.net'];
  const results = [];

  for (const name of names) {
    for (const extension of domainExtensions) {
      const domain = `${name}${extension}`;
      try {
        const result = await checkDomain(domain);
        results.push(result);
        console.log(`Checked ${domain}: ${result.available ? 'Available ✔️' : 'Not available ❌'}`);
      } catch (error) {
        console.error(`Error checking ${domain}:`, error.message);
      }
      await delay(1000); // 3 second delay between each check
    }
  }

  return results.filter(result => result.available).map(result => result.domain);
}

async function main() {
  const names = ['booooolean', 'striiing'];  // Change this to your list of names

  const chunkSize = 20; // Reduced chunk size
  let allAvailableDomains = [];

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
    await fs.writeFile('available_domains.json', JSON.stringify(allAvailableDomains, null, 2));
    console.log('Available domains have been written to available_domains.json');
  } catch (err) {
    console.error('Error writing to file:', err);
  }
}

main().catch(console.error);