"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Invalid email or password. Please try again."
        );
      }

      const result = await response.json();

      localStorage.setItem("oradent_token", result.token || result.accessToken);
      if (result.refreshToken) {
        localStorage.setItem("oradent_refresh_token", result.refreshToken);
      }

      if (data.rememberMe) {
        localStorage.setItem("oradent_remember", "true");
      }

      router.push("/");
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
      {/* Branded Header */}
      <div className="mb-8 flex flex-col items-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 shadow-lg shadow-teal-500/20">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path
              d="M12 2C9.5 2 7.5 3 6.5 5C5.5 7 5 9 5 11C5 13 5.5 15 6 17C6.5 19 7 21 8.5 22C9.5 22.5 10.5 21 11 19C11.3 17.5 11.7 17.5 12 17.5C12.3 17.5 12.7 17.5 13 19C13.5 21 14.5 22.5 15.5 22C17 21 17.5 19 18 17C18.5 15 19 13 19 11C19 9 18.5 7 17.5 5C16.5 3 14.5 2 12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-stone-900">Welcome back</h1>
        <p className="mt-1 text-sm text-stone-500">
          Sign in to your Oradent account
        </p>
      </div>

      {/* Error display */}
      {serverError && (
        <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {serverError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-stone-700"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="dr.smith@oradent.com"
            className={`w-full rounded-lg border px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
              errors.email
                ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                : "border-stone-300"
            }`}
            {...register("email")}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-stone-700"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              className={`w-full rounded-lg border px-3 py-2.5 pr-10 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${
                errors.password
                  ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                  : "border-stone-300"
              }`}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-red-600">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer h-4 w-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500/20 cursor-pointer"
                {...register("rememberMe")}
              />
            </div>
            <span className="text-sm text-stone-600 select-none">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="relative flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-600/20 transition-all hover:from-teal-700 hover:to-teal-800 hover:shadow-md hover:shadow-teal-600/25 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
              <span className="absolute bottom-0 left-0 h-0.5 animate-pulse rounded-b-lg bg-white/30 w-full" />
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign in
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-stone-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-stone-400">or</span>
        </div>
      </div>

      {/* Register link */}
      <p className="text-center text-sm text-stone-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-teal-600 hover:text-teal-700 transition-colors"
        >
          Create one
        </Link>
      </p>

      {/* Demo credentials */}
      <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3">
        <p className="text-xs font-medium text-stone-500 mb-1">Demo Credentials</p>
        <div className="flex items-center justify-between">
          <code className="text-xs text-stone-600">sarah@brightsmiles.com / password123</code>
          <button
            type="button"
            onClick={() => {
              setValue("email", "sarah@brightsmiles.com");
              setValue("password", "password123");
            }}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            Fill
          </button>
        </div>
      </div>
    </div>
  );
}
