import * as React from "react";
import { Eye, EyeOff, ShieldCheck, Lock } from "lucide-react";
import { cn } from "../../utils/cn";
import { InputWithBtnPopUp } from "./input-with-btn-popup";
import { Badge } from "./badge";

export interface PasswordStrengthResult {
  score: number; // 0 to 100
  label: string;
  color: string;
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  if (!password) return { score: 0, label: "Kosong", color: "bg-muted" };
  let score = 0;
  if (password.length >= 8) score += 25;
  if (/[A-Z]/.test(password)) score += 25;
  if (/[0-9]/.test(password)) score += 25;
  if (/[^A-Za-z0-9]/.test(password)) score += 25;

  if (score <= 25) return { score: 25, label: "Lemah", color: "bg-red-500" };
  if (score === 50) return { score: 50, label: "Sedang", color: "bg-amber-500" };
  if (score === 75) return { score: 75, label: "Kuat", color: "bg-blue-500" };
  return { score: 100, label: "Sangat Kuat", color: "bg-emerald-500" };
}

export interface PasswordInputProps
  extends Omit<React.ComponentProps<"input">, "size"> {
  showStrengthMeter?: boolean;
  size?: "sm" | "default" | "lg";
  error?: string;
  displayMaskedOnly?: boolean;
}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      value = "",
      onChange,
      showStrengthMeter = false,
      displayMaskedOnly = false,
      className,
      error,
      size = "default",
      placeholder = "Masukkan kata sandi...",
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);

    // Mode Display Only (untuk tabel atau kartu detail)
    if (displayMaskedOnly) {
      return (
        <div className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-muted-foreground font-mono text-xs">
          <Lock className="h-3 w-3 text-emerald-600" />
          <span className="tracking-widest select-none">••••••••</span>
          <Badge variant="outline" className="text-[9px] py-0 px-1 font-sans">
            Hidden
          </Badge>
        </div>
      );
    }

    const currentVal = typeof value === "string" ? value : "";
    const strength = evaluatePasswordStrength(currentVal);

    return (
      <div className="w-full space-y-1.5">
        <InputWithBtnPopUp
          ref={ref}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          size={size}
          error={error}
          buttonIcon={
            showPassword ? (
              <EyeOff className="h-3.5 w-3.5" />
            ) : (
              <Eye className="h-3.5 w-3.5" />
            )
          }
          buttonLabel={showPassword ? "Sembunyikan" : "Periksa"}
          onButtonClick={() => setShowPassword((prev) => !prev)}
          className={className}
          {...props}
        />

        {showStrengthMeter && currentVal && (
          <div className="space-y-1 pt-0.5">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-primary" />
                Kekuatan Password:{" "}
                <span className="font-semibold text-foreground">
                  {strength.label}
                </span>
              </span>
              <span>{strength.score}%</span>
            </div>
            <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  strength.color
                )}
                style={{ width: `${strength.score}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
