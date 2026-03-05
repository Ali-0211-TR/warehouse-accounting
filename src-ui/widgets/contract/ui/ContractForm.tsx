// import { useEffect } from 'react';
// import { Controller, useForm } from 'react-hook-form';
// import { t } from "i18next";
// import { useContractStore } from '../../../entities/contract';
// import { ContractEntity } from '../../../shared/bindings/ContractEntity';
// import { ContractProducts } from './ContractProducts';
// import { ContractCars } from './ContractCars';
// import { Button } from '@/shared/ui/shadcn/button';
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/ui/shadcn/dialog";
// import { Input } from "@/shared/ui/shadcn/input";
// import { Label } from "@/shared/ui/shadcn/label";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/shared/ui/shadcn/tabs";
// import { Calendar } from '@/shared/ui/shadcn/calendar';
// import { ClientsFilterComponent } from './Filters';


// type DialogComponentProps = {
//     onHide: () => void;
//     visible: boolean;
// };

// export function ContractForm(props: DialogComponentProps) {
//     const { onHide, visible } = props;
//     const { saveContract, selectedContract } = useContractStore();

//     const { register, handleSubmit, control, reset } = useForm<ContractEntity>({
//         defaultValues: selectedContract,
//     });

//     useEffect(() => {
//         if (visible) {
//             reset(selectedContract);
//         }
//     }, [visible, selectedContract, reset]);

//     const onSubmit = (value: ContractEntity) => {
//         saveContract(value);
//         onHide();
//     };

//     return (
//         <Dialog open={visible} onOpenChange={onHide}>
//             <DialogContent className="max-w-3xl w-full">
//                 <DialogHeader>
//                     <DialogTitle>{t('control.new')}</DialogTitle>
//                 </DialogHeader>
//                 <Tabs defaultValue="main" className="w-full">
//                     <TabsList className="mb-4">
//                         <TabsTrigger value="main">{t("contract.data")}</TabsTrigger>
//                         <TabsTrigger value="products">{t("contract.products")}</TabsTrigger>
//                         <TabsTrigger value="cars">{t("contract.cars")}</TabsTrigger>
//                     </TabsList>
//                     <TabsContent value="main">
//                         <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                                 <div>
//                                     <Label htmlFor="name">{t('contract.name')}</Label>
//                                     <Input id="name" {...register("name")} />
//                                 </div>
//                                 <div>
//                                     <Label htmlFor="contract_name">{t('contract.contract_name')}</Label>
//                                     <Input id="contract_name" {...register("contract_name")} />
//                                 </div>
//                                 <div>
//                                     <Label htmlFor="d_begin">{t('contract.d_begin')}</Label>
//                                     <Controller
//                                         name="d_begin"
//                                         control={control}
//                                         render={({ field }) => (
//                                             <Calendar
//                                                 selected={field.value ? new Date(field.value) : undefined}
//                                                 onSelect={(date: any) => field.onChange(date)}
//                                                 className="w-full"
//                                             />
//                                         )}
//                                     />
//                                 </div>
//                                 <div>
//                                     <Label htmlFor="d_end">{t('contract.d_end')}</Label>
//                                     <Controller
//                                         name="d_end"
//                                         control={control}
//                                         render={({ field }) => (
//                                             <Calendar
//                                                 selected={field.value ? new Date(field.value) : undefined}
//                                                 onSelect={(date: any) => field.onChange(date)}
//                                                 className="w-full"
//                                             />
//                                         )}
//                                     />
//                                 </div>
//                             </div>
//                             <div>
//                                 <Label htmlFor="client">{t('contract.client')}</Label>
//                                 <Controller
//                                     name="client"
//                                     control={control}
//                                     render={({ field }) => (
//                                         <ClientsFilterComponent className="w-full" client={field.value} onChange={field.onChange} />
//                                     )}
//                                 />
//                             </div>
//                             <DialogFooter className="mt-4 flex flex-row gap-2">
//                                 <Button type="button" variant="outline" onClick={onHide}>
//                                     {t('control.no')}
//                                 </Button>
//                                 <Button type="submit">
//                                     {t('control.yes')}
//                                 </Button>
//                             </DialogFooter>
//                         </form>
//                     </TabsContent>
//                     <TabsContent value="products">
//                         <ContractProducts />
//                     </TabsContent>
//                     <TabsContent value="cars">
//                         <ContractCars />
//                     </TabsContent>
//                 </Tabs>
//             </DialogContent>
//         </Dialog>
//     );
// }
