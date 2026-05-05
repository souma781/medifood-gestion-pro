import { useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Unauthorized() {
  const navigate = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Accès non autorisé</h1>
        <p className="mt-3 text-muted-foreground">
          Vous n'avez pas les droits nécessaires pour accéder à cette page.
        </p>
        <Button className="mt-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />Retour
        </Button>
      </div>
    </div>
  );
}
