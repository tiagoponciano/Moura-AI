import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminUser, UserChange } from "../lib/types";

type UserActionsProps = {
  user: AdminUser;
  isSelf: boolean;
  busy: boolean;
  disabled: boolean;
  onChange: (change: UserChange) => void;
};

/** A team row's actions: role switch and Revogar when active, Reativar when without access; none on the admin's own row. */
export function UserActions({
  user,
  isSelf,
  busy,
  disabled,
  onChange,
}: UserActionsProps) {
  if (isSelf) return null;

  return (
    <div className="flex items-center justify-end gap-1">
      {busy && <Loader2 className="mr-1 size-4 animate-spin" />}
      {user.status === "approved" && (
        <>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() =>
              onChange({ role: user.role === "admin" ? "member" : "admin" })
            }
          >
            {user.role === "admin" ? "Tornar membro" : "Tornar admin"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={() => onChange({ status: "rejected" })}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            Revogar
          </Button>
        </>
      )}
      {user.status === "rejected" && (
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange({ status: "approved" })}
        >
          Reativar
        </Button>
      )}
    </div>
  );
}
