use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // SQLite doesn't support DROP FOREIGN KEY, so we need to recreate the table
        // Use raw SQL for the entire operation for better SQLite compatibility

        let db = manager.get_connection();

        db.execute_unprepared(
            "CREATE TABLE IF NOT EXISTS discount_to_product_new (
                discount_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                PRIMARY KEY (discount_id, product_id),
                FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE
            )"
        ).await?;

        db.execute_unprepared(
            "INSERT OR IGNORE INTO discount_to_product_new (discount_id, product_id)
             SELECT dtp.discount_id, dtp.product_id
             FROM discount_to_product dtp
             WHERE EXISTS (SELECT 1 FROM products WHERE id = dtp.product_id)
               AND EXISTS (SELECT 1 FROM discounts WHERE id = dtp.discount_id)"
        ).await?;

        db.execute_unprepared("DROP TABLE IF EXISTS discount_to_product").await?;

        // Drop any lingering index with the same name (SeaORM primary_key().table() creates a named index)
        db.execute_unprepared("DROP INDEX IF EXISTS discount_to_product").await?;

        db.execute_unprepared("ALTER TABLE discount_to_product_new RENAME TO discount_to_product").await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Revert back to pointing to prices table
        let db = manager.get_connection();

        db.execute_unprepared(
            "CREATE TABLE IF NOT EXISTS discount_to_product_new (
                discount_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                PRIMARY KEY (discount_id, product_id),
                FOREIGN KEY (discount_id) REFERENCES discounts(id) ON DELETE SET NULL ON UPDATE CASCADE,
                FOREIGN KEY (product_id) REFERENCES prices(id) ON DELETE SET NULL ON UPDATE CASCADE
            )"
        ).await?;

        db.execute_unprepared(
            "INSERT OR IGNORE INTO discount_to_product_new (discount_id, product_id)
             SELECT discount_id, product_id FROM discount_to_product"
        ).await?;

        db.execute_unprepared("DROP TABLE IF EXISTS discount_to_product").await?;

        db.execute_unprepared("DROP INDEX IF EXISTS discount_to_product").await?;

        db.execute_unprepared("ALTER TABLE discount_to_product_new RENAME TO discount_to_product").await?;

        Ok(())
    }
}
