import { useUserStore } from "@/entities/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";

// Shadcn UI components
import { UpdateUserDTO } from "@/shared/bindings/dtos/UpdateUserDTO";
import useToast from "@/shared/hooks/use-toast";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/shadcn/card";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import { Lock, Mail, Phone, Save, User } from "lucide-react";

// Form schema with validation
const profileSchema = z.object({
  id: z.string().optional(),
  full_name: z
    .string()
    .min(2, "profile.name_min_length")
    .max(50, "profile.name_max_length"),
  username: z.string().min(3, "profile.username_min_length"),
  phone_number: z.string().optional(),
  password: z
    .string()
    .min(6, "profile.password_min_length")
    .max(50, "profile.password_max_length")
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfilePage() {
  const { t } = useTranslation();
  const { currentUser, updateUser } = useUserStore();
  const { showSuccessToast, showErrorToast } = useToast();

  // Initialize form with validation
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: currentUser
      ? {
          ...currentUser,
          id: currentUser.id ?? undefined,
        }
      : {},
  });

  // Reset form when user data changes
  useEffect(() => {
    if (currentUser) {
      reset({
        ...currentUser,
        id: currentUser.id ?? undefined,
        password: undefined, // Don't show password in form
      });
    }
  }, [currentUser, reset]);

  // Submit handler with improved error handling
  const onSubmit = async (values: ProfileFormValues) => {
    try {
      // Only send password if it was changed
      const dataToSave: UpdateUserDTO = {
        ...values,
        id: values.id!,
        roles: currentUser?.roles ?? [],
        phone_number: values.phone_number ?? "",
      };

      await updateUser(dataToSave);
      showSuccessToast(
        values.id ? t("success.data_updated") : t("success.data_created")
      );
      reset(values);
    } catch (error: any) {
      showErrorToast(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("menu.settings.profile")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("profile.update_your_profile_details")}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-xl">
              {currentUser?.full_name || t("user.profile")}
            </CardTitle>
            <CardDescription>
              {t("profile.manage_your_account_settings")}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6 px-8">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                  {t("profile.personal_information")}
                </h3>

                {/* Full Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="full_name"
                    className={`text-sm font-medium ${
                      errors.full_name ? "text-destructive" : ""
                    }`}
                  >
                    {t("user.full_name")} *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="full_name"
                      className={`pl-9 ${
                        errors.full_name ? "border-destructive" : ""
                      }`}
                      placeholder={t("placeholder.enter_full_name")}
                      {...register("full_name")}
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-sm text-destructive">
                      {t(errors.full_name.message as string)}
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label
                    htmlFor="phone_number"
                    className={`text-sm font-medium ${
                      errors.phone_number ? "text-destructive" : ""
                    }`}
                  >
                    {t("user.phone_number")}
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone_number"
                      className={`pl-9 ${
                        errors.phone_number ? "border-destructive" : ""
                      }`}
                      placeholder={t("placeholder.enter_phone")}
                      {...register("phone_number")}
                    />
                  </div>
                  {errors.phone_number && (
                    <p className="text-sm text-destructive">
                      {t(errors.phone_number.message as string)}
                    </p>
                  )}
                </div>
              </div>

              {/* Account Security Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                  {t("profile.account_security")}
                </h3>

                {/* Username */}
                <div className="space-y-2">
                  <Label
                    htmlFor="username"
                    className={`text-sm font-medium ${
                      errors.username ? "text-destructive" : ""
                    }`}
                  >
                    {t("user.username")}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      className={`pl-9 bg-muted ${
                        errors.username ? "border-destructive" : ""
                      }`}
                      disabled
                      {...register("username")}
                    />
                  </div>
                  {errors.username && (
                    <p className="text-sm text-destructive">
                      {t(errors.username.message as string)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("profile.username_cannot_be_changed")}
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className={`text-sm font-medium ${
                      errors.password ? "text-destructive" : ""
                    }`}
                  >
                    {t("user.password")}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      className={`pl-9 ${
                        errors.password ? "border-destructive" : ""
                      }`}
                      placeholder={t("placeholder.enter_new_password")}
                      {...register("password")}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">
                      {t(errors.password.message as string)}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {t("profile.leave_blank_to_keep_current_password")}
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end px-8 py-6 bg-muted/30">
              <Button
                type="submit"
                disabled={!isDirty || isSubmitting}
                className="gap-2 min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    {t("control.saving")}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {t("control.save_changes")}
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
