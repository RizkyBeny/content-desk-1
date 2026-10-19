export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="mx-auto w-full max-w-md">{children}</div>
    </div>
  );
}
