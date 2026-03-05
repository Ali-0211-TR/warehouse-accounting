use chrono::{DateTime, NaiveDate, TimeZone, Utc};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

// Custom module for (de)serializing DateTime<Utc> from string or date
mod date_or_datetime {
    use super::*;
    pub fn serialize<S>(dt: &DateTime<Utc>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&dt.to_rfc3339())
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<DateTime<Utc>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;

        // Try to parse as full datetime first
        if let Ok(dt) = DateTime::parse_from_rfc3339(&s) {
            return Ok(dt.with_timezone(&Utc));
        }

        // Try to parse as just date (YYYY-MM-DD)
        if let Ok(naive_date) = NaiveDate::parse_from_str(&s, "%Y-%m-%d") {
            return Ok(Utc.from_utc_datetime(&naive_date.and_hms_opt(0, 0, 0).unwrap()));
        }

        Err(serde::de::Error::custom("Unable to parse date"))
    }
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct ContractDTO {
    pub id: Option<String>,
    pub device_id: String,
    pub client_id: Option<String>,
    pub name: String,
    pub contract_name: String,
    #[serde(with = "date_or_datetime")]
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_begin: DateTime<Utc>,
    #[serde(with = "date_or_datetime")]
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "string")
    )]
    pub d_end: DateTime<Utc>,
    pub created_at: String,
    pub updated_at: String,
    pub deleted_at: Option<String>,
    pub version: i64,
}
