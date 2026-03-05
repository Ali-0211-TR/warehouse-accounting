#!/usr/bin/env node

/**
 * Sync version across package.json, tauri.conf.json, and Cargo.toml
 * Usage: npm run version:sync
 */

const fs = require('fs');
const path = require('path');

// Read tauri.conf.json as the source of truth
const tauriConfigPath = path.join(__dirname, '../src-tauri/tauri.conf.json');
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
const version = tauriConfig.version;

console.log(`📦 Syncing version to: ${version}`);

// Update package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
packageJson.version = version;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log(`✅ Updated package.json to ${version}`);

// Update Cargo.toml
const cargoTomlPath = path.join(__dirname, '../src-tauri/Cargo.toml');
let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
cargoToml = cargoToml.replace(/^version = ".*"$/m, `version = "${version}"`);
fs.writeFileSync(cargoTomlPath, cargoToml);
console.log(`✅ Updated Cargo.toml to ${version}`);

console.log('\n🎉 All version files synced successfully!');
console.log(`   Version: ${version}`);
console.log('   Files updated:');
console.log('   - package.json');
console.log('   - src-tauri/Cargo.toml');
console.log('   - src-tauri/tauri.conf.json (source of truth)');
