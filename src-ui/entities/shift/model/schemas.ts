import { z } from 'zod'

// export const emptyShift = (user: UserEntity): ShiftEntity => ({
//     id: null,
//     d_open: new Date().toISOString(),
//     d_close: null,
//     user_open: user,
//     user_close: null,
//     data_open: [],
//     data_close: null
// })

export const shiftValidationSchema = z.object({
    id: z.number().nullable().optional(),
    d_open: z.string().min(1, { message: 'shift.d_open_required' }),
    d_close: z.string().nullable().optional(),
    user_open_id: z.number().min(1, { message: 'shift.user_open_required' }),
    user_close_id: z.number().nullable().optional(),
    data_open: z.array(z.any()).min(1, { message: 'shift.data_open_required' }),
    data_close: z.array(z.any()).nullable().optional()
})

export const openShiftSchema = z.object({
    data_open: z.array(z.any()).min(1, { message: 'shift.data_open_required' })
})

export const closeShiftSchema = z.object({
    data_close: z.array(z.any()).min(1, { message: 'shift.data_close_required' })
})

export type ShiftFormSchema = z.infer<typeof shiftValidationSchema>
export type OpenShiftFormSchema = z.infer<typeof openShiftSchema>
export type CloseShiftFormSchema = z.infer<typeof closeShiftSchema>