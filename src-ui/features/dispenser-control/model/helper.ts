import { DispenserEntity } from "@/entities/dispenser";
import { NozzleEntity } from "@/shared/bindings/NozzleEntity";
import { t } from "i18next";

export const getStateLabel = (dispenser: DispenserEntity, selectedNozzle: NozzleEntity | null): string => {

    if (dispenser.fueling_state.start) {
        if (dispenser.fueling_state.pause) {
            return t("dispenser_state.pause", {
                disp: dispenser.name,
                product: selectedNozzle?.tank?.product?.short_name
            });
        } else {
            return t("dispenser_state.fueling", {
                disp: dispenser.name,
                product: selectedNozzle?.tank?.product?.short_name
            });
        }
    } else {
        if (selectedNozzle) {
            return t("dispenser_state.waiting_selected", {
                disp: dispenser.name,
                product: selectedNozzle.tank?.product?.short_name
            });
        } else {
            return t("dispenser_state.waiting", { disp: dispenser.name });
        }

    }


}