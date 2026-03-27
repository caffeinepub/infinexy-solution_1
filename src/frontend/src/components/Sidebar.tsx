import { cn } from "@/lib/utils";
import {
  FileText,
  LayoutDashboard,
  List,
  LogOut,
  PlusCircle,
  Settings,
  Users,
} from "lucide-react";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface Props {
  userRole: "admin" | "executive";
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userName: string;
}

const adminNav: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  { id: "records", label: "Records", icon: <FileText className="w-4 h-4" /> },
  {
    id: "executives",
    label: "Executives",
    icon: <Users className="w-4 h-4" />,
  },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

const execNav: NavItem[] = [
  {
    id: "add-record",
    label: "Add Record",
    icon: <PlusCircle className="w-4 h-4" />,
  },
  { id: "my-records", label: "My Records", icon: <List className="w-4 h-4" /> },
  { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" /> },
];

export default function Sidebar({
  userRole,
  activeTab,
  onTabChange,
  onLogout,
  userName,
}: Props) {
  const nav = userRole === "admin" ? adminNav : execNav;

  return (
    <aside
      className="no-print w-56 flex-shrink-0 flex flex-col h-screen sticky top-0"
      style={{ background: "oklch(var(--sidebar))" }}
    >
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <img
          src="/assets/generated/infinexy-logo-transparent.dim_200x200.png"
          alt="Infinexy Logo"
          className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
        />
        <div>
          <p className="text-sidebar-foreground font-bold text-sm leading-tight">
            Infinexy
          </p>
          <p className="text-muted-foreground text-xs">Solution</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map((item) => (
          <button
            type="button"
            key={item.id}
            data-ocid={`nav.${item.id}.link`}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id
                ? "bg-primary/20 text-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-sidebar-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-semibold text-sidebar-foreground truncate">
            {userName}
          </p>
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary capitalize">
            {userRole}
          </span>
        </div>
        <button
          type="button"
          data-ocid="nav.logout.button"
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
