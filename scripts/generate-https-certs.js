#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certificatesDir = path.join(__dirname, '..', 'certificates');

// Create certificates directory if it doesn't exist
if (!fs.existsSync(certificatesDir)) {
  fs.mkdirSync(certificatesDir, { recursive: true });
}

const keyPath = path.join(certificatesDir, 'localhost-key.pem');
const certPath = path.join(certificatesDir, 'localhost.pem');

// Check if certificates already exist
if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ HTTPS certificates already exist');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  process.exit(0);
}

console.log('🔐 Generating self-signed HTTPS certificates...');

try {
  // Generate private key
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
  
  // Generate certificate
  execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
  
  console.log('✅ HTTPS certificates generated successfully!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('');
  console.log('⚠️  Note: You may need to accept the self-signed certificate in your browser');
  console.log('   Chrome: Click "Advanced" → "Proceed to localhost (unsafe)"');
  console.log('   Firefox: Click "Advanced" → "Accept the Risk and Continue"');
  
} catch (error) {
  console.error('❌ Error generating certificates:', error.message);
  console.log('');
  console.log('💡 Alternative: Install mkcert for trusted local certificates');
  console.log('   Windows: choco install mkcert');
  console.log('   macOS: brew install mkcert');
  console.log('   Linux: See https://github.com/FiloSottile/mkcert#installation');
  process.exit(1);
}
