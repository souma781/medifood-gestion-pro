import logo from "@/assets/el-madina-logo.jpg";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <img
        src={logo}
        alt="El Madina logo"
        className="h-10 w-10 rounded-lg object-contain bg-white shadow-sm"
      />
      {!compact && (
        <div className="leading-tight">
          <div className="text-base font-bold tracking-tight text-sidebar-foreground">EL MADINA</div>
          <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Tunisie</div>
        </div>
      )}
    </div>
  );
}