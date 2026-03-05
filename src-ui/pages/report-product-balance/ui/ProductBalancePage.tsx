import { ProductMovementReport } from "@/features/product";
import { ReportLayout } from "@/shared/ui/components/ReportLayout";

export function ProductBalancePage() {
  return (
    <ReportLayout title="product_movement.title">
      <ProductMovementReport />
    </ReportLayout>
  );
}
