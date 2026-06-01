export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-[100] -translate-y-full rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform focus:translate-y-0"
    >
      Skip to main content
    </a>
  );
}
