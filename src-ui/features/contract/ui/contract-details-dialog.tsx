import { ContractEntity } from "@/entities/contract";
import { contractApi } from "@/entities/contract/api/contract-api";
import { ContractCarEntity } from "@/shared/bindings/ContractCarEntity";
import { ContractProductEntity } from "@/shared/bindings/ContractProductEntity";
import { Badge } from "@/shared/ui/shadcn/badge";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/ui/shadcn/tabs";
import { t } from "i18next";
import { Calendar, Car, FileText, Package, Plus, User } from "lucide-react";
import { useEffect, useState } from "react";
import { ContractCarForm } from "./contract-car-form";
import { ContractProductForm } from "./contract-product-form";

interface ContractDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string | null;
}

export function ContractDetailsDialog({
  open,
  onOpenChange,
  contractId,
}: ContractDetailsDialogProps) {
  const [contract, setContract] = useState<ContractEntity | null>(null);
  const [cars, setCars] = useState<ContractCarEntity[]>([]);
  const [products, setProducts] = useState<ContractProductEntity[]>([]);
  const [loading, setLoading] = useState(false);
  const [carFormOpen, setCarFormOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<ContractCarEntity | null>(
    null
  );
  const [selectedProduct, setSelectedProduct] =
    useState<ContractProductEntity | null>(null);

  useEffect(() => {
    if (open && contractId) {
      loadContractDetails();
    }
  }, [open, contractId]);

  const loadContractDetails = async () => {
    if (!contractId) return;

    setLoading(true);
    try {
      const [contractData, carsData, productsData] = await Promise.all([
        contractApi.getContractById(contractId),
        contractApi.getContractCars(),
        contractApi.getContractProducts(),
      ]);

      setContract(contractData);
      // Filter cars and products for this specific contract
      setCars(carsData.filter(car => car.contract_id === contractId));
      setProducts(
        productsData.filter(product => product.contract_id === contractId)
      );
    } catch (error) {
      console.error("Failed to load contract details:", error);
    } finally {
      setLoading(false);
    }
  };

  const getContractStatus = (contract: ContractEntity) => {
    if (!contract.d_begin || !contract.d_end) {
      return { status: "unknown", color: "gray" };
    }

    const today = new Date().toISOString().split("T")[0];
    const startDate = contract.d_begin.split("T")[0];
    const endDate = contract.d_end.split("T")[0];

    if (today < startDate) return { status: "pending", color: "yellow" };
    if (today > endDate) return { status: "expired", color: "red" };
    return { status: "active", color: "green" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleAddCar = () => {
    setSelectedCar(null);
    setCarFormOpen(true);
  };

  const handleEditCar = (car: ContractCarEntity) => {
    setSelectedCar(car);
    setCarFormOpen(true);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setProductFormOpen(true);
  };

  const handleEditProduct = (product: ContractProductEntity) => {
    setSelectedProduct(product);
    setProductFormOpen(true);
  };

  const handleCarSaved = () => {
    setCarFormOpen(false);
    setSelectedCar(null);
    loadContractDetails();
  };

  const handleProductSaved = () => {
    setProductFormOpen(false);
    setSelectedProduct(null);
    loadContractDetails();
  };

  if (!contract) return null;

  const { status } = getContractStatus(contract);
  const variants: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
    expired: "bg-red-50 text-red-700 border-red-200",
    unknown: "bg-gray-50 text-gray-700 border-gray-200",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("contract.contract_details")}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  {t("common.loading")}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Contract Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{contract.name}</span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        variants[status] || variants.unknown
                      }`}
                    >
                      {t(`contract.status_${status}`) || status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("contract.contract_name")}
                      </label>
                      <p className="mt-1">{contract.contract_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("contract.client")}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {contract.client?.name || t("common.not_assigned")}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        {t("contract.date_range")}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatDate(contract.d_begin)} -{" "}
                          {formatDate(contract.d_end)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs for Cars and Products */}
              <Tabs defaultValue="cars" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="cars" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    {t("contract.cars")} ({cars.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="products"
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    {t("contract.products")} ({products.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="cars" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      {t("contract.contract_cars")}
                    </h3>
                    <Button onClick={handleAddCar} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("contract.add_car")}
                    </Button>
                  </div>

                  {cars.length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <Car className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            {t("contract.no_cars")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {cars.map(car => (
                        <Card
                          key={car.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleEditCar(car)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Car className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{car.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {car.comment}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="products" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      {t("contract.contract_products")}
                    </h3>
                    <Button onClick={handleAddProduct} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("contract.add_product")}
                    </Button>
                  </div>

                  {products.length === 0 ? (
                    <Card>
                      <CardContent className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground">
                            {t("contract.no_products")}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {products.map(product => (
                        <Card
                          key={product.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleEditProduct(product)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Package className="h-5 w-5 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">
                                    {product.product?.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {t("contract.count")}: {product.count} |{" "}
                                    {t("contract.article")}: {product.article}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contract Car Form */}
      <ContractCarForm
        open={carFormOpen}
        onOpenChange={setCarFormOpen}
        contractId={contractId}
        car={selectedCar}
        onSaved={handleCarSaved}
      />

      {/* Contract Product Form */}
      <ContractProductForm
        open={productFormOpen}
        onOpenChange={setProductFormOpen}
        contractId={contractId}
        product={selectedProduct}
        onSaved={handleProductSaved}
      />
    </>
  );
}
