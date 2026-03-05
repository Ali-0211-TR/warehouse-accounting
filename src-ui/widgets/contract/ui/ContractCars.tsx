// import { useState } from "react";
// import { t } from "i18next";
// import { useContractStore } from '../../../entities/contract';
// import { ContractCarDTO } from "../../../shared/bindings/dtos/ContractCarDTO";
// import { ContractCarEntity } from "../../../shared/bindings/ContractCarEntity";
// import { Button } from "@/shared/ui/shadcn/button";
// import { Input } from "@/shared/ui/shadcn/input";
// import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/shadcn/card";
// import { Pencil, Trash2, PlusCircle, Save } from "lucide-react";

// export function ContractCars() {
//     const { selectedContract, addContractCar, updateContractCar, deleteContractCar } = useContractStore();
//     const [editRowId, setEditRowId] = useState<number | null>(null);
//     const [editRow, setEditRow] = useState<Partial<ContractCarEntity>>({});

//     const startEdit = (row: ContractCarEntity) => {
//         setEditRowId(row.id ?? null);
//         setEditRow({ ...row });
//     };

//     const cancelEdit = () => {
//         setEditRowId(null);
//         setEditRow({});
//     };

//     const saveEdit = () => {
//         if (!editRowId || !selectedContract?.id) return;
//         updateContractCar({
//             id: editRowId,
//             station_id: editRow.station?.id ?? 0,
//             contract_id: selectedContract.id,
//             name: editRow.name ?? "",
//             comment: editRow.comment ?? "",
//         });
//         setEditRowId(null);
//         setEditRow({});
//     };

//     const handleFieldChange = (field: keyof ContractCarEntity, value: any) => {
//         setEditRow(prev => ({ ...prev, [field]: value }));
//     };

//     const addNewCar = () => {
//         if (!selectedContract?.id) return;
//         const emptyCar: ContractCarDTO = {
//             id: null,
//             station_id: 0,
//             contract_id: selectedContract.id,
//             name: "",
//             comment: ""
//         };
//         addContractCar(emptyCar);
//     };

//     return (
//         <Card>
//             <CardHeader>
//                 <CardTitle className="flex items-center justify-between">
//                     {t("contract.cars")}
//                     <Button variant="default" size="sm" onClick={addNewCar}>
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
//                                 <th className="p-2">{t('contract_car.name')}</th>
//                                 <th className="p-2">{t('contract_car.comment')}</th>
//                                 <th className="p-2">{t('control.actions')}</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {(selectedContract?.contract_cars ?? []).length === 0 ? (
//                                 <tr>
//                                     <td colSpan={3} className="text-center py-4 text-muted-foreground">
//                                         {t("message.no_data")}
//                                     </td>
//                                 </tr>
//                             ) : (
//                                 selectedContract?.contract_cars?.map((row) => (
//                                     <tr key={row.id ?? Math.random()} className="border-b">
//                                         <td className="p-2">
//                                             {editRowId === row.id ? (
//                                                 <Input
//                                                     value={editRow.name ?? ""}
//                                                     onChange={e => handleFieldChange("name", e.target.value)}
//                                                     className="w-32"
//                                                 />
//                                             ) : (
//                                                 row.name
//                                             )}
//                                         </td>
//                                         <td className="p-2">
//                                             {editRowId === row.id ? (
//                                                 <Input
//                                                     value={editRow.comment ?? ""}
//                                                     onChange={e => handleFieldChange("comment", e.target.value)}
//                                                     className="w-32"
//                                                 />
//                                             ) : (
//                                                 row.comment
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
//                                                         onClick={() => row.id && deleteContractCar(row.id)}
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