/// Macros for easy license feature checking
///
/// Usage examples:
/// ```text
/// // Check single feature
/// require_feature!("fuel_management");
///
/// // Check feature with custom error message
/// require_feature!("advanced_reporting", "Advanced reporting requires Professional license");
///
/// // Check multiple features (all required)
/// require_features!(&["fuel_management", "inventory_management"]);
///
/// // Check if any feature is available
/// require_any_feature!(&["basic_dispensers", "advanced_dispensers"]);
#[macro_export]
macro_rules! require_feature {
    ($feature:expr) => {
        if let Err(msg) = $crate::shared::license::LicenseManager::check_feature_access($feature) {
            return Err($crate::shared::error::Error::LicenseRestriction(msg));
        }
    };
    ($feature:expr, $error_msg:expr) => {
        if !$crate::shared::license::LicenseManager::has_feature($feature) {
            return Err($crate::shared::error::Error::LicenseRestriction(
                $error_msg.to_string(),
            ));
        }
    };
}

#[macro_export]
macro_rules! require_features {
    ($features:expr) => {
        if !$crate::shared::license::LicenseManager::has_features($features) {
            return Err($crate::shared::error::Error::LicenseRestriction(format!(
                "Required features not available: {:?}",
                $features
            )));
        }
    };
}

#[macro_export]
macro_rules! require_any_feature {
    ($features:expr) => {
        if !$crate::shared::license::LicenseManager::has_any_feature($features) {
            return Err($crate::shared::error::Error::LicenseRestriction(format!(
                "At least one of these features is required: {:?}",
                $features
            )));
        }
    };
}

#[macro_export]
macro_rules! check_license_limit {
    ($current_count:expr, $limit_getter:expr, $item_type:expr) => {
        let max_allowed = $limit_getter();
        if $current_count >= max_allowed {
            return Err($crate::shared::error::Error::LicenseRestriction(format!(
                "License limit exceeded: maximum {} {} allowed",
                max_allowed, $item_type
            )));
        }
    };
}
