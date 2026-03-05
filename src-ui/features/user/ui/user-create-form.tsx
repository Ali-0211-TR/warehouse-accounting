import { UserFormSchema } from '@/entities/user'
import { EntityForm } from '@/shared/ui/components/EntityForm'
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/shared/ui/shadcn/form'
import { Input } from '@/shared/ui/shadcn/input'
import { Checkbox } from '@/shared/ui/shadcn/checkbox'
import { t } from 'i18next'
import { RoleType } from '@/shared/bindings/RoleType'
import { UserFormData } from '@/entities/user/model/types'
import { useFormContext } from 'react-hook-form'
import { emptyUser, userCreateValidationSchema, userEntityToCreateFormData, userFormDataToCreateDTO } from '@/entities/user/model/schemas'
import { CreateUserDTO } from '@/shared/bindings/dtos/CreateUserDTO'


interface UserCreateFormProps {
    visible: boolean
    onHide: () => void
    onSave: (user: CreateUserDTO) => Promise<void>
}

const roleOptions: RoleType[] = [
    "Administrator",
    "Manager",
    "Seller",
    "Operator",
    "Remote"
] as const

const UserFormFields = () => {
    const form = useFormContext<UserFormData>()
    const currentRoles = form.watch('roles') || []

    return (
        <div className="space-y-6 max-h-[80vh] overflow-y-auto md:overflow-visible px-2">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <FormField
                    name="full_name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('user.full_name')}</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    name="username"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('user.username')}</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    name="phone_number"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('user.phone_number')}</FormLabel>
                            <FormControl>
                                <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>{t('user.password')}</FormLabel>
                            <FormControl>
                                <Input
                                    type="password"
                                    {...field}
                                    value={field.value || ''}
                                    placeholder={field.value ? '••••••••' : t('user.enter_password')}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            {/* Roles Section */}
            <div>
                <FormLabel className="text-base font-medium">{t('user.roles')}</FormLabel>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                    {roleOptions.map(role => {
                        const isChecked = currentRoles.includes(role)

                        return (
                            <FormField
                                key={role}
                                name="roles"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <Checkbox
                                                checked={isChecked}
                                                onCheckedChange={(checked) => {
                                                    const currentValues = field.value || []
                                                    const updatedRoles = checked
                                                        ? [...currentValues, role]
                                                        : currentValues.filter((r: string) => r !== role)
                                                    field.onChange(updatedRoles)
                                                }}
                                            />
                                        </FormControl>
                                        <FormLabel
                                            className="text-sm font-normal cursor-pointer"
                                            onClick={() => {
                                                // Allow clicking label to toggle checkbox
                                                const currentValues = form.getValues('roles') || []
                                                const isCurrentlyChecked = currentValues.includes(role)
                                                const updatedRoles = isCurrentlyChecked
                                                    ? currentValues.filter((r: string) => r !== role)
                                                    : [...currentValues, role]

                                                form.setValue('roles', updatedRoles)
                                            }}
                                        >
                                            {t(`lists.role_type.${role}`)}
                                        </FormLabel>
                                    </FormItem>
                                )}
                            />
                        )
                    })}
                </div>
                <FormMessage />
            </div>
        </div>
    )
}

export function UserCreateForm({ visible, onHide, onSave }: UserCreateFormProps) {
    const header = t('user.add_user')
    const initialData = userEntityToCreateFormData(emptyUser);
    const handleSave = async (formData: UserFormSchema) => {
        const user = userFormDataToCreateDTO(formData);
        await onSave(user)
    }

    return (
        <EntityForm
            visible={visible}
            onHide={onHide}
            initialData={initialData} // Ensure roles are initialized
            header={header}
            schema={userCreateValidationSchema}
            onSave={handleSave}
        >
            <UserFormFields />
        </EntityForm>
    )
}