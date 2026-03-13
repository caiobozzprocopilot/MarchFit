interface Props {
  className?: string;
}

export default function LogoMarchFit({ className = 'w-9 h-9' }: Props) {
  return (
    <img
      src="/logo.png"
      alt="MarchFit"
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
