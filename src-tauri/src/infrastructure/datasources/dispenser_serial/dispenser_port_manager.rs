use super::protocol::{CReceiver, CTransmitter, RxBlueSky, RxShelf, TxBlueSky, TxShelf};
use crate::domain::entities::dispenser_entity::DispenserEntity;
use crate::domain::entities::dispenser_port_entity::DispenserPortEntity;
use crate::shared::types::{CommRequest, CommResponse, DispenserProtocolType, RequestCmd};
use serialport::Parity;
use std::collections::HashMap;
use std::collections::HashSet;
use std::io::ErrorKind;
use std::time::Duration;
use tokio::{
    sync::broadcast::{Receiver, Sender, channel},
    time::{Instant, sleep},
};
use tracing::{debug, error, warn};

#[derive(Debug, Clone)]
struct DispenserAddress {
    // pub dispenser_id: String, // Fixed typo
    pub selected: u8,
    pub addresses: Vec<u8>,   // Changed to Vec for better iteration
    pub current_index: usize, // Track current position directly
}

impl DispenserAddress {
    pub fn new(addresses: HashSet<u8>) -> Self {
        let mut addr_vec: Vec<u8> = addresses.into_iter().collect();
        addr_vec.sort(); // Ensure consistent ordering
        let selected = addr_vec.first().copied().unwrap_or(0);

        Self {
            selected,
            addresses: addr_vec,
            current_index: 0,
        }
    }

    pub fn next(&mut self) {
        if !self.addresses.is_empty() {
            self.current_index = (self.current_index + 1) % self.addresses.len();
            self.selected = self.addresses[self.current_index];
        }
    }

    pub fn contains(&self, addr: u8) -> bool {
        self.addresses.contains(&addr)
    }
}

#[derive(Debug)]
pub struct DispenserPortManager {
    cmd_requests: HashMap<u8, Sender<CommRequest>>,
}

impl DispenserPortManager {
    pub async fn new(dispensers: &[DispenserEntity]) -> (Receiver<CommResponse>, Self) {
        let (response_sender, response_receiver) = channel::<CommResponse>(100); // Increased buffer

        let mut ports: HashMap<DispenserPortEntity, Vec<DispenserAddress>> = HashMap::new();

        // Group dispensers by port
        for dispenser in dispensers {
            if let Some(ref port) = dispenser.port {
                if dispenser.id.is_some() {
                    let addresses: HashSet<u8> =
                        dispenser.nozzles.iter().map(|n| n.address).collect();

                    if !addresses.is_empty() {
                        ports
                            .entry(port.clone())
                            .or_default()
                            .push(DispenserAddress::new(addresses));
                    }
                }
            }
        }

        let mut cmd_requests: HashMap<u8, Sender<CommRequest>> = HashMap::new();

        // Spawn workers for each port
        for (port, addresses) in ports {
            let (command_sender, command_receiver) = channel::<CommRequest>(50);

            let worker_params = WorkerParams::new(
                command_receiver,
                response_sender.clone(),
                addresses.clone(),
                port.clone(),
            );

            tokio::spawn(async move {
                worker(worker_params).await;
            });

            // Map each address to the command sender
            for dispenser_addr in &addresses {
                for &addr in &dispenser_addr.addresses {
                    cmd_requests.insert(addr, command_sender.clone());
                }
            }
        }

        (response_receiver, DispenserPortManager { cmd_requests })
    }

    pub fn send_cmd(&self, cmd: CommRequest) -> Result<(), String> {
        match cmd {
            CommRequest::Cmd(address, ref _request_cmd) => {
                if let Some(sender) = self.cmd_requests.get(&address) {
                    sender
                        .send(cmd)
                        .map_err(|e| format!("Failed to send command: {}", e))?;
                    Ok(())
                } else {
                    Err(format!("No sender found for address: {}", address))
                }
            }
            CommRequest::Stop => {
                let mut errors = Vec::new();
                for (addr, sender) in &self.cmd_requests {
                    if let Err(e) = sender.send(CommRequest::Stop) {
                        errors.push(format!("Failed to send stop to {}: {}", addr, e));
                    }
                }
                if errors.is_empty() {
                    Ok(())
                } else {
                    Err(errors.join("; "))
                }
            }
        }
    }
}

#[derive(Debug)]
struct WorkerParams {
    pub command_receiver: Receiver<CommRequest>,
    pub response_sender: Sender<CommResponse>,
    pub addresses: Vec<DispenserAddress>,
    pub port: DispenserPortEntity,
}

impl WorkerParams {
    pub fn new(
        command_receiver: Receiver<CommRequest>,
        response_sender: Sender<CommResponse>,
        addresses: Vec<DispenserAddress>,
        port: DispenserPortEntity,
    ) -> Self {
        Self {
            command_receiver,
            response_sender,
            addresses,
            port,
        }
    }
}

// Separate connection manager for better error handling
struct SerialConnection {
    port: Box<dyn serialport::SerialPort>,
    last_activity: Instant,
}

impl SerialConnection {
    fn new(
        port_name: &str,
        port_speed: u32,
    ) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        let port = serialport::new(port_name, port_speed)
            .parity(Parity::Even)
            .timeout(Duration::from_millis(100))
            .open()?;

        Ok(Self {
            port,
            last_activity: Instant::now(),
        })
    }

    fn is_stale(&self, max_idle: Duration) -> bool {
        self.last_activity.elapsed() > max_idle
    }

    fn write_and_read(
        &mut self,
        data: &[u8],
    ) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
        self.port.write_all(data)?;
        self.last_activity = Instant::now();

        let mut response = Vec::with_capacity(128); // Pre-allocate
        let mut buffer = [0u8; 128];

        loop {
            match self.port.read(&mut buffer) {
                Ok(0) => break,
                Ok(n) => {
                    response.extend_from_slice(&buffer[..n]);
                    if response.len() > 256 {
                        // Prevent unbounded growth
                        break;
                    }
                }
                Err(ref e) if e.kind() == ErrorKind::TimedOut => break,
                Err(e) => return Err(Box::new(e)),
            }
        }

        Ok(response)
    }
}

// Optimized command handling function
fn handle_comm_request(
    request: &CommRequest,
    transmitter: &dyn CTransmitter,
    buffer: &mut [u8; 128],
) -> Option<usize> {
    if let CommRequest::Cmd(addr, cmd) = request {
        let length = match cmd {
            RequestCmd::WritePrice(price) => transmitter.write_price(buffer, *addr, *price),
            RequestCmd::ReadPrice => transmitter.read_price(buffer, *addr),
            RequestCmd::WriteSolenoid(val) => transmitter.write_solenoid(buffer, *addr, *val),
            RequestCmd::ReadSolenoid => transmitter.read_solenoid(buffer, *addr),
            RequestCmd::WriteDencity(val) => transmitter.write_dencity(buffer, *addr, *val),
            RequestCmd::ReadDencity => transmitter.read_dencity(buffer, *addr),
            RequestCmd::ReadPressure => transmitter.read_pressure(buffer, *addr),
            RequestCmd::ReadFlow => transmitter.read_flow(buffer, *addr),
            RequestCmd::PresetAmount(val, price) => {
                println!("Preset amount: {} {} {}", addr, val, price);
                transmitter.preset_amount(buffer, *addr, *val, *price)
            }
            RequestCmd::PresetVolume(val, price) => {
                println!("Preset volume: {} {} {}", addr, val, price);
                transmitter.preset_volume(buffer, *addr, *val, *price)
            }
            RequestCmd::ReadFueling => transmitter.read_fueling(buffer, *addr),
            RequestCmd::GetStatus => transmitter.get_status(buffer, *addr),
            RequestCmd::ReadTotal => transmitter.read_total(buffer, *addr),
            RequestCmd::ReadShiftTotal => transmitter.read_shift_total(buffer, *addr),
            RequestCmd::StartFueling => transmitter.start_fueling(buffer, *addr),
            RequestCmd::StopFueling => transmitter.stop_fueling(buffer, *addr),
            RequestCmd::AskControl => transmitter.ask_control(buffer, *addr),
            RequestCmd::ReturnControl => transmitter.return_control(buffer, *addr),
            RequestCmd::ClearShiftTotal => transmitter.clear_shift_total(buffer, *addr),
            RequestCmd::PauseFueling => transmitter.pause_fueling(buffer, *addr),
            RequestCmd::ResumeFueling => transmitter.resume_fueling(buffer, *addr),
            RequestCmd::SelectNextNozzle(id) => transmitter.select_next_nozzle(buffer, *addr, *id),
            RequestCmd::ReadPreset => transmitter.read_preset(buffer, *addr),
            RequestCmd::ReadCardId => transmitter.read_card_id(buffer, *addr),
            RequestCmd::ReadErrorCode => transmitter.read_error_code(buffer, *addr),
            RequestCmd::ReadId => transmitter.read_id(buffer, *addr),
            RequestCmd::ResetKbPresetFlag => transmitter.reset_kb_preset_flag(buffer, *addr),
            RequestCmd::ResetErrorFlag => transmitter.reset_error_flag(buffer, *addr),
        };
        Some(length)
    } else {
        None
    }
}

async fn worker(mut params: WorkerParams) {
    let port_name = params.port.port_name.clone();
    let port_speed = params.port.port_speed.try_into().unwrap_or(9600);

    let transmitter: Box<dyn CTransmitter + Send> = match params.port.protocol {
        DispenserProtocolType::BlueSky | DispenserProtocolType::TexnoUz => Box::new(TxBlueSky {}),
        DispenserProtocolType::Shelf => Box::new(TxShelf {}),
    };

    let mut receiver: Box<dyn CReceiver + Send> = match params.port.protocol {
        DispenserProtocolType::BlueSky | DispenserProtocolType::TexnoUz => {
            Box::new(RxBlueSky::new())
        }
        DispenserProtocolType::Shelf => Box::new(RxShelf::new()),
    };

    let mut buffer = [0u8; 128];
    let mut addresses = params.addresses;
    let mut addr_index = 0;
    let mut connection: Option<SerialConnection> = None;
    let mut reconnect_attempts: u32 = 0;
    let mut total_failures: u32 = 0;
    const MAX_RECONNECT_ATTEMPTS: u32 = 5;
    const CONNECTION_IDLE_TIMEOUT: Duration = Duration::from_secs(30);

    if addresses.is_empty() {
        eprintln!("No addresses configured for port: {}", port_name);
        return;
    }

    loop {
        // Handle connection management
        if connection.is_none()
            || connection
                .as_ref()
                .is_some_and(|c| c.is_stale(CONNECTION_IDLE_TIMEOUT))
        {
            match SerialConnection::new(&port_name, port_speed) {
                Ok(conn) => {
                    if total_failures > 0 {
                        warn!("Serial port reconnected after {} failures: {}", total_failures, port_name);
                    } else {
                        println!("Serial port opened: {}", port_name);
                    }
                    connection = Some(conn);
                    reconnect_attempts = 0;
                    total_failures = 0;
                }
                Err(_e) => {
                    reconnect_attempts += 1;
                    total_failures += 1;

                    if reconnect_attempts >= MAX_RECONNECT_ATTEMPTS {
                        // Demote log level after repeated failures to avoid log spam
                        if total_failures <= MAX_RECONNECT_ATTEMPTS {
                            error!("Cannot open serial port {} after {} attempts", port_name, total_failures);
                        } else if total_failures <= 30 {
                            warn!("Port {} still unavailable (attempt {})", port_name, total_failures);
                        } else {
                            debug!("Port {} still unavailable (attempt {})", port_name, total_failures);
                        }

                        // Exponential backoff: 10s → 20s → 40s → ... capped at 5 minutes
                        let backoff_secs = (10u64 * 2u64.pow((total_failures / MAX_RECONNECT_ATTEMPTS).min(5))).min(300);
                        sleep(Duration::from_secs(backoff_secs)).await;
                        reconnect_attempts = 0;
                    } else {
                        sleep(Duration::from_secs(1)).await;
                    }
                    continue;
                }
            }
        }

        let conn = connection.as_mut().unwrap();

        // Handle incoming commands with timeout
        let command_len =
            match tokio::time::timeout(Duration::from_millis(10), params.command_receiver.recv())
                .await
            {
                Ok(Ok(request)) => {
                    // Update address index if command targets specific address
                    if let CommRequest::Cmd(cmd_addr, _) = &request {
                        if let Some(index) = addresses.iter().position(|a| a.contains(*cmd_addr)) {
                            addr_index = index;
                        }
                    }
                    handle_comm_request(&request, transmitter.as_ref(), &mut buffer)
                }
                Ok(Err(_)) => break, // Channel closed
                Err(_) => {
                    // Timeout - send status request
                    let current_addr = addresses[addr_index].selected;
                    Some(transmitter.get_status(&mut buffer, current_addr))
                }
            };

        if let Some(len) = command_len {
            match conn.write_and_read(&buffer[..len]) {
                Ok(response) => {
                    if response.is_empty() {
                        addresses[addr_index].next();
                    } else if response.len() > 3 {
                        match receiver.receive(response) {
                            Ok(parsed_response) => {
                                if let Err(e) = params.response_sender.send(parsed_response) {
                                    eprintln!("Failed to send response: {}", e);
                                }
                            }
                            Err(_) => {
                                println!(
                                    "Error parsing response from address: {:02x}",
                                    addresses[addr_index].selected
                                );
                            }
                        }
                    }
                }
                Err(e) => {
                    debug!("Serial communication error on {}: {}", port_name, e);
                    connection = None; // Force reconnection
                }
            }
        }

        // Cycle through addresses
        addr_index = (addr_index + 1) % addresses.len();
        sleep(Duration::from_millis(5)).await;
    }
}
