#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const certificatesDir = path.join(__dirname, '..', 'certificates');

// Create certificates directory if it doesn't exist
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}

const keyPath = path.join(certificatesDir, 'localhost-key.pem');
const certPath = path.join(certificatesDir, 'localhost.pem');

console.log('🔐 Generating HTTPS certificates for localhost and local network...');

try {
  // Try to use openssl if available
  try {
    execSync('openssl version', { stdio: 'pipe' });
    console.log('✅ Using OpenSSL to generate certificates...');
    
    // Generate private key
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    
    // Create a config file for the certificate with multiple SANs
    const configContent = `[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Organization
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = 192.168.1.185
IP.3 = ::1`;

    const configPath = path.join(certificatesDir, 'cert.conf');
    fs.writeFileSync(configPath, configContent);
    
    // Generate certificate with SANs
    execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -config "${configPath}" -extensions v3_req`, { stdio: 'inherit' });
    
    // Clean up config file
    fs.unlinkSync(configPath);
    
  } catch (opensslError) {
    console.log('⚠️  OpenSSL not found, using Node.js crypto module...');
    
    // Use Node.js crypto module to generate a basic certificate
    const crypto = require('crypto');
    const forge = require('node-forge');
    
    // Generate a keypair
    const keys = forge.pki.rsa.generateKeyPair(2048);
    
    // Create a certificate
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    
    const attrs = [{
      name: 'commonName',
      value: 'localhost'
    }, {
      name: 'countryName',
      value: 'US'
    }, {
      name: 'stateOrProvinceName',
      value: 'State'
    }, {
      name: 'localityName',
      value: 'City'
    }, {
      name: 'organizationName',
      value: 'Organization'
    }];
    
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    
    // Add Subject Alternative Names
    cert.setExtensions([{
      name: 'basicConstraints',
      cA: true
    }, {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    }, {
      name: 'subjectAltName',
      altNames: [{
        type: 2, // DNS
        value: 'localhost'
      }, {
        type: 2, // DNS
        value: '127.0.0.1'
      }, {
        type: 7, // IP
        ip: '127.0.0.1'
      }, {
        type: 7, // IP
        ip: '192.168.1.185'
      }]
    }]);
    
    // Sign the certificate
    cert.sign(keys.privateKey);
    
    // Convert to PEM format
    const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
    const certPem = forge.pki.certificateToPem(cert);
    
    // Write files
    fs.writeFileSync(keyPath, privateKeyPem);
    fs.writeFileSync(certPath, certPem);
  }
  
  console.log('✅ HTTPS certificates generated successfully!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('');
  console.log('🎉 These certificates work for:');
  console.log('   - localhost');
  console.log('   - 127.0.0.1');
  console.log('   - 192.168.1.185');
  console.log('');
  console.log('⚠️  Note: You may need to accept the self-signed certificate in your browser');
  console.log('   Chrome: Click "Advanced" → "Proceed to localhost (unsafe)"');
  console.log('   Firefox: Click "Advanced" → "Accept the Risk and Continue"');
  
} catch (error) {
  console.error('❌ Error generating certificates:', error.message);
  console.log('');
  console.log('💡 Please install OpenSSL or mkcert for certificate generation');
  console.log('   Windows: Download OpenSSL from https://slproweb.com/products/Win32OpenSSL.html');
  console.log('   Or install mkcert: choco install mkcert');
  process.exit(1);
}
