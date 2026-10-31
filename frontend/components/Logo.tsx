import Link from "next/link";
import { Compass } from "lucide-react";

export default function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-gold-500 text-white shadow-lg">
        <Compass size={20} />
      </span>
      <span className="text-lg">Astrolabe</span>
    </Link>
  );
}
