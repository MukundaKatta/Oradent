export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left Side - Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-teal-900">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-teal-500/20" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-teal-500/10" />
        <div className="absolute top-1/2 left-1/4 h-64 w-64 -translate-y-1/2 rounded-full bg-teal-400/10" />

        {/* Subtle tooth pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-3.5 0-6 1.5-7.5 4s-2.5 5-2.5 8c0 3 .5 6 1.5 9s2 6 3.5 8c1 1.5 2 2 3 .5.5-1 1-1 1.5-.5 1 1.5 2-.5 3-2 1.5-2.5 2.5-5 3.5-8s1.5-6 1.5-9c0-3-1-5.5-2.5-8S33.5 5 30 5z' fill='%23ffffff' fill-opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Top - Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
              <svg
                width="22"
                height="22"
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
            <span className="text-xl font-bold tracking-tight">Oradent</span>
          </div>

          {/* Center - Messaging */}
          <div className="max-w-sm">
            <h2 className="text-3xl font-bold leading-tight">
              Modern dental practice management,{" "}
              <span className="text-teal-200">simplified.</span>
            </h2>
            <p className="mt-4 text-base leading-relaxed text-teal-100">
              Streamline scheduling, patient records, billing, and more
              &mdash; all in one platform built for dental professionals.
            </p>

            {/* Feature pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              {[
                "Patient Records",
                "Scheduling",
                "Billing",
                "Treatment Plans",
                "Analytics",
              ].map((feature) => (
                <span
                  key={feature}
                  className="rounded-full border border-teal-400/30 bg-teal-500/20 px-3 py-1 text-xs font-medium text-teal-100 backdrop-blur-sm"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom - Testimonial / trust badge */}
          <div className="max-w-sm">
            <div className="rounded-xl border border-teal-400/20 bg-teal-500/10 p-4 backdrop-blur-sm">
              <p className="text-sm italic leading-relaxed text-teal-100">
                &ldquo;Oradent has transformed how we run our practice. What
                used to take hours now takes minutes.&rdquo;
              </p>
              <p className="mt-3 text-xs font-medium text-teal-200">
                Dr. Sarah Mitchell, DDS &mdash; Bright Smiles Dental
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Area */}
      <div className="flex w-full flex-col lg:w-1/2">
        <div className="flex flex-1 items-center justify-center bg-stone-50 px-4 py-8 sm:px-8">
          {/* Subtle background pattern for mobile */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.02] lg:hidden"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5c-3.5 0-6 1.5-7.5 4s-2.5 5-2.5 8c0 3 .5 6 1.5 9s2 6 3.5 8c1 1.5 2 2 3 .5.5-1 1-1 1.5-.5 1 1.5 2-.5 3-2 1.5-2.5 2.5-5 3.5-8s1.5-6 1.5-9c0-3-1-5.5-2.5-8S33.5 5 30 5z' fill='%231c1917' fill-opacity='1'/%3E%3C/svg%3E")`,
              backgroundSize: "60px 60px",
            }}
          />
          <div className="relative z-10 w-full max-w-md">
            {children}
          </div>
        </div>

        {/* Powered by footer */}
        <div className="flex items-center justify-center border-t border-stone-200 bg-stone-50 py-4">
          <div className="flex items-center gap-1.5 text-xs text-stone-400">
            <span>Powered by</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-teal-500"
            >
              <path
                d="M12 2C9.5 2 7.5 3 6.5 5C5.5 7 5 9 5 11C5 13 5.5 15 6 17C6.5 19 7 21 8.5 22C9.5 22.5 10.5 21 11 19C11.3 17.5 11.7 17.5 12 17.5C12.3 17.5 12.7 17.5 13 19C13.5 21 14.5 22.5 15.5 22C17 21 17.5 19 18 17C18.5 15 19 13 19 11C19 9 18.5 7 17.5 5C16.5 3 14.5 2 12 2Z"
                fill="currentColor"
              />
            </svg>
            <span className="font-semibold text-stone-500">Oradent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
