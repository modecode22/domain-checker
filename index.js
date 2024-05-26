const net = require('net');

async function checkDomain(domain) {
  return new Promise((resolve, reject) => {
    const whoisServer = 'whois.verisign-grs.com'; // WHOIS server for .com domains
    const port = 43; // Standard WHOIS port

    const client = net.createConnection(port, whoisServer, () => {
      client.write(`${domain}\r\n`);
    });

    let response = '';

    client.on('data', (data) => {
      response += data.toString();
    });

    client.on('end', () => {
      const available = parseWhoisResponse(response, domain);
      resolve({ domain, available });
      client.end();
    });

    client.on('error', (err) => {
      console.error(`Error checking domain ${domain}:`, err);
      reject(err);
      client.end();
    });
  });
}

function parseWhoisResponse(response, domain) {
  // Implement your logic to parse the WHOIS response
  // and determine if the domain is available or not
  // based on the contents of the response data.

  // For example, you could check for specific strings or patterns
  // that indicate the domain is available or taken.

  // Here's a simple example that checks if the response contains "No match"
  const noMatch = response.toLowerCase().includes('no match');
  return noMatch;
}

async function checkDomains(domains) {
  try {
    const results = await Promise.all(domains.map(domain => checkDomain(domain)));
    results.forEach(result => {
      result.available ? console.log(`${result.domain} is available ✔️`) : null
      // console.log(`${result.domain} is ${result.available ? 'available ✔️' : 'taken ❌'}`);
    });
  } catch (error) {
    console.error(`Error checking domains:`, error);
  }
}


// you put your lise of domains here and you'll get if thier available or not
const domains = [
  "Takreem.com",
  "Shajarah.com",
  "Tafkeer.com",
  "Shoq.com"
];

checkDomains(domains);