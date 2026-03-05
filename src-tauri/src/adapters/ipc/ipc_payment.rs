use tauri::{AppHandle, Wry, command};

use crate::{
    adapters::{
        dtos::{CreatePaymentDTO, IdDTO},
        response::IpcResponse,
    },
    domain::{entities::payment_entity::PaymentEntity, usecases::payment_usecases::*},
    shared::{
        ctx::{Authorisation, Ctx},
        types::RoleType,
    },
};

#[command]
pub async fn ipc_add_payment_to_order(
    app: AppHandle<Wry>,
    params: CreatePaymentDTO,
) -> IpcResponse<PaymentEntity> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;

        // Convert DTO to Entity
        let payment_entity = PaymentEntity {
            id: Some(uuid::Uuid::new_v4().to_string()),
            order: None,
            payment_type: params.payment_type,
            summ: params.summ,
            delivery: params.delivery,
            transaction: params.transaction,
            ticket: params.ticket,
            discard: None,
            data: params.data,
            card: None, // TODO: Handle card_id if needed
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
            deleted_at: None,
            version: 1,
        };

        add_payment_to_order_usecase(&ctx, params.order_id, payment_entity).await
    })
}

#[command]
pub async fn ipc_remove_payment_from_order(
    app: AppHandle<Wry>,
    order_id: String,
    payment_id: String,
) -> IpcResponse<()> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        remove_payment_from_order_usecase(&ctx, order_id, payment_id).await
    })
}

#[command]
pub async fn ipc_delete_payment(app: AppHandle<Wry>, params: IdDTO) -> IpcResponse<u64> {
    crate::ipc_handler_async!({
        let ctx = Ctx::from_app(app)?;
        ctx.has_any_role(&[RoleType::Administrator, RoleType::Manager])?;
        delete_payment_usecase(&ctx, params.id).await
    })
}
