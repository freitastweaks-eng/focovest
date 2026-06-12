import { useCommunityFileUrl } from "@/lib/storage-url";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  avatar: string | null | undefined;
  name?: string | null;
  className?: string;
};

function isImageAvatar(value: string) {
  return /^https?:\/\//i.test(value) || value.includes("/");
}

export function UserAvatar({ avatar, name, className }: UserAvatarProps) {
  const signedUrl = useCommunityFileUrl(avatar);
  const value = avatar?.trim();
  const label = name?.trim() || "Usuario";

  if (value && isImageAvatar(value)) {
    return (
      <img
        src={value.startsWith("http") ? value : signedUrl || ""}
        alt={`Avatar de ${label}`}
        className={cn("size-10 rounded-full border border-border object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex size-10 items-center justify-center rounded-full border border-border bg-secondary text-xl",
        className,
      )}
      aria-label={`Avatar de ${label}`}
    >
      {value || "🎯"}
    </span>
  );
}
