use chrono::{DateTime, Utc};
use reqwest;
use serde::{Deserialize, Serialize};
use std::time::Duration;
use tokio::time::timeout;

#[derive(Debug, Serialize, Deserialize)]
pub struct TimeValidationResult {
    pub current_time: DateTime<Utc>,
    pub is_network_time: bool,
    pub time_source: String,
}

pub struct TimeValidator;

impl TimeValidator {
    pub async fn get_current_time() -> TimeValidationResult {
        // Try to get time from internet first
        match Self::get_network_time().await {
            Ok(network_time) => TimeValidationResult {
                current_time: network_time,
                is_network_time: true,
                time_source: "network".to_string(),
            },
            Err(_) => {
                // Fallback to system time
                TimeValidationResult {
                    current_time: Utc::now(),
                    is_network_time: false,
                    time_source: "system".to_string(),
                }
            }
        }
    }

    async fn get_network_time() -> Result<DateTime<Utc>, Box<dyn std::error::Error + Send + Sync>> {
        // Try multiple time sources
        let time_sources = vec![
            "http://worldtimeapi.org/api/timezone/Etc/UTC",
            "https://timeapi.io/api/Time/current/zone?timeZone=UTC",
            "http://worldclockapi.com/api/json/utc/now",
        ];

        for source in time_sources {
            if let Ok(time) = Self::try_time_source(source).await {
                return Ok(time);
            }
        }

        Err("All time sources failed".into())
    }

    async fn try_time_source(
        url: &str,
    ) -> Result<DateTime<Utc>, Box<dyn std::error::Error + Send + Sync>> {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(5))
            .build()?;

        let response = timeout(Duration::from_secs(10), client.get(url).send()).await??;
        let text = response.text().await?;

        // Parse different API response formats
        if url.contains("worldtimeapi.org") {
            #[derive(Deserialize)]
            struct WorldTimeResponse {
                utc_datetime: String,
            }
            let data: WorldTimeResponse = serde_json::from_str(&text)?;
            Ok(DateTime::parse_from_rfc3339(&data.utc_datetime)?.with_timezone(&Utc))
        } else if url.contains("timeapi.io") {
            #[derive(Deserialize)]
            struct TimeApiResponse {
                #[serde(rename = "dateTime")]
                date_time: String,
            }
            let data: TimeApiResponse = serde_json::from_str(&text)?;
            Ok(DateTime::parse_from_rfc3339(&data.date_time)?.with_timezone(&Utc))
        } else if url.contains("worldclockapi.com") {
            #[derive(Deserialize)]
            struct WorldClockResponse {
                #[serde(rename = "currentDateTime")]
                current_date_time: String,
            }
            let data: WorldClockResponse = serde_json::from_str(&text)?;
            Ok(DateTime::parse_from_rfc3339(&data.current_date_time)?.with_timezone(&Utc))
        } else {
            Err("Unknown time source format".into())
        }
    }

    // pub fn detect_time_manipulation(
    //     license: &crate::shared::license::License,
    //     current_time: DateTime<Utc>,
    //     is_network_time: bool,
    // ) -> bool {
    //     // If we have network time, it's more trustworthy
    //     if is_network_time {
    //         // Network time shouldn't go backwards from last check
    //         if current_time < license.last_check {
    //             return true;
    //         }
    //     } else {
    //         // System time - more strict checks
    //         if current_time < license.last_check {
    //             return true;
    //         }

    //         // Check if current time is before first run
    //         if let Some(first_run) = license.first_run {
    //             if current_time < first_run {
    //                 return true;
    //             }
    //         }
    //     }

    //     false
    // }
}
