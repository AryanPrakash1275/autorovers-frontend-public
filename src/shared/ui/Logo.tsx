type LogoProps = {
  size?: "sm" | "md" | "lg";
};

export function Logo({ size = "md" }: LogoProps) {
  return (
    <div className={`logo logo--${size}`} aria-label="Autorovers logo">
      <span className="logo-main">Auto</span>
      <span className="logo-accent">rovers</span>
    </div>
  );
}
