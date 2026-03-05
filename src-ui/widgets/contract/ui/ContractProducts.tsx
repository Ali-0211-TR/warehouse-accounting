// import { useState } from "react";
// import { t } from "i18next";
// import { ContractProductEntity } from '../../../shared/bindings/ContractProductEntity.ts';
// import { useContractStore } from '../../../entities/contract/index.ts';
// import { ContractProductDTO } from "../../../shared/bindings/dtos/ContractProductDTO.ts";
// import { Button } from "@/shared/ui/shadcn/button";
// import { Input } from "@/shared/ui/shadcn/input";
// import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/shadcn/card";
// import { Pencil, Trash2, PlusCircle, Save } from "lucide-react";

// export function ContractProducts() {
//     const { selectedContract, addContractProduct, updateContractProduct, deleteContractProduct } = useContractStore();
//     const [editRowId, setEditRowId] = useState<number | null>(null);
//     const [editRow, setEditRow] = useState<Partial<ContractProductEntity>>({});

//     const startEdit = (row: ContractProductEntity) => {
//         setEditRowId(row.id ?? null);
//         setEditRow({ ...row });
//     };

//     const cancelEdit = () => {
//         setEditRowId(null);
//         setEditRow({});
//     };

//     const saveEdit = () => {
//         if (!editRowId || !selectedContract?.id) return;
//         updateContractProduct({
//             id: editRowId,
//             contract_id: selectedContract.id,
//             product_id: editRow.product?.id ?? 1,
//             article: Number(editRow.article) || 0,
//             count: Number(editRow.count) || 0,
//             discount_id: editRow.discount?.id ?? null,
//         });
//         setEditRowId(null);
//         setEditRow({});
//     };

//     const handleFieldChange = (field: keyof ContractProductEntity, value: any) => {
//         setEditRow(prev => ({ ...prev, [field]: value }));
//     };

//     const addNewProduct = () => {
//         if (!selectedContract?.id) return;
//         const emptyProduct: ContractProductDTO = {
//             id: null,
//             contract_id: selectedContract.id,
//             product_id: 1,
//             article: 0,
//             count: 0,
//             discount_id: null
//         };
//         addContractProduct(emptyProduct);
//     };

//     return (
//         <Card>
//             <CardHeader>
//                 <CardTitle className="flex items-center justify-between">
//                     {t("contract.products")}
//                     <Button variant="default" size="sm" onClick={addNewProduct}>
//                         <PlusCircle className="h-4 w-4 mr-1" />
//                         {t("control.add")}
//                     </Button>
//                 </CardTitle>
//             </CardHeader>
//             <CardContent className="p-0">
//                 <div className="overflow-x-auto">
//                     <table className="min-w-full border text-xs md:text-sm">
//                         <thead>
//                             <tr className="bg-muted">
//                                 <th className="p-2">{t('contract_product.product')}</th>
//                                 <th className="p-2">{t('contract_product.article')}</th>
//                                 <th className="p-2">{t('contract_product.count')}</th>
//                                 <th className="p-2">{t('control.actions')}</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {(selectedContract?.contract_products ?? []).length === 0 ? (
//                                 <tr>
//                                     <td colSpan={4} className="text-center py-4 text-muted-foreground">
//                                         {t("message.no_data")}
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 selectedContract?.contract_products?.map((row) => (
//                                     <tr key={row.id ?? Math.random()} className="border-b">
//                                         <td className="p-2">
//                                             {row.product?.name}
//                                         </td>
//                                         <td className="p-2">
//                                             {editRowId === row.id ? (
//                                                 <Input
//                                                     type="number"
//                                                     value={editRow.article ?? ""}
//                                                     onChange={e => handleFieldChange("article", e.target.value)}
//                                                     className="w-24"
//                                                 />
//                                             ) : (
//                                                 row.article
//                                             )}
//                                         </td>
//                                         <td className="p-2">
//                                             {editRowId === row.id ? (
//                                                 <Input
//                                                     type="number"
//                                                     value={editRow.count ?? ""}
//                                                     onChange={e => handleFieldChange("count", e.target.value)}
//                                                     className="w-24"
//                                                 />
//                                             ) : (
//                                                 row.count
//                                             )}
//                                         </td>
//                                         <td className="p-2 flex gap-2">
//                                             {editRowId === row.id ? (
//                                                 <>
//                                                     <Button
//                                                         variant="default"
//                                                         size="icon"
//                                                         onClick={saveEdit}
//                                                         title={t("control.save")}
//                                                     >
//                                                         <Save className="h-4 w-4" />
//                                                     </Button>
//                                                     <Button
//                                                         variant="outline"
//                                                         size="icon"
//                                                         onClick={cancelEdit}
//                                                         title={t("control.cancel")}
//                                                     >
//                                                         X
//                                                     </Button>
//                                                 </>
//                                             ) : (
//                                                 <>
//                                                     <Button
//                                                         variant="outline"
//                                                         size="icon"
//                                                         onClick={() => startEdit(row)}
//                                                         title={t("control.edit")}
//                                                     >
//                                                         <Pencil className="h-4 w-4" />
//                                                     </Button>
//                                                     <Button
//                                                         variant="outline"
//                                                         size="icon"
//                                                         onClick={() => row.id && deleteContractProduct(row.id)}
//                                                         title={t("control.delete")}
//                                                     >
//                                                         <Trash2 className="h-4 w-4 text-destructive" />
//                                                     </Button>
//                                                 </>
//                                             )}
//                                         </td>
//                                     </tr>
//                                 ))
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </CardContent>
//         </Card>
//     );
// }






