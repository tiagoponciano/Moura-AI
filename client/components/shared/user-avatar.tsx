import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/format";

type UserAvatarProps = {
  name: string;
  avatarUrl?: string | null;
};

/** Rounded-square profile picture with the name's initials as fallback. */
export function UserAvatar({ name, avatarUrl }: UserAvatarProps) {
  return (
    <Avatar className="size-8 rounded-lg">
      <AvatarImage src={avatarUrl ?? undefined} alt={name} />
      <AvatarFallback className="rounded-lg">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
