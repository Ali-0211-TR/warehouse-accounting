use crate::shared::encryption::EncryptedResponse;
use crate::shared::license::{LicenseError, LicenseValidationRequest};
use reqwest;
use std::time::Duration;

pub struct OnlineLicenseService {
    base_url: String,
    api_key: String,
}

impl OnlineLicenseService {
    pub fn new(base_url: String, api_key: String) -> Self {
        Self { base_url, api_key }
    }

    pub async fn validate_license(
        &self,
        request: LicenseValidationRequest,
    ) -> Result<EncryptedResponse, LicenseError> {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .map_err(|e| LicenseError::IoError(format!("HTTP client error: {}", e)))?;

        //let url = format!("{}/api/v1/license/validate", self.base_url);
        let url = format!("{}/api/license/validate", self.base_url);
        // println!("Validating license with URL: {}", url);

        let response = client
            .post(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .map_err(|_| LicenseError::NetworkError)?;

        // println!("License validation response body: {:?}", response);

        if !response.status().is_success() {
            return Err(LicenseError::NetworkError);
        }

        let validation_response: EncryptedResponse = response
            .json()
            .await
            .map_err(|_| LicenseError::NetworkError)?;

        Ok(validation_response)
    }

    pub async fn register_installation(
        &self,
        machine_id: &str,
        app_version: &str,
        os_info: &str,
    ) -> Result<EncryptedResponse, LicenseError> {
        let request = LicenseValidationRequest {
            machine_id: machine_id.to_string(),
            license_key: None,
            activation_id: None,
            app_version: app_version.to_string(),
            os_info: os_info.to_string(),
        };

        self.validate_license(request).await
    }

    // pub async fn activate_license(
    //     &self,
    //     machine_id: &str,
    //     license_key: &str,
    //     app_version: &str,
    //     os_info: &str,
    // ) -> Result<EncryptedResponse, LicenseError> {
    //     let request = LicenseValidationRequest {
    //         machine_id: machine_id.to_string(),
    //         license_key: Some(license_key.to_string()),
    //         activation_id: None,
    //         app_version: app_version.to_string(),
    //         os_info: os_info.to_string(),
    //     };

    //     // println!("Activating license for machine_id: {}, app_version: {}, os_info: {}", machine_id, app_version, os_info);

    //     self.validate_license(request).await
    // }

    // pub async fn check_activation(
    //     &self,
    //     machine_id: &str,
    //     activation_id: &str,
    //     app_version: &str,
    //     os_info: &str,
    // ) -> Result<EncryptedResponse, LicenseError> {
    //     let request = LicenseValidationRequest {
    //         machine_id: machine_id.to_string(),
    //         license_key: None,
    //         activation_id: Some(activation_id.to_string()),
    //         app_version: app_version.to_string(),
    //         os_info: os_info.to_string(),
    //     };

    //     self.validate_license(request).await
    // }

    // // Report license usage/analytics
    // pub async fn report_usage(&self, machine_id: &str, activation_id: &str) -> Result<(), LicenseError> {
    //     let client = reqwest::Client::builder()
    //         .timeout(Duration::from_secs(10))
    //         .build()
    //         .map_err(|e| LicenseError::IoError(format!("HTTP client error: {}", e)))?;

    //     let url = format!("{}/api/v1/license/usage", self.base_url);

    //     let payload = serde_json::json!({
    //         "machine_id": machine_id,
    //         "activation_id": activation_id,
    //         "timestamp": Utc::now(),
    //     });

    //     let _ = client
    //         .post(&url)
    //         .header("Authorization", format!("Bearer {}", self.api_key))
    //         .header("Content-Type", "application/json")
    //         .json(&payload)
    //         .send()
    //         .await; // Don't fail if usage reporting fails

    //     Ok(())
    // }
}

// System info helpers
pub fn get_os_info() -> String {
    format!(
        "{} {} {}",
        std::env::consts::OS,
        std::env::consts::ARCH,
        get_os_version()
    )
}

fn get_os_version() -> String {
    #[cfg(target_os = "windows")]
    {
        if let Ok(output) = std::process::Command::new("cmd")
            .args(&["/c", "ver"])
            .output()
        {
            return String::from_utf8_lossy(&output.stdout).trim().to_string();
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(output) = std::process::Command::new("sw_vers")
            .args(["-productVersion"])
            .output()
        {
            return String::from_utf8_lossy(&output.stdout).trim().to_string();
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Ok(version) = std::fs::read_to_string("/etc/os-release") {
            return version
                .lines()
                .find(|line| line.starts_with("PRETTY_NAME="))
                .unwrap_or("Unknown Linux")
                .to_string();
        }
    }

    "Unknown".to_string()
}

pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}
