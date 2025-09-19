import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { cn } from "@/lib/utils";

interface CustomNavLinkProps extends NavLinkProps {
  children: React.ReactNode;
  className?: string;
}

export function NavLink({ children, className, ...props }: CustomNavLinkProps) {
  return (
    <RouterNavLink
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-smooth",
          "hover:bg-muted/50 hover:text-foreground",
          isActive
            ? "bg-primary text-primary-foreground shadow-soft"
            : "text-muted-foreground",
          className
        )
      }
      {...props}
    >
      {children}
    </RouterNavLink>
  );
}