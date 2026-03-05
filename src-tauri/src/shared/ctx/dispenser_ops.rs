use super::Ctx;
use crate::domain::entities::dispenser_entity::DispenserEntity;
use crate::domain::entities::nozzle_entity::NozzleEntity;
use crate::domain::entities::product_entity::ProductEntity;
use crate::shared::event::HubEvent;
use dashmap::mapref::one::RefMut;

pub trait DispenserOps {
    fn update_dispenser(&self, dispenser: DispenserEntity);
    fn delete_dispenser(&self, id: String);
    // fn clear_dispenser_orders(&self);
    fn get_dispenser_by_id(&self, id: String) -> Option<RefMut<'_, String, DispenserEntity>>;
    fn get_dispesner_by_adres(&self, address: u8) -> Option<RefMut<'_, String, DispenserEntity>>;
    fn get_dispesner_by_nozzle_id(&self, id: String)
    -> Option<RefMut<'_, String, DispenserEntity>>;
    fn get_dispensers(&self) -> Vec<DispenserEntity>;
    fn update_nozzle(&self, nozzle: NozzleEntity);
    fn delete_nozzle(&self, id: String);
    fn update_product(&self, product: ProductEntity);
}

impl DispenserOps for Ctx {
    fn get_dispenser_by_id(&self, id: String) -> Option<RefMut<'_, String, DispenserEntity>> {
        let dispenser = self.dispensers.get_mut(&id);
        dispenser
    }

    fn get_dispesner_by_adres(&self, address: u8) -> Option<RefMut<'_, String, DispenserEntity>> {
        let id = self
            .address_to_dispenser
            .lock()
            .unwrap()
            .get(&address)
            .cloned();
        match id {
            Some(id) => self.get_dispenser_by_id(id),
            None => None,
        }
    }

    fn get_dispesner_by_nozzle_id(
        &self,
        id: String,
    ) -> Option<RefMut<'_, String, DispenserEntity>> {
        let id = self
            .nozzle_id_to_dispenser
            .lock()
            .unwrap()
            .get(&id)
            .cloned();

        match id {
            Some(id) => self.get_dispenser_by_id(id),
            None => None,
        }
    }

    fn get_dispensers(&self) -> Vec<DispenserEntity> {
        println!("Getting dispensers from context");
        let res: Vec<DispenserEntity> = self
            .dispensers
            .iter()
            .map(|dispenser| {
                let disp = dispenser.value();
                disp.clone()
            })
            .collect();
        println!("Dispensers count: {}", res.len());
        res
    }

    fn delete_dispenser(&self, id: String) {
        self.dispensers.remove(&id);
        self.address_to_dispenser
            .lock()
            .unwrap()
            .retain(|_, v| *v != id);
        self.nozzle_id_to_dispenser
            .lock()
            .unwrap()
            .retain(|_, v| *v != id);
    }

    fn update_dispenser(&self, dispenser: DispenserEntity) {
        let id = dispenser.id.clone().expect("dispenser.id cannot be None");
        self.dispensers.insert(id.clone(), dispenser.clone());

        // Map base address to dispenser
        self.address_to_dispenser
            .lock()
            .unwrap()
            .insert(dispenser.base_address, id.clone());

        // Map each nozzle address to dispenser (important for communication tracking)
        for nozzle in &dispenser.nozzles {
            self.address_to_dispenser
                .lock()
                .unwrap()
                .insert(nozzle.address, id.clone());

            self.nozzle_id_to_dispenser
                .lock()
                .unwrap()
                .insert(nozzle.id.clone().unwrap(), id.clone());
        }
    }

    fn update_nozzle(&self, nozzle: NozzleEntity) {
        let nozzle_id = nozzle.id.clone().expect("nozzle.id cannot be None");
        let dispenser_id = nozzle.dispenser_id.clone();

        // Map nozzle ID to dispenser
        self.nozzle_id_to_dispenser
            .lock()
            .unwrap()
            .insert(nozzle_id.clone(), dispenser_id.clone());

        // Map nozzle address to dispenser (important for communication tracking)
        self.address_to_dispenser
            .lock()
            .unwrap()
            .insert(nozzle.address, dispenser_id.clone());

        if let Some(mut dispenser) = self.dispensers.get_mut(&dispenser_id) {
            if let Some(existing_nozzle) = dispenser
                .nozzles
                .iter_mut()
                .find(|n| n.id.as_ref() == Some(&nozzle_id))
            {
                *existing_nozzle = nozzle;
            } else {
                dispenser.nozzles.push(nozzle);
            }
        }
    }

    fn delete_nozzle(&self, id: String) {
        let d = self.get_dispesner_by_nozzle_id(id.clone());
        if let Some(mut dispenser) = d {
            let disp = dispenser.value_mut();

            // Find the nozzle to get its address before removing
            if let Some(nozzle) = disp.nozzles.iter().find(|n| n.id == Some(id.clone())) {
                let nozzle_address = nozzle.address;

                // Remove nozzle from dispenser
                disp.nozzles.retain(|n| n.id != Some(id.clone()));

                // Clean up address mapping
                self.address_to_dispenser
                    .lock()
                    .unwrap()
                    .remove(&nozzle_address);
            }
        }

        // Clean up nozzle ID mapping
        self.nozzle_id_to_dispenser.lock().unwrap().remove(&id);
    }

    fn update_product(&self, product: ProductEntity) {
        for mut entry in self.dispensers.iter_mut() {
            for nozzle in &mut entry.value_mut().nozzles {
                if let Some(tank) = nozzle.tank.as_mut() {
                    if let Some(ref current_product) = tank.product {
                        if current_product.id == product.id {
                            tank.product = Some(product.clone());
                        }
                    }
                }
            }
        }
        // Emit ProductUpdated event to frontend
        self.emit_hub_event(HubEvent::ProductUpdated(Box::new(product)));
    }

    // fn clear_dispenser_orders(&self) {
    //     for key in self.dispensers.iter().map(|r| *r.key()) {
    //         if let Some(mut dispenser) = self.dispensers.get_mut(&key) {
    //             dispenser
    //                 .nozzles
    //                 .iter_mut()
    //                 .for_each(|n| n.fueling_order_id = None);
    //         }
    //     }
    // }
}
