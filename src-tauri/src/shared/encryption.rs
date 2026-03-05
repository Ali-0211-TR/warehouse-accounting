use aes_gcm::{
    Aes256Gcm, Key, Nonce,
    aead::{Aead, AeadCore, KeyInit, OsRng},
};
use base64::{Engine as _, engine::general_purpose};
use hmac::{Hmac, Mac};
use serde::{Deserialize, Serialize};
use sha2::Sha256;
use utoipa::ToSchema;

type HmacSha256 = Hmac<Sha256>;

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct EncryptedResponse {
    pub data: String,      // Base64 encoded encrypted data
    pub nonce: String,     // Base64 encoded nonce
    pub signature: String, // HMAC signature
    pub timestamp: i64,    // Unix timestamp
}

pub struct LicenseEncryption {
    cipher: Aes256Gcm,
    hmac_key: Vec<u8>,
}

impl LicenseEncryption {
    /// Create a new encryption instance with master key
    pub fn new(master_key: &str) -> Result<Self, Box<dyn std::error::Error>> {
        // Derive AES key from master key using PBKDF2-like approach
        let aes_key = Self::derive_key(master_key, b"AES_KEY_SALT", 32)?;
        let hmac_key = Self::derive_key(master_key, b"HMAC_KEY_SALT", 32)?;
        let key = Key::<Aes256Gcm>::from_slice(&aes_key);
        let cipher = Aes256Gcm::new(key);
        Ok(Self { cipher, hmac_key })
    }

    /// Encrypt license data and return encrypted response
    #[allow(dead_code)]
    pub fn encrypt_license_data<T: Serialize>(
        &self,
        data: &T,
    ) -> Result<EncryptedResponse, Box<dyn std::error::Error>> {
        // Serialize the data
        let json_data = serde_json::to_string(data)?;

        // Generate random nonce
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

        // Encrypt the data
        let encrypted_data = self
            .cipher
            .encrypt(&nonce, json_data.as_bytes())
            .map_err(|e| format!("Encryption failed: {}", e))?;

        // Encode to base64
        let encoded_data = general_purpose::STANDARD.encode(encrypted_data);
        let encoded_nonce = general_purpose::STANDARD.encode(nonce);

        let timestamp = chrono::Utc::now().timestamp();

        // Create signature payload
        let signature_payload = format!("{}:{}:{}", encoded_data, encoded_nonce, timestamp);

        // Generate HMAC signature
        let signature = self.generate_hmac(&signature_payload)?;

        Ok(EncryptedResponse {
            data: encoded_data,
            nonce: encoded_nonce,
            signature,
            timestamp,
        })
    }

    /// Decrypt license data (for client-side implementation)
    pub fn decrypt_license_data<T: for<'de> Deserialize<'de>>(
        &self,
        encrypted_response: &EncryptedResponse,
    ) -> Result<T, Box<dyn std::error::Error>> {
        // Verify signature first
        let signature_payload = format!(
            "{}:{}:{}",
            encrypted_response.data, encrypted_response.nonce, encrypted_response.timestamp
        );

        if !self.verify_hmac(&signature_payload, &encrypted_response.signature)? {
            let err_msg = format!("Invalid signature: {}", encrypted_response.signature);
            return Err(err_msg.into());
        }

        // Check timestamp (prevent replay attacks - within 1 hour)
        let current_time = chrono::Utc::now().timestamp();

        println!(
            "✅ Signature verified successfully. Timestamp: {}, Current Time: {}",
            encrypted_response.timestamp, current_time
        );

        if (current_time - encrypted_response.timestamp).abs() > 3600 {
            return Err("Timestamp too old".into());
        }

        // Decode from base64
        let encrypted_data = general_purpose::STANDARD.decode(&encrypted_response.data)?;
        let nonce_bytes = general_purpose::STANDARD.decode(&encrypted_response.nonce)?;

        let nonce = Nonce::from_slice(&nonce_bytes);

        // Decrypt the data
        let decrypted_data = self
            .cipher
            .decrypt(nonce, encrypted_data.as_ref())
            .map_err(|e| format!("Decryption failed: {}", e))?;

        // Deserialize
        let json_str = String::from_utf8(decrypted_data)?;
        let data: T = serde_json::from_str(&json_str)?;

        Ok(data)
    }

    /// Derive key using simple PBKDF2-like approach
    fn derive_key(
        master_key: &str,
        salt: &[u8],
        length: usize,
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        let mut mac = <HmacSha256 as Mac>::new_from_slice(master_key.as_bytes())?;
        mac.update(salt);
        let result = mac.finalize();
        let bytes = result.into_bytes();
        Ok(bytes[..length.min(bytes.len())].to_vec())
    }

    /// Generate HMAC signature
    fn generate_hmac(&self, data: &str) -> Result<String, Box<dyn std::error::Error>> {
        let mut mac = <HmacSha256 as Mac>::new_from_slice(&self.hmac_key)?;
        mac.update(data.as_bytes());
        let result = mac.finalize();
        Ok(general_purpose::STANDARD.encode(result.into_bytes()))
    }

    /// Verify HMAC signature
    fn verify_hmac(&self, data: &str, signature: &str) -> Result<bool, Box<dyn std::error::Error>> {
        let expected_signature = self.generate_hmac(data)?;
        Ok(expected_signature == signature)
    }
}

// Note: SecureLicenseResponse removed - we return EncryptedResponse directly for maximum simplicity

// /// Configuration for license encryption
// #[allow(dead_code)]
// pub struct LicenseEncryptionConfig {
//     pub master_key: String,
//     pub enable_encryption: bool,
// }

// impl LicenseEncryptionConfig {
//     pub fn from_env() -> Self {
//         Self {
//             master_key: std::env::var("LICENSE_ENCRYPTION_KEY")
//                 .unwrap_or_else(|_| "default-encryption-key-change-in-production".to_string()),
//             enable_encryption: std::env::var("ENABLE_LICENSE_ENCRYPTION")
//                 .unwrap_or_else(|_| "true".to_string())
//                 .parse()
//                 .unwrap_or(true),
//         }
//     }
// }

// #[cfg(test)]
// mod tests {
//     use crate::shared::license::{License, LicenseType};

//     use super::*;

//     #[test]
//     fn test_encryption_roundtrip() {
//         let encryption = LicenseEncryption::new("test-master-key").unwrap();

//         // Create test license
//         let license = License {
//             license_type: LicenseType::Demo {
//                 expiry_date: chrono::Utc::now() + chrono::Duration::days(30),
//                 max_days: 30,
//                 online_validated: true,
//             },
//             issued_to: "Test User".to_string(),
//             issued_at: chrono::Utc::now(),
//             first_run: Some(chrono::Utc::now()),
//             last_check: chrono::Utc::now(),
//             last_online_check: Some(chrono::Utc::now()),
//             check_count: 1,
//             machine_id: "test-machine".to_string(),
//             license_key: None,
//             activation_id: Some("test-activation".to_string()),
//             signature: None,
//             offline_grace_days: 7,
//         };

//         // Encrypt
//         let encrypted = encryption.encrypt_license_data(&license).unwrap();

//         // Decrypt
//         let decrypted: License = encryption.decrypt_license_data(&encrypted).unwrap();

//         // Verify
//         assert_eq!(license.machine_id, decrypted.machine_id);
//         assert_eq!(license.check_count, decrypted.check_count);
//     }
// }
