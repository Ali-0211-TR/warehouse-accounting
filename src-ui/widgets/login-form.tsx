import { useSettingsState } from "@/entities/settings";
import { useUser } from "@/features/user";
import useToast from "@/shared/hooks/use-toast";
import { pathKeys } from "@/shared/lib/react-router";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import { zodResolver } from "@hookform/resolvers/zod";
import { t } from "i18next";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const loginSchema = z.object({
  login: z.string().min(1, "login_is_required").max(50, "login_too_long"),
  password: z
    .string()
    .min(0, "password_must_be_at_least_5_letters")
    .max(50, "password_too_long"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const LAST_LOGIN_KEY = "lastLogin";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const { showErrorToast } = useToast();
  const { login, loading } = useUser();
  const { data } = useSettingsState();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      login: "",
      password: "",
    },
  });

  // Load last login from localStorage on mount
  useEffect(() => {
    const lastLogin = localStorage.getItem(LAST_LOGIN_KEY);
    if (lastLogin) {
      setValue("login", lastLogin);
    }
  }, [setValue]);

  const onSubmit = (loginData: LoginFormValues) => {
    login(loginData.login, loginData.password)
      .then(user => {
        if (user) {
          // Save the login username to localStorage (not password!)
          localStorage.setItem(LAST_LOGIN_KEY, loginData.login);
          const isWarehouse = (data.appMode ?? "fuel") === "warehouse";
          if (!isWarehouse) {
            navigate(pathKeys.home());
          } else {
            navigate(pathKeys.warehouse());
          }
        }
      })
      .catch(error => {
        console.error("Login failed:", error);
        showErrorToast(t("error.login_failed"));
      });
  };

  const getFormErrorMessage = (name: keyof LoginFormValues) =>
    errors[name] ? (
      <small className="text-red-500 text-sm mt-1">
        {t("error." + ((errors[name]?.message as string) ?? "error"))}
      </small>
    ) : null;

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">
                  {t("title.enter_system")}
                </h1>
                <p className="text-balance text-muted-foreground">
                  {t("title.enter_credentials")}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="login">{t("control.login")}</Label>
                <Input
                  id="login"
                  placeholder={t("placeholder.enter_login")}
                  disabled={loading}
                  autoComplete="login"
                  {...register("login")}
                />
                {getFormErrorMessage("login")}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">{t("control.password")}</Label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("placeholder.enter_password")}
                  disabled={loading}
                  autoComplete="password"
                  {...register("password")}
                />
                {getFormErrorMessage("password")}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {t("control.login")}
              </Button>
            </div>
          </form>
          <div className="relative hidden bg-muted md:block md:flex md:items-center md:justify-center">
            <img
              src="/assets/images/logo.png"
              alt="Складской учёт"
              className="w-2/3 object-contain dark:brightness-[0.8]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
