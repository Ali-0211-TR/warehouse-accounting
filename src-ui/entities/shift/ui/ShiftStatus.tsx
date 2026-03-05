import { useEffect } from "react";
import { formatStrDate } from "../../../shared/helpers";
import { useNavigate } from "react-router-dom";
import { pathKeys } from "../../../shared/lib/react-router";
import { Button } from "@/shared/ui/shadcn/button";
import { useShiftStore } from "../model/store";

export const ShiftStatus = () => {
  const { currentShift, shifts: data, getCurrentShift } = useShiftStore();
  const navigate = useNavigate();

  useEffect(() => {
    getCurrentShift();
  }, [data, getCurrentShift]);

  return (
    <>
      {/* <p>{currentUser?.full_name}</p> */}
      <Button
        variant={currentShift ? "default" : "destructive"}
        onClick={() => navigate(pathKeys.shift())}
      >
        {currentShift
          ? `${"Смена"}: ${formatStrDate(currentShift.d_open)}`
          : "Смена закрыта"}
      </Button>
    </>
  );
};
