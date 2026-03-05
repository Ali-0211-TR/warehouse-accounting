use aes_gcm::{
    Aes256Gcm, Key, Nonce,
    aead::{Aead, KeyInit},
};
use chrono::{DateTime, Utc};
use rand::{Rng, random};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};

use crate::shared::license::{License, LicenseError};

// Obfuscated storage keys (change these in production)
const CACHE_ENCRYPTION_KEY: &[u8; 32] = b"k9#mX8$vN2@pL7!qR5^wE3&nF6*jH4%z";
const INTEGRITY_SALT: &[u8; 32] = b"7k#9mP2$vL8@xN5!qR3^wE6&nF4*jH1%";
pub const NUM_COUNT: u32 = 10;
#[derive(Debug, Clone, Serialize, Deserialize)]
struct LicenseCacheInternal {
    pub machine_id: String,
    pub last_online_check: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub offline_run_count: u32,
    pub max_offline_runs: u32,
    pub last_offline_run: Option<DateTime<Utc>>,
    pub integrity_hash: String,
    pub nonce_counter: u64,
    /// Cached license expiry date (persisted from last online validation)
    #[serde(default)]
    pub expiry_date: Option<DateTime<Utc>>,
    /// Cached license type name (e.g. "Demo", "Standard", "Professional")
    #[serde(default)]
    pub license_type_name: Option<String>,
    /// Cached issued_to (company/person name)
    #[serde(default)]
    pub issued_to: Option<String>,
}

#[derive(Debug, Clone)]
pub struct LicenseCache {
    inner: LicenseCacheInternal,
    license: Option<License>,
}

impl LicenseCache {
    fn new() -> Self {
        let inner = LicenseCacheInternal {
            machine_id: Self::generate_machine_id(),
            last_online_check: None,
            created_at: Utc::now(),
            offline_run_count: 0,
            max_offline_runs: NUM_COUNT,
            last_offline_run: None,
            integrity_hash: String::new(),
            nonce_counter: random(),
            expiry_date: None,
            license_type_name: None,
            issued_to: None,
        };

        let mut cache = Self {
            inner,
            license: None,
        };
        cache.update_integrity_hash();
        cache
    }

    fn update_integrity_hash(&mut self) {
        let expiry_ts = self.inner.expiry_date.map(|d| d.timestamp()).unwrap_or(0);
        let data = format!(
            "{}:{}:{}:{}:{}:{}:{}",
            self.inner.machine_id,
            self.inner.offline_run_count,
            self.inner.max_offline_runs,
            self.inner.created_at.timestamp(),
            self.inner.nonce_counter,
            std::env::var("USER").unwrap_or_default(),
            expiry_ts
        );

        let mut hasher = Sha256::default();
        hasher.update(data.as_bytes());
        hasher.update(INTEGRITY_SALT);
        self.inner.integrity_hash = format!("{:x}", hasher.finalize());
    }

    fn verify_integrity(&self) -> bool {
        let expiry_ts = self.inner.expiry_date.map(|d| d.timestamp()).unwrap_or(0);
        let expected_data = format!(
            "{}:{}:{}:{}:{}:{}:{}",
            self.inner.machine_id,
            self.inner.offline_run_count,
            self.inner.max_offline_runs,
            self.inner.created_at.timestamp(),
            self.inner.nonce_counter,
            std::env::var("USER").unwrap_or_default(),
            expiry_ts
        );

        let mut hasher = Sha256::default();
        hasher.update(expected_data.as_bytes());
        hasher.update(INTEGRITY_SALT);
        let expected_hash = format!("{:x}", hasher.finalize());

        self.inner.integrity_hash == expected_hash
    }

    // Getters with integrity check
    pub fn machine_id(&self) -> Result<String, LicenseError> {
        if !self.verify_integrity() {
            return Err(LicenseError::TamperingDetected);
        }
        Ok(self.inner.machine_id.clone())
    }

    pub fn offline_run_count(&self) -> Result<u32, LicenseError> {
        if !self.verify_integrity() {
            return Err(LicenseError::TamperingDetected);
        }
        Ok(self.inner.offline_run_count)
    }

    pub fn max_offline_runs(&self) -> Result<u32, LicenseError> {
        if !self.verify_integrity() {
            return Err(LicenseError::TamperingDetected);
        }
        Ok(self.inner.max_offline_runs)
    }

    // pub fn get_license(&self) -> Result<Option<License>, LicenseError> {
    //     if !self.verify_integrity() {
    //         return Err(LicenseError::TamperingDetected);
    //     }
    //     Ok(self.license.clone())
    // }

    pub fn set_license(&mut self, license: License) -> Result<(), LicenseError> {
        // Persist expiry info into the encrypted cache (survives restarts)
        self.inner.expiry_date = license.license_type.get_expiry_date();
        self.inner.license_type_name = Some(license.license_type.get_type_name());
        self.inner.issued_to = Some(license.issued_to.clone());
        self.license = Some(license);
        self.inner.nonce_counter += 1;
        self.update_integrity_hash();
        Ok(())
    }

    pub fn expiry_date(&self) -> Option<DateTime<Utc>> {
        if !self.verify_integrity() {
            return None;
        }
        self.inner.expiry_date
    }

    pub fn license_type_name(&self) -> Option<String> {
        if !self.verify_integrity() {
            return None;
        }
        self.inner.license_type_name.clone()
    }

    pub fn issued_to(&self) -> Option<String> {
        if !self.verify_integrity() {
            return None;
        }
        self.inner.issued_to.clone()
    }

    /// Calculate days remaining until license expiry.
    /// Returns None for perpetual licenses or if no expiry is set.
    pub fn days_remaining(&self) -> Option<i64> {
        self.inner.expiry_date.map(|expiry| {
            expiry.signed_duration_since(Utc::now()).num_days()
        })
    }

    // pub fn clear_license(&mut self) -> Result<(), LicenseError> {
    //     self.license = None;
    //     self.inner.nonce_counter += 1;
    //     self.update_integrity_hash();
    //     Ok(())
    // }

    // pub fn has_valid_license(&self) -> bool {
    //     if !self.verify_integrity() {
    //         return false;
    //     }

    //     if let Some(license) = &self.license {
    //         // Check if license is expired
    //         if let Some(expiry_date) = license.license_type.get_expiry_date() {
    //             return Utc::now() <= expiry_date;
    //         }
    //         return true; // Permanent license
    //     }
    //     false
    // }

    pub fn get_license_features(&self) -> Vec<String> {
        if !self.verify_integrity() {
            return vec![];
        }

        if let Some(license) = &self.license {
            license.license_type.get_features()
        } else {
            vec![] // No license = no features
        }
    }

    // pub fn has_feature(&self, feature: &str) -> bool {
    //     self.get_license_features().contains(&feature.to_string())
    // }

    fn generate_machine_id() -> String {
        let mut hasher = DefaultHasher::new();

        // Collect multiple hardware identifiers
        let mut hw_parts = Vec::new();

        // CPU info
        if let Ok(output) = std::process::Command::new("sysctl")
            .args(["-n", "machdep.cpu.brand_string"])
            .output()
        {
            if let Ok(cpu_info) = String::from_utf8(output.stdout) {
                hw_parts.push(cpu_info.trim().to_string());
            }
        }

        // Hardware UUID
        if let Ok(output) = std::process::Command::new("system_profiler")
            .args(["SPHardwareDataType"])
            .output()
        {
            if let Ok(hw_info) = String::from_utf8(output.stdout) {
                for line in hw_info.lines() {
                    if line.contains("Hardware UUID") {
                        if let Some(uuid) = line.split(':').nth(1) {
                            hw_parts.push(uuid.trim().to_string());
                        }
                    }
                }
            }
        }

        // Motherboard serial
        if let Ok(output) = std::process::Command::new("ioreg")
            .args(["-rd1", "-c", "IOPlatformExpertDevice"])
            .output()
        {
            if let Ok(ioreg_info) = String::from_utf8(output.stdout) {
                // Extract serial number and other unique identifiers
                for line in ioreg_info.lines() {
                    if line.contains("IOPlatformSerialNumber") {
                        if let Some(serial) = line.split('"').nth(3) {
                            hw_parts.push(serial.to_string());
                        }
                    }
                }
            }
        }

        // Fallback to system info if hardware detection fails
        if hw_parts.is_empty() {
            hw_parts.push(format!(
                "fallback-{}",
                Utc::now().timestamp_nanos_opt().unwrap_or(0)
            ));
        }

        let combined = hw_parts.join("|");
        combined.hash(&mut hasher);
        format!("texnouz-{:x}", hasher.finish())
    }
}

pub struct LicenseStorage;

impl LicenseStorage {
    // Multiple cache locations for redundancy
    fn get_cache_paths() -> Result<Vec<std::path::PathBuf>, LicenseError> {
        let mut paths = Vec::new();

        // Primary location
        if let Some(home_dir) = dirs::home_dir() {
            paths.push(home_dir.join(".texnouz").join("license_cache.dat"));
        }

        // Secondary location (hidden)
        if let Some(data_dir) = dirs::data_dir() {
            paths.push(data_dir.join(".app_data").join("tex_cache.bin"));
        }

        // Tertiary location (system temp)
        let temp_path = std::env::temp_dir()
            .join(".sys_cache")
            .join("app_state.enc");
        paths.push(temp_path);

        Ok(paths)
    }

    fn encrypt_cache_data(cache: &LicenseCache) -> Result<Vec<u8>, LicenseError> {
        let key = Key::<Aes256Gcm>::from_slice(CACHE_ENCRYPTION_KEY);
        let cipher = Aes256Gcm::new(key);

        // Generate random nonce
        let mut nonce_bytes = [0u8; 12];
        rand::rngs::ThreadRng::default().fill(&mut nonce_bytes);
        let nonce = Nonce::from_slice(&nonce_bytes);

        let serialized =
            serde_json::to_vec(&cache.inner).map_err(|e| LicenseError::IoError(e.to_string()))?;

        let encrypted = cipher
            .encrypt(nonce, serialized.as_ref())
            .map_err(|e| LicenseError::IoError(e.to_string()))?;

        // Combine nonce + encrypted data
        let mut result = nonce_bytes.to_vec();
        result.extend_from_slice(&encrypted);

        Ok(result)
    }

    fn decrypt_cache_data(encrypted_data: &[u8]) -> Result<LicenseCache, LicenseError> {
        if encrypted_data.len() < 12 {
            return Err(LicenseError::IoError("Invalid cache data".to_string()));
        }

        let key = Key::<Aes256Gcm>::from_slice(CACHE_ENCRYPTION_KEY);
        let cipher = Aes256Gcm::new(key);

        let (nonce_bytes, ciphertext) = encrypted_data.split_at(12);
        let nonce = Nonce::from_slice(nonce_bytes);

        let decrypted = cipher
            .decrypt(nonce, ciphertext)
            .map_err(|e| LicenseError::IoError(e.to_string()))?;

        let inner: LicenseCacheInternal =
            serde_json::from_slice(&decrypted).map_err(|e| LicenseError::IoError(e.to_string()))?;

        let cache = LicenseCache {
            inner,
            license: None,
        };

        // Verify integrity
        if !cache.verify_integrity() {
            return Err(LicenseError::TamperingDetected);
        }

        Ok(cache)
    }

    pub fn load_cache() -> Result<LicenseCache, LicenseError> {
        let paths = Self::get_cache_paths()?;

        // Try to load from any valid cache file
        for path in &paths {
            if path.exists() {
                if let Ok(encrypted_data) = fs::read(path) {
                    if let Ok(cache) = Self::decrypt_cache_data(&encrypted_data) {
                        // println!("Loaded license cache: {:?}", cache);
                        return Ok(cache);
                    }
                }
            }
        }

        // If no valid cache found, create new one
        let mut new_cache = LicenseCache::new();
        new_cache.inner.offline_run_count = new_cache.inner.max_offline_runs; // Set max offline runs to 0
        Ok(new_cache)
    }

    pub fn save_cache(cache: &LicenseCache) -> Result<(), LicenseError> {
        let paths = Self::get_cache_paths()?;
        let encrypted_data = Self::encrypt_cache_data(cache)?;
        //  println!("Saving license cache: {:?}", cache);
        // Save to all locations for redundancy
        for path in &paths {
            if let Some(parent) = path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            let _ = fs::write(path, &encrypted_data);
        }

        Ok(())
    }

    pub fn get_machine_id() -> String {
        match Self::load_cache() {
            Ok(cache) => cache.machine_id().unwrap_or_else(|_| {
                // If tampering detected, regenerate
                Self::handle_tampering()
            }),
            Err(_) => {
                let new_cache = LicenseCache::new();
                let _ = Self::save_cache(&new_cache);
                new_cache.inner.machine_id
            }
        }
    }

    pub fn increment_offline_run() -> Result<u32, LicenseError> {
        let mut cache = Self::load_cache()?;
        cache.inner.offline_run_count += 1;
        cache.inner.last_offline_run = Some(Utc::now());
        cache.inner.nonce_counter += 1;
        cache.update_integrity_hash();

        Self::save_cache(&cache)?;
        Ok(cache.inner.offline_run_count)
    }

    pub fn reset_offline_runs() -> Result<(), LicenseError> {
        let mut cache = Self::load_cache()?;
        // println!("Resetting offline runs for machine ID: {}", cache.inner.machine_id);
        cache.inner.offline_run_count = 0;
        cache.inner.max_offline_runs = NUM_COUNT;
        cache.inner.last_online_check = Some(Utc::now());
        cache.inner.last_offline_run = None;
        cache.inner.nonce_counter += 1;
        cache.update_integrity_hash();

        Self::save_cache(&cache)?;
        Ok(())
    }

    pub fn can_run_offline() -> Result<bool, LicenseError> {
        let cache = Self::load_cache()?;
        let count = cache.offline_run_count()?;
        let max = cache.max_offline_runs()?;

        // Check if last online check was more than 10 days ago
        if let Some(last_check) = cache.inner.last_online_check {
            let days_since_check = Utc::now().signed_duration_since(last_check).num_days();
            if days_since_check > 10 {
                // println!("Last online check was {} days ago - online validation required", days_since_check);
                return Ok(false);
            }
        } else {
            // No previous online check recorded - require online validation
            // println!("No previous online check recorded - online validation required");
            return Ok(false);
        }

        // println!("Can run offline count: {} < max: {}", count, max);
        Ok(count < max)
    }

    fn handle_tampering() -> String {
        // If tampering is detected, take defensive action
        println!("⚠️ [SECURITY] Cache tampering detected - regenerating machine ID");

        // Delete all cache files
        if let Ok(paths) = Self::get_cache_paths() {
            for path in paths {
                let _ = fs::remove_file(path);
            }
        }

        // Create new cache with reset counters (but max offline runs = 0 as penalty)
        let mut new_cache = LicenseCache::new();
        new_cache.inner.max_offline_runs = 0; // Force online validation
        new_cache.update_integrity_hash();

        let _ = Self::save_cache(&new_cache);
        new_cache.inner.machine_id
    }

    // License management methods
    pub fn save_license(license: License) -> Result<(), LicenseError> {
        let mut cache = Self::load_cache()?;
        cache.set_license(license)?;
        Self::save_cache(&cache)?;
        Ok(())
    }

    // pub fn get_license() -> Result<Option<License>, LicenseError> {
    //     let cache = Self::load_cache()?;
    //     cache.get_license()
    // }

    // pub fn clear_license() -> Result<(), LicenseError> {
    //     let mut cache = Self::load_cache()?;
    //     cache.clear_license()?;
    //     Self::save_cache(&cache)?;
    //     Ok(())
    // }

    // pub fn has_valid_license() -> bool {
    //     match Self::load_cache() {
    //         Ok(cache) => cache.has_valid_license(),
    //         Err(_) => false,
    //     }
    // }

    pub fn get_license_features() -> Vec<String> {
        match Self::load_cache() {
            Ok(cache) => cache.get_license_features(),
            Err(_) => vec![],
        }
    }

    /// Get the number of days remaining on the license.
    /// Returns None for perpetual licenses or if cache is unavailable.
    pub fn get_days_remaining() -> Option<i64> {
        Self::load_cache().ok().and_then(|c| c.days_remaining())
    }

    /// Get the cached license type name (e.g. "Demo", "Standard").
    pub fn get_license_type_name() -> Option<String> {
        Self::load_cache().ok().and_then(|c| c.license_type_name())
    }

    /// Get the cached license expiry date as ISO 8601 string.
    pub fn get_expiry_date() -> Option<String> {
        Self::load_cache()
            .ok()
            .and_then(|c| c.expiry_date())
            .map(|d| d.to_rfc3339())
    }

    /// Get the cached issued_to field.
    pub fn get_issued_to() -> Option<String> {
        Self::load_cache().ok().and_then(|c| c.issued_to())
    }

    // pub fn has_feature(feature: &str) -> bool {
    //     match Self::load_cache() {
    //         Ok(cache) => cache.has_feature(feature),
    //         Err(_) => false,
    //     }
    // }

    // pub fn get_license_info() -> Result<serde_json::Value, LicenseError> {
    //     let cache = Self::load_cache()?;
    //     let machine_id = cache.machine_id()?;
    //     let license = cache.get_license()?;
    //     let features = cache.get_license_features();
    //     let has_valid = cache.has_valid_license();

    //     Ok(serde_json::json!({
    //         "machineId": machine_id,
    //         "hasValidLicense": has_valid,
    //         "license": license,
    //         "features": features,
    //         "offlineRunCount": cache.offline_run_count()?,
    //         "maxOfflineRuns": cache.max_offline_runs()?,
    //         "canRunOffline": Self::can_run_offline()?,
    //     }))
    // }
}
