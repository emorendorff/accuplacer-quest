export function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <span className="stars" aria-label={`${count} of ${max} stars`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < count ? 'star on' : 'star'}>★</span>
      ))}
    </span>
  );
}
