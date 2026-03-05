#[macro_export]
macro_rules! impl_enum {
    // Match the enum name and its variants
    ($enum_name:ident, $first_variant:ident, $($variant:ident),*) => {
        #[derive(Debug, Deserialize, Serialize, Clone, PartialEq, Eq)]
        #[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
        #[cfg_attr(not(any(target_os = "android", target_os = "ios")), ts(export, export_to = "../../src-ui/shared/bindings/"))]
        pub enum $enum_name {
            $first_variant, $($variant),*
        }

        // Implement Default trait to return the first item as the default
        // Implement Default trait to return the first item as the default
        impl Default for $enum_name {
            fn default() -> Self {
                // Explicitly return the first variant as default
                $enum_name::$first_variant
            }
        }

        // Implement Display trait for the enum
        impl std::fmt::Display for $enum_name {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            let group_type_str = match self {
                $(
                    $enum_name::$variant => stringify!($variant),
                )*
                $enum_name::$first_variant => stringify!($first_variant),
            };
            write!(f, "{}", group_type_str)
        }
    }

    // Implement FromStr trait for the enum
    impl std::str::FromStr for $enum_name {
        type Err = String;

        fn from_str(s: &str) -> Result<Self, Self::Err> {
            match s {
                $(
                    stringify!($variant) => Ok($enum_name::$variant),
                )*
                stringify!($first_variant) => Ok($enum_name::$first_variant),
                _ => Err(format!("Invalid {}: {}", stringify!($enum_name), s)),
            }
        }
    }
    };
 }
