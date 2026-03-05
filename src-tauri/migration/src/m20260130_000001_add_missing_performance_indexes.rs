use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // ===== PAYMENTS TABLE INDEXES =====

        // Index for payments.order_id — used in batch payment loading
        // and in shared::into_entity per-order payment fetch
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_payments_order_id")
                    .table(Payments::Table)
                    .col(Payments::OrderId)
                    .to_owned(),
            )
            .await?;

        // ===== PRICES TABLE INDEXES =====

        // Index for prices.product_id — used in product batch loading
        // (PriceRepository::products_prices_batch)
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_prices_product_id")
                    .table(Prices::Table)
                    .col(Prices::ProductId)
                    .to_owned(),
            )
            .await?;

        // Index for prices.start_time — used in current price lookup
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_prices_start_time")
                    .table(Prices::Table)
                    .col(Prices::StartTime)
                    .to_owned(),
            )
            .await?;

        // ===== ORDERS COMPOUND INDEX =====

        // Compound index for active orders query:
        // WHERE order_type = X AND d_move IS NULL ORDER BY d_created DESC
        manager
            .create_index(
                Index::create()
                    .if_not_exists()
                    .name("idx_orders_type_d_move")
                    .table(Orders::Table)
                    .col(Orders::OrderType)
                    .col(Orders::DMove)
                    .to_owned(),
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_index(Index::drop().name("idx_orders_type_d_move").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_prices_start_time").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_prices_product_id").to_owned())
            .await?;

        manager
            .drop_index(Index::drop().name("idx_payments_order_id").to_owned())
            .await?;

        Ok(())
    }
}

// Table definitions
#[derive(Iden)]
enum Payments {
    Table,
    OrderId,
}

#[derive(Iden)]
enum Prices {
    Table,
    ProductId,
    StartTime,
}

#[derive(Iden)]
enum Orders {
    Table,
    OrderType,
    DMove,
}
