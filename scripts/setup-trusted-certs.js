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

console.log('🔐 Setting up trusted local HTTPS certificates with mkcert...');

try {
  // Check if mkcert is installed
  execSync('mkcert -version', { stdio: 'pipe' });
  
  // Install the local CA
  console.log('📋 Installing mkcert root CA...');
  execSync('mkcert -install', { stdio: 'inherit' });
  
  // Generate certificates for localhost
  console.log('🔑 Generating certificates for localhost...');
  execSync(`mkcert -key-file "${keyPath}" -cert-file "${certPath}" localhost 127.0.0.1 ::1`, { 
    stdio: 'inherit',
    cwd: certificatesDir 
  });
  
  console.log('✅ Trusted HTTPS certificates generated successfully!');
  console.log(`   Key: ${keyPath}`);
  console.log(`   Cert: ${certPath}`);
  console.log('');
  console.log('🎉 These certificates are trusted by your system and won\'t show security warnings!');
  
} catch (error) {
  console.error('❌ Error setting up trusted certificates:', error.message);
  console.log('');
  console.log('💡 mkcert is not installed. Please install it first:');
  console.log('   Windows: choco install mkcert');
  console.log('   macOS: brew install mkcert');
  console.log('   Linux: See https://github.com/FiloSottile/mkcert#installation');
  console.log('');
  console.log('🔄 Falling back to self-signed certificates...');
  
  // Fallback to self-signed certificates
  try {
    execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
    execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"`, { stdio: 'inherit' });
    
    console.log('✅ Self-signed certificates generated as fallback');
    console.log('⚠️  Note: You may need to accept the self-signed certificate in your browser');
  } catch (fallbackError) {
    console.error('❌ Failed to generate fallback certificates:', fallbackError.message);
    process.exit(1);
  }
}
