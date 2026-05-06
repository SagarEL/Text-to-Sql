"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ModeToggle } from "./ModeToggle"
import { Button } from "@/components/ui/button"
import { useDatabaseContext } from "@/app/contexts/DatabaseContext"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { cn } from "@/lib/utils"
import { LogOut } from "lucide-react"

const components = [
  {
    title: "Query",
    href: "/",
  },
  {
    title: "Chat",
    href: "/chat",
  },
]

export function Header() {
  const { isConnected, logout } = useDatabaseContext();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 max-w-10xl mx-auto">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold">EasySQL</span>
          </Link>
        </div>
        <NavigationMenu>
          <NavigationMenuList>
            {components.map((item) => (
              <NavigationMenuItem key={item.title}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {item.title}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
        <nav className="flex items-center gap-2">
          {isConnected && (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          )}
          <ModeToggle />
        </nav>
      </div>
    </header>
  )
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"