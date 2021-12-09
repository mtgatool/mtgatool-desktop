const wcIcon: Record<string, string> = {};
wcIcon.common = "wc-common";
wcIcon.uncommon = "wc-uncommon";
wcIcon.rare = "wc-rare";
wcIcon.mythic = "wc-mythic";

interface RaritySymbolProps {
  rarity: keyof typeof wcIcon;
  className?: string;
}

export default function RaritySymbol(props: RaritySymbolProps) {
  const { rarity, className } = props;

  return (
    <div className={`rarity-symbol ${wcIcon[rarity]} ${className ?? ""}`} />
  );
}
