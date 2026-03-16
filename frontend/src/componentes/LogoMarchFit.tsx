export default function LogoMarchFit({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="MarchFit"
      className={`object-contain ${className}`}
    />
  );
}
