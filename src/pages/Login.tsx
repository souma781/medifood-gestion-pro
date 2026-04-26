import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/store/auth";
import { Logo } from "@/components/medifood/Logo";

export default function Login() {
  const [email, setEmail] = useState("admin@medifood.tn");
  const [password, setPassword] = useState("admin");
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      login(email);
      navigate("/dashboard");
    }, 700);
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
                Plateforme de gestion MEDIFOOD Tunisie
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
            <p className="mt-6 text-center text-xs text-muted-foreground">
              Démo — n'importe quels identifiants fonctionnent
            </p>
          </CardContent>
        </Card>
        <p className="mt-6 text-center text-xs text-primary-foreground/70">
          © 2026 MEDIFOOD Tunisie · Sfax
        </p>
      </div>
    </div>
  );
}