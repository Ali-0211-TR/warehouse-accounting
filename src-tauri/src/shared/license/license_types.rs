use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub enum LicenseType {
    Demo {
        expiry_date: DateTime<Utc>,
        max_days: u32,
        online_validated: bool,
    },
    Trial {
        expiry_date: DateTime<Utc>,
        features: Vec<String>,
        online_validated: bool,
    },
    Standard {
        expiry_date: DateTime<Utc>,
        seats: u32,
        online_validated: bool,
    },
    Professional {
        expiry_date: DateTime<Utc>,
        seats: u32,
        features: Vec<String>,
        online_validated: bool,
    },
    Enterprise {
        expiry_date: Option<DateTime<Utc>>, // None = perpetual
        seats: u32,
        features: Vec<String>,
        online_validated: bool,
    },
    Perpetual {
        features: Vec<String>,
        seats: u32,
        online_validated: bool,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct License {
    pub license_type: LicenseType,
    pub issued_to: String,
    pub issued_at: DateTime<Utc>,
    pub first_run: Option<DateTime<Utc>>,
    pub last_check: DateTime<Utc>,
    pub last_online_check: Option<DateTime<Utc>>,
    pub check_count: u32,
    pub machine_id: String,
    pub license_key: Option<String>,
    pub activation_id: Option<String>, // Unique activation from server
    pub signature: Option<String>,     // For future digital signatures
    pub offline_grace_days: u32,       // Days allowed without online check
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LicenseValidationRequest {
    pub machine_id: String,
    pub license_key: Option<String>,
    pub activation_id: Option<String>,
    pub app_version: String,
    pub os_info: String,
}

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub enum ValidationStatus {
    Valid,
    Expired,
    Invalid,
    NotFound,
    DemoOffered,
    Blocked,
    ReinstallDetected,
}
#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct LicenseValidationResponse {
    pub status: ValidationStatus,
    pub license: Option<License>, // Changed from LicenseInfo to License
    pub message: String,
    pub demo_available: bool,
    pub activation_id: Option<String>,
}

// #[derive(Debug, Serialize, Deserialize)]
// pub struct LicenseValidationResponse {
//     pub status: ValidationStatus,
//     pub license: Option<License>,
//     pub message: String,
//     pub demo_available: bool,
//     pub activation_id: Option<String>,
// }

// #[derive(Debug, Serialize, Deserialize)]
// pub enum ValidationStatus {
//     Valid,
//     Expired,
//     Invalid,
//     NotFound,
//     DemoOffered,
//     Blocked,
//     ReinstallDetected,
// }

// #[derive(Debug, Clone, Serialize, Deserialize)]
// pub struct LicenseInfo {
//     pub is_valid: bool,
//     pub license_type: String,
//     pub days_remaining: Option<u32>,
//     pub features: Vec<String>,
//     pub seats: u32,
//     pub expired: bool,
//     pub issued_to: String,
//     pub error_message: Option<String>,
// }

#[derive(Debug)]
pub enum LicenseError {
    Invalid,
    Expired,
    NetworkError,
    OfflineMode,
    IoError(String),
    MachineIdMismatch,
    TamperingDetected,
    // TimeManipulationDetected,
    // ProcessIntegrityError,
}

impl std::fmt::Display for LicenseError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            LicenseError::Invalid => write!(f, "Invalid license"),
            LicenseError::Expired => write!(f, "License has expired"),
            LicenseError::NetworkError => write!(f, "Network error during license validation"),
            LicenseError::OfflineMode => write!(f, "Running in offline mode"),
            LicenseError::IoError(msg) => write!(f, "IO error: {}", msg),
            LicenseError::MachineIdMismatch => write!(f, "License not valid for this machine"),
            LicenseError::TamperingDetected => write!(f, "License tampering detected"),
            // LicenseError::TimeManipulationDetected => write!(f, "System time manipulation detected"),
            // LicenseError::ProcessIntegrityError => write!(f, "Process integrity error"),
        }
    }
}

impl std::error::Error for LicenseError {}

impl LicenseType {
    pub fn get_expiry_date(&self) -> Option<DateTime<Utc>> {
        match self {
            LicenseType::Demo { expiry_date, .. } => Some(*expiry_date),
            LicenseType::Trial { expiry_date, .. } => Some(*expiry_date),
            LicenseType::Standard { expiry_date, .. } => Some(*expiry_date),
            LicenseType::Professional { expiry_date, .. } => Some(*expiry_date),
            LicenseType::Enterprise { expiry_date, .. } => *expiry_date,
            LicenseType::Perpetual { .. } => None,
        }
    }

    pub fn get_features(&self) -> Vec<String> {
        match self {
            LicenseType::Demo { .. } => vec!["basic".to_string()],
            LicenseType::Trial { features, .. } => features.clone(),
            LicenseType::Standard { .. } => vec!["standard".to_string()],
            LicenseType::Professional { features, .. } => features.clone(),
            LicenseType::Enterprise { features, .. } => features.clone(),
            LicenseType::Perpetual { features, .. } => features.clone(),
        }
    }

    pub fn get_type_name(&self) -> String {
        match self {
            LicenseType::Demo { .. } => "Demo".to_string(),
            LicenseType::Trial { .. } => "Trial".to_string(),
            LicenseType::Standard { .. } => "Standard".to_string(),
            LicenseType::Professional { .. } => "Professional".to_string(),
            LicenseType::Enterprise { .. } => "Enterprise".to_string(),
            LicenseType::Perpetual { .. } => "Perpetual".to_string(),
        }
    }

    // pub fn get_seats(&self) -> u32 {
    //     match self {
    //         LicenseType::Demo { .. } => 1,
    //         LicenseType::Trial { .. } => 1,
    //         LicenseType::Standard { seats, .. } => *seats,
    //         LicenseType::Professional { seats, .. } => *seats,
    //         LicenseType::Enterprise { seats, .. } => *seats,
    //         LicenseType::Perpetual { seats, .. } => *seats,
    //     }
    // }

    // pub fn get_type_name(&self) -> String {
    //     match self {
    //         LicenseType::Demo { .. } => "Demo".to_string(),
    //         LicenseType::Trial { .. } => "Trial".to_string(),
    //         LicenseType::Standard { .. } => "Standard".to_string(),
    //         LicenseType::Professional { .. } => "Professional".to_string(),
    //         LicenseType::Enterprise { .. } => "Enterprise".to_string(),
    //         LicenseType::Perpetual { .. } => "Perpetual".to_string(),
    //     }
    // }
}
