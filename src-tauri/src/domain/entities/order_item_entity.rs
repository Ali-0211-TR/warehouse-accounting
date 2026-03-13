use super::{
    order_item_discount_entity::OrderItemDiscountEntity, order_item_tax_entity::OrderItemTaxEntity,
    product_entity::ProductEntity,
};
use crate::{Result, shared::types::OrderType};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize, Serializer};
#[cfg(not(any(target_os = "android", target_os = "ios")))]
use ts_rs::TS;

// Custom serializer for Decimal as f64
fn serialize_decimal_as_f64<S>(
    decimal: &Decimal,
    serializer: S,
) -> std::result::Result<S::Ok, S::Error>
where
    S: Serializer,
{
    let f64_value = decimal.to_string().parse::<f64>().unwrap_or(0.0);
    serializer.serialize_f64(f64_value)
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct OrderItemEntity {
    pub id: Option<String>,
    pub order_id: String,
    pub product: Option<ProductEntity>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub count: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub price: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub discount: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub cost: Decimal,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number")
    )]
    #[serde(serialize_with = "serialize_decimal_as_f64")]
    pub tax: Decimal,
    pub taxes: Vec<OrderItemTaxEntity>,
    pub discounts: Vec<OrderItemDiscountEntity>,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub enum OrderItemColumn {
    Id,
    OrderId,
    ProductId,
    Count,
    Price,
    Discount,
    Cost,
    Tax,
}

#[cfg_attr(not(any(target_os = "android", target_os = "ios")), derive(TS))]
#[derive(Debug, Deserialize, Serialize, Clone)]
#[cfg_attr(
    not(any(target_os = "android", target_os = "ios")),
    ts(export, export_to = "../../src-ui/shared/bindings/")
)]
pub struct OrderItemFilter {
    pub id: Option<String>,
    pub order_id: Option<String>,
    pub product_id: Option<String>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number|null")
    )]
    pub min_count: Option<Decimal>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number|null")
    )]
    pub max_count: Option<Decimal>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number|null")
    )]
    pub min_price: Option<Decimal>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number|null")
    )]
    pub max_price: Option<Decimal>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number|null")
    )]
    pub min_cost: Option<Decimal>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number|null")
    )]
    pub max_cost: Option<Decimal>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number|null")
    )]
    pub min_tax: Option<Decimal>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number|null")
    )]
    pub max_tax: Option<Decimal>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number|null")
    )]
    pub min_discount: Option<Decimal>,
    #[cfg_attr(
        not(any(target_os = "android", target_os = "ios")),
        ts(type = "number|null")
    )]
    pub max_discount: Option<Decimal>,
    pub product_name: Option<String>,
}

impl OrderItemEntity {
    pub fn from_product(
        product: ProductEntity,
        count: Decimal,
        order_id: String,
        order_type: OrderType, // Add order_type parameter
    ) -> Result<Self> {
        // Determine the correct price based on order type
        let price = match order_type {
            OrderType::Sale | OrderType::SaleDispenser => product.sale_price,
            OrderType::Returns => product.sale_price, // Returns use sale price
            OrderType::Income => product.income_price,
            OrderType::Outcome => product.outcome_price,
        };

        // Calculate detailed taxes and discounts
        let (detailed_taxes, total_tax, total_tax_to_add) =
            Self::calculate_detailed_taxes(&product, count, price, &order_type)?;
        let (detailed_discounts, total_discount) =
            Self::calculate_detailed_discounts(&product, count, price, &order_type)?;

        // IMPORTANT: add to cost ONLY exclusive taxes (inclusive already inside price)
        let cost = (count * price) + total_tax_to_add - total_discount;

        Ok(OrderItemEntity {
            id: None,
            order_id,
            product: Some(product),
            count,
            price,
            discount: total_discount,
            cost,
            tax: total_tax, // full tax amount (inclusive + exclusive) for display/receipt
            taxes: detailed_taxes,
            discounts: detailed_discounts,
        })
    }

    /// Calculate detailed taxes for the order item
    /// Returns: (detailed_taxes, total_tax_all, total_tax_to_add_only_exclusive)
    pub fn calculate_detailed_taxes(
        product: &ProductEntity,
        count: Decimal,
        price: Decimal,
        order_type: &OrderType,
    ) -> Result<(Vec<OrderItemTaxEntity>, Decimal, Decimal)> {
        let mut detailed_taxes = Vec::new();

        // total_tax — общая сумма налогов (inclusive + exclusive) для отображения
        let mut total_tax = Decimal::ZERO;

        // total_tax_to_add — сумма налогов, которые нужно прибавлять к итоговой сумме (только exclusive)
        let mut total_tax_to_add = Decimal::ZERO;

        let base_amount = count * price;

        println!(
            "Calculating taxes for product: {}, count: {}, price: {}, order_type: {:?}",
            product.name, count, price, order_type
        );

        // Sum of inclusive tax rates (for correct extraction)
        let total_inclusive_rate: Decimal = product
            .taxes
            .iter()
            .filter(|tax| tax.order_type == *order_type && tax.is_inclusive)
            .map(|tax| tax.rate)
            .sum();

        for tax in &product.taxes {
            // Check if tax applies to this order type
            if tax.order_type == *order_type {
                let tax_amount = if tax.is_inclusive {
                    // Inclusive: extract from base (already included in price)
                    // Tax amount = base_amount * (rate / (100 + total_inclusive_rate))
                    ((base_amount * tax.rate) / (Decimal::from(100) + total_inclusive_rate))
                        .round_dp(2)
                } else {
                    // Exclusive: add on top
                    // Tax amount = (base_amount * rate) / 100
                    ((base_amount * tax.rate) / Decimal::from(100)).round_dp(2)
                };

                if tax_amount > Decimal::ZERO {
                    detailed_taxes.push(OrderItemTaxEntity {
                        id: None,
                        order_item_id: String::new(), // Will be set when saved
                        name: tax.short_name.clone(),
                        rate: Some(tax.rate),
                        value: tax_amount,
                    });

                    // Always sum for display
                    total_tax += tax_amount;

                    // But add to cost only if NOT inclusive
                    if !tax.is_inclusive {
                        total_tax_to_add += tax_amount;
                    }
                }
            }
        }

        Ok((
            detailed_taxes,
            total_tax.round_dp(2),
            total_tax_to_add.round_dp(2),
        ))
    }

    /// Calculate detailed discounts for the order item
    pub fn calculate_detailed_discounts(
        product: &ProductEntity,
        count: Decimal,
        price: Decimal,
        order_type: &OrderType,
    ) -> Result<(Vec<OrderItemDiscountEntity>, Decimal)> {
        let mut detailed_discounts = Vec::new();
        let mut total_discount = Decimal::ZERO;
        let base_amount = count * price;

        for discount in &product.discounts {
            // Check if discount applies to this order type
            if discount.order_type == *order_type {
                // Check if the bound condition is met
                let bound_value = match discount.discount_bound_type {
                    crate::shared::types::DiscountBoundType::Money => base_amount,
                    crate::shared::types::DiscountBoundType::Volume => count,
                };

                if bound_value >= discount.bound {
                    let discount_amount = match discount.discount_unit_type {
                        crate::shared::types::DiscountUnitType::Percent => {
                            ((base_amount * discount.value) / Decimal::from(100)).round_dp(2)
                        }
                        crate::shared::types::DiscountUnitType::MoneySum => {
                            discount.value.min(base_amount).round_dp(2) // Don't exceed the base amount
                        }
                        crate::shared::types::DiscountUnitType::MoneyPrice => {
                            (count * discount.value).round_dp(2)
                        }
                        crate::shared::types::DiscountUnitType::Count => {
                            // For count-based discounts, calculate based on units
                            if count >= discount.value {
                                // Free units based on discount value
                                let free_units = (count / discount.value).floor() * Decimal::ONE;
                                (free_units * price).round_dp(2)
                            } else {
                                Decimal::ZERO
                            }
                        }
                    };

                    if discount_amount > Decimal::ZERO {
                        detailed_discounts.push(OrderItemDiscountEntity {
                            id: None,
                            order_item_id: String::new(), // Will be set when saved
                            name: discount.name.clone(),
                            value: discount_amount,
                        });
                        total_discount += discount_amount;
                    }
                }
            }
        }

        total_discount = total_discount.round_dp(2); // Round total as well

        Ok((detailed_discounts, total_discount))
    }

    /// Update order item quantities and recalculate
    pub fn update_quantity(&mut self, new_count: Decimal, order_type: &OrderType) -> Result<()> {
        self.count = new_count;

        if let Some(product) = &self.product {
            let (detailed_taxes, total_tax, total_tax_to_add) =
                Self::calculate_detailed_taxes(product, self.count, self.price, order_type)?;

            let (detailed_discounts, total_discount) =
                Self::calculate_detailed_discounts(product, self.count, self.price, order_type)?;

            self.taxes = detailed_taxes;
            self.discounts = detailed_discounts;
            self.tax = total_tax; // full tax (inclusive + exclusive)
            self.discount = total_discount;

            // IMPORTANT: add to cost ONLY exclusive taxes
            self.cost = (self.count * self.price) + total_tax_to_add - total_discount;
        }

        Ok(())
    }
}
