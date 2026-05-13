import { useState } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/layout/admin-layout";
import { useAuth } from "@/hooks/use-auth";
import { isAdminRole } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { Radio, Link2, BarChart3, Target, Rss } from "lucide-react";
import AdsTracking from "./ads-tracking";
import AdsIntegrations from "./ads-integrations";
import AdsAnalytics from "./ads-analytics";
import AdsCampaigns from "./ads-campaigns";
import AdsFeedSettings from "./ads-feed-settings";

const tabs = [
  { id: "tracking", label: "Tracking", icon: Radio },
  { id: "integrations", label: "Integrations", icon: Link2 },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "campaigns", label: "Campaigns", icon: Target },
  { id: "feed", label: "Feed & Settings", icon: Rss },
];

export default function AdminAds() {
  const { user, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("tracking");

  if (!authLoading && (!user || !isAdminRole(user.role as string))) { navigate("/admin/login"); return null; }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-sans mb-1">Marketing</p>
          <h1 className="font-serif text-2xl font-semibold text-foreground">Ads & Marketing</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto pb-px scrollbar-hide">
          {tabs.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-sans whitespace-nowrap transition-colors border-b-2 -mb-px",
                  activeTab === t.id ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                )}>
                <Icon className="h-4 w-4" />{t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "tracking" && <AdsTracking />}
          {activeTab === "integrations" && <AdsIntegrations />}
          {activeTab === "analytics" && <AdsAnalytics />}
          {activeTab === "campaigns" && <AdsCampaigns />}
          {activeTab === "feed" && <AdsFeedSettings />}
        </div>
      </div>
    </AdminLayout>
  );
}
