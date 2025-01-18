import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Algo Trading Dashboard",
  description: "Algorithmic Trading Platform"
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Algo Trading Dashboard</h1>
    </main>
  );
}
