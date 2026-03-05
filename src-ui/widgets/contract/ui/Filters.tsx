// import { useEffect, useState } from "react";
// import { t } from "i18next";
// // import { getClientTypeOptions, getOrderTypeOptions } from "../const/lists";
// // import { useUserStore } from "../../entities/user";
// // import { useClientStore } from "../../entities/client";
// // import { ClientEntity } from "../bindings/ClientEntity";
// import { Input } from "@/shared/ui/shadcn/input";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/shadcn/select";
// import { Calendar } from "@/shared/ui/shadcn/calendar";
// import { cn } from "@/shared/lib/utils";

// // ID filter (number input)
// export const idFilterTemplate = (options: { value: any; filterCallback: (val: any, idx?: number) => void; index?: number }) => (
//     <Input
//         type="number"
//         value={options.value ?? ""}
//         onChange={e => options.filterCallback(Number(e.target.value) || null, options.index)}
//         className="w-24"
//     />
// );

// // Order type filter (select)
// export const orderTypeFilterTemplate = (options: { value: any; filterCallback: (val: any, idx?: number) => void; index?: number }) => (
//     <Select
//         value={options.value ?? ""}
//         onValueChange={val => options.filterCallback(val, options.index)}
//     >
//         <SelectTrigger className="w-36">
//             <SelectValue placeholder={t("order.order_type")} />
//         </SelectTrigger>
//         <SelectContent>
//             {getOrderTypeOptions().map(opt => (
//                 <SelectItem key={opt.id} value={opt.id}>
//                     {opt.label}
//                 </SelectItem>
//             ))}
//         </SelectContent>
//     </Select>
// );

// // Client type filter (select)
// export const clientTypeFilterTemplate = (options: { value: any; filterCallback: (val: any, idx?: number) => void; index?: number }) => (
//     <Select
//         value={options.value ?? ""}
//         onValueChange={val => options.filterCallback(val, options.index)}
//     >
//         <SelectTrigger className="w-36">
//             <SelectValue placeholder={t("client.client_type")} />
//         </SelectTrigger>
//         <SelectContent>
//             {getClientTypeOptions().map(opt => (
//                 <SelectItem key={opt.id} value={opt.id}>
//                     {opt.label}
//                 </SelectItem>
//             ))}
//         </SelectContent>
//     </Select>
// );

// // Date range filter (calendar)
// import type { DateRange } from "react-day-picker";
// import { getClientTypeOptions, getOrderTypeOptions } from "@/shared/const/lists";
// import { useUserStore } from "@/entities/user";
// import { useClientStore } from "@/entities/client";
// import { ClientEntity } from "@/shared/bindings/ClientEntity";

// export const dateBetweenFilterTemplate = (options: { value: [Date | null, Date | null]; filterApplyCallback: (val: any) => void }) => {
//     const [start, end] = options.value ?? [null, null];
//     const selectedRange: DateRange | undefined =
//         start || end ? { from: start ?? undefined, to: end ?? undefined } : undefined;
//     return (
//         <div className="flex gap-1">
//             <Calendar
//                 mode="range"
//                 selected={selectedRange}
//                 onSelect={range => options.filterApplyCallback(range)}
//                 className="w-56"
//             />
//         </div>
//     );
// };

// // User filter (select)
// export const userFilterTemplate = (options: { value: any; filterCallback: (val: any, idx?: number) => void; index?: number }) => {
//     const { users, loadUsers } = useUserStore();
//     useEffect(() => {
//         if (!users || users.length === 0) loadUsers();
//     }, [users, loadUsers]);
//     return (
//         <Select
//             value={options.value ?? ""}
//             onValueChange={val => options.filterCallback(val, options.index)}
//         >
//             <SelectTrigger className="w-40">
//                 <SelectValue placeholder={t("user.user")} />
//             </SelectTrigger>
//             <SelectContent>
//                 {users?.map(user => (
//                     <SelectItem key={user.id} value={user.id != null ? String(user.id) : ""}>
//                         {user.full_name}
//                     </SelectItem>
//                 ))}
//             </SelectContent>
//         </Select>
//     );
// };

// // Client autocomplete filter (ShadCN Input + dropdown)
// export const ClientsFilterComponent = (props: { className?: string; client: ClientEntity | null; onChange: (value: ClientEntity | null) => void }) => {
//     const { clients, getClients } = useClientStore();
//     const [query, setQuery] = useState("");
//     const [filtered, setFiltered] = useState<ClientEntity[]>([]);
//     const [showDropdown, setShowDropdown] = useState(false);

//     useEffect(() => {
//         if (query.length > 0) {
//             getClients({
//                 first: 0,
//                 rows: 10,
//                 page: 0,
//                 sort_field: "Name",
//                 sort_order: "Asc",
//                 filters: {
//                     id: null,
//                     station_id: null,
//                     name: query,
//                     name_short: null,
//                     client_type: null,
//                     document_code: null,
//                     address: null,
//                     tax_code: null
//                 }
//             });
//         }
//     }, [query, getClients]);

//     useEffect(() => {
//         setFiltered(clients?.items ?? []);
//     }, [clients]);

//     return (
//         <div className={cn("relative", props.className)}>
//             <Input
//                 value={props.client?.name ?? query}
//                 placeholder={t("client.name")}
//                 onChange={e => {
//                     setQuery(e.target.value);
//                     setShowDropdown(true);
//                     props.onChange(null);
//                 }}
//                 onFocus={() => setShowDropdown(true)}
//                 className="w-full"
//                 autoComplete="off"
//             />
//             {showDropdown && filtered.length > 0 && (
//                 <div className="absolute z-10 bg-white border rounded shadow w-full max-h-56 overflow-auto">
//                     {filtered.map(client => (
//                         <div
//                             key={client.id}
//                             className="px-3 py-2 hover:bg-accent cursor-pointer"
//                             onClick={() => {
//                                 props.onChange(client);
//                                 setShowDropdown(false);
//                                 setQuery(client.name ?? "");
//                             }}
//                         >
//                             {client.name}
//                         </div>
//                     ))}
//                 </div>
//             )}
//         </div>
//     );
// };