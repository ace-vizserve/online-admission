import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NavigationMenuProps } from "@radix-ui/react-navigation-menu";
import { LogInIcon, MenuIcon } from "lucide-react";
import { Link } from "react-router";
import Logo from "../logo";
import MaxWidthWrapper from "../max-width-wrapper";
import { Button, buttonVariants } from "../ui/button";

function Navbar() {
  return (
    <nav className="sticky top-0 z-20 bg-white/70 backdrop-blur-lg border-b">
      <MaxWidthWrapper>
        <div className="flex items-center justify-between py-4 overflow-visible">
          <Logo />
          {/* Desktop Menu */}
          <Menu className="hidden md:block" />
          <div className="flex items-center gap-3">
            <Link
              to={"/login"}
              className={buttonVariants({
                variant: "outline",
                className: "hidden sm:flex gap-2",
              })}>
              Sign In <LogInIcon />
            </Link>
            <Button>Get Started</Button>
            {/* Mobile Menu */}
            <div className="md:hidden">
              <MobileMenu />
            </div>
          </div>
        </div>
      </MaxWidthWrapper>
    </nav>
  );
}

function MobileMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <Logo />
        <Menu orientation="vertical" className="items-start" />
      </SheetContent>
    </Sheet>
  );
}

function Menu(props: NavigationMenuProps) {
  return (
    <NavigationMenu {...props}>
      <NavigationMenuList className="gap-6 space-x-0 data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-start">
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="/">Home</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="#">About HFSE</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="#">Admission</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="#">FAQ</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link to="#">Contact Us</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default Navbar;
