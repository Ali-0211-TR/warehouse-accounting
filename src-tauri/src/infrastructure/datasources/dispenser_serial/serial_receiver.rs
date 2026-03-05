use std::sync::Arc;
use std::time::Duration;

use tokio::sync::broadcast::Receiver;
use tokio::time::sleep;

use crate::domain::usecases::dispenser_response_usecases::get_command;
use crate::shared::ctx::Ctx;
use crate::shared::types::CommResponse;

pub async fn dispesner_serial_receiver(ctx: Arc<Ctx>, mut drcv: Receiver<CommResponse>) {
    // println!("🎧 Serial receiver started - waiting for UART responses...");
    // let mut last_cmd: HashMap<u8, CommResponse> = HashMap::new();
    while let Ok(res) = drcv.recv().await {
        // println!("📡 Serial receiver got response: {:?}", res);
        // let addr = match res {
        //     CommResponse::Sh(address, _) | CommResponse::BS(address, _) => address,
        // };
        let _ = get_command(&ctx, res).await;
        // if last_cmd.get(&addr).map_or(true, |last| *last != res) {
        //     last_cmd.insert(addr, res.clone());
        //     println!("Received: {:?}", res);
        //     let _ = get_command(&ctx, res).await;
        // }
        sleep(Duration::from_millis(10)).await;
    }
}
