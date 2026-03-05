import { UserEntity } from '@/entities/user'
import { ChangeUserPasswordFormSchema, changeUserPasswordValidationSchema, formDataToChangePasswordDTO, userEntityToChangePasswordFormData } from '@/entities/user/model/schemas'
import { ChangePasswordDTO } from '@/shared/bindings/dtos/ChangePasswordDTO'
import { EntityForm } from '@/shared/ui/components/EntityForm'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/shadcn/form'
import { Input } from '@/shared/ui/shadcn/input'
import { t } from 'i18next'


interface ChangePasswordFormProps {
    visible: boolean
    onHide: () => void
    user: UserEntity,
    onSave: (data: ChangePasswordDTO) => Promise<void>
}



const UserFormFields = () => {

    return (
        <div className="space-y-6">
            <FormField
                name="password"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('user.new_password')}</FormLabel>
                        <FormControl>
                            <Input
                                type="password"
                                {...field}
                                value={field.value || ''}
                                placeholder={field.value ? '••••••••' : t('user.enter_new_password')}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>

    )
}

export function ChangePasswordForm({ visible, user, onHide, onSave }: ChangePasswordFormProps) {
    const header = t('user.change_password')
    const initialData = userEntityToChangePasswordFormData(user);
    const handleSave = async (formData: ChangeUserPasswordFormSchema) => {
        const user = formDataToChangePasswordDTO(formData);
        await onSave(user)
    }

    return (
        <EntityForm
            visible={visible}
            initialData={initialData}
            onHide={onHide}
            header={header}
            schema={changeUserPasswordValidationSchema}
            onSave={handleSave}
        >
            <UserFormFields />
        </EntityForm>
    )
}
