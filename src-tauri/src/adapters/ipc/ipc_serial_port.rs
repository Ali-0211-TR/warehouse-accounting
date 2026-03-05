#[tauri::command]
pub fn get_ports() -> Vec<String> {
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        let ports = serialport::available_ports().expect("No ports found!");
        let mut res = vec![];
        for p in ports {
            res.push(p.port_name);
        }
        res
    }

    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        // Serial enumeration not supported on Android/iOS
        // Return empty list or predefined ports if needed
        vec![]
    }
}
