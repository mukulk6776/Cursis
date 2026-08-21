import Image from "next/image";

type DataoraLogoProps = {
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  tone?: "light" | "dark";
  priority?: boolean;
  className?: string;
};

const assets = {
  icon: "/brand/cursis-logo.png",
} as const;

const dimensions = {
  icon: {
    sm: { width: 78, height: 43 },
    md: { width: 96, height: 52 },
    lg: { width: 120, height: 65 },
  },
} as const;

export function DataoraLogo({ variant = "full", size = "md", tone = "light", priority = false, className = "" }: DataoraLogoProps) {
  const { width, height } = dimensions.icon[size];
  if (variant === "full") {
    const textSize = size === "sm" ? "text-lg" : size === "lg" ? "text-3xl" : "text-2xl";
    return <span className={`inline-flex items-center gap-1.5 ${className}`}><Image src={assets.icon} alt="Cursis icon" width={width} height={height} priority={priority} sizes={`${width}px`} style={{ width, height }} className="object-contain" /><span className={`font-semibold tracking-tight ${textSize} ${tone === "dark" ? "text-white" : "text-slate-950"}`}>Cursis</span></span>;
  }

  return (
    <Image
      src={assets.icon}
      alt="Cursis icon"
      width={width}
      height={height}
      priority={priority}
      sizes={`${width}px`}
      style={{ width, height }}
      className={`object-contain ${className}`}
    />
  );
}
