import { invoke } from "@tauri-apps/api/core";


export async function getSerialPorts(): Promise<string[]> {
    const res = (await invoke("get_ports"));
    return res as string[];
}

