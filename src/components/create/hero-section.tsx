/**
 * Hero halaman Create (Figma "Generate Image" — node 776:23662).
 *
 * Judul 48px bold + subtitle 16px, keduanya terpusat. Hanya tipografi &
 * layout; warna mengikuti token tema aplikasi (--foreground / muted).
 */
export function HeroSection({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mx-auto flex w-full max-w-3xl flex-col items-center gap-4 px-4 py-8 text-center sm:py-12">
      <h1 className="text-3xl font-bold tracking-[-0.025em] sm:text-4xl md:text-[48px] md:leading-[52px]">
        {title}
      </h1>
      <p className="max-w-2xl text-sm leading-6 text-zinc-500 dark:text-zinc-400 sm:text-base sm:leading-6">
        {subtitle}
      </p>
    </header>
  );
}
