import { Nav } from "@/components/Nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-dvh">
      <Nav />
      <main className="mx-auto max-w-5xl px-5 py-8 md:py-12">{children}</main>
    </div>
  );
}
