import { Icons } from "@/components/Icons";
import { ModeToggle } from "@/components/ModeToggle";
import { NavbarSearch } from "./NavbarSearch";
import { NavbarTabs } from "./NavbarTabs";
import { UserButton } from "./UserButton";
import { Link } from "next-view-transitions";

export const Navbar = () => {
  return (
    <div className="flex w-full flex-col items-start border-b px-8">
      <div className="flex h-16 w-full items-center justify-between">
        <div className="flex items-center justify-center gap-4">
          <Link href="/">
            <Icons.logo className="size-7 text-primary" />
          </Link>
          <span className="text-muted-foreground">/</span>
          <NavbarSearch />
        </div>
        <div className="flex gap-4">
          <ModeToggle />
          <UserButton />
        </div>
      </div>
      <NavbarTabs />
    </div>
  );
};
