import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/store/auth";
import { ROLE_BADGE, ROLE_SHORT } from "@/lib/rbac";
import { Logo } from "@/components/medifood/Logo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("admin@medifood.tn");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const users = useAuth((s) => s.users);
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const r = login(email, password);
      setLoading(false);
      if (r.ok === false) {
        toast.error(r.error);
        return;
      }
      navigate("/dashboard");
    }, 500);
  };

  const fill = (u: typeof users[number]) => {
    setEmail(u.email);
    setPassword(u.password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary to-primary/80 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <div className="rounded-2xl bg-sidebar p-4 shadow-2xl">
            <Logo />
          </div>
        </div>
        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-foreground">Connexion</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Plateforme de gestion EL MADINA
              </p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Mot de passe</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Se connecter
              </Button>
            </form>

            <div className="mt-6 border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Comptes de démonstration
              </p>
              <div className="space-y-1.5">
                {users.map((u) => (
                  <button
                    key={u.email}
                    type="button"
                    onClick={() => fill(u)}
                    className="w-full flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-left text-xs hover:bg-muted transition"
                  >
                    <div>
                      <div className="font-medium text-foreground">{u.name}</div>
                      <div className="text-muted-foreground">{u.email}</div>
                    </div>
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", ROLE_BADGE[u.role])}>
                      {ROLE_SHORT[u.role]}{u.assignedProducts?.length ? ` · ${u.assignedProducts.join(", ")}` : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-primary-foreground/70">
          © 2026 EL MADINA · Sfax
        </p>
      </div>
    </div>
  );
}
