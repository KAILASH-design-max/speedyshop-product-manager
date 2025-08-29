import { Package } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
          <Package className="h-6 w-6 text-primary" />
          <span className="ml-2 text-lg font-bold">Stock Watch</span>
        </div>
      </div>
    </header>
  );
}
