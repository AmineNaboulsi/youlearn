import { cn } from "@/lib/cn";

/**
 * A 30-day enrolment trend, drawn as inline SVG on the server.
 *
 * No charting library: the shape is an area and a line over a fixed viewBox,
 * which is a handful of path arithmetic and ships zero JavaScript. The series
 * is also exposed as a table to assistive technology, because a trend line
 * with no accessible equivalent is decoration pretending to be data.
 */
export function Sparkline({
  points,
  className,
  height = 72,
  label,
}: {
  points: Array<{ date: string; count: number }>;
  className?: string;
  height?: number;
  label: string;
}) {
  if (points.length === 0) {
    return null;
  }

  const width = 600;
  const max = Math.max(1, ...points.map((p) => p.count));
  const step = points.length > 1 ? width / (points.length - 1) : width;

  // A little headroom at the top so a peak does not touch the border, and a
  // baseline inset so a run of zeroes is still a visible line rather than
  // sitting exactly on the frame.
  const top = 6;
  const bottom = height - 6;

  const y = (value: number) => bottom - (value / max) * (bottom - top);

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${(index * step).toFixed(2)} ${y(point.count).toFixed(2)}`)
    .join(" ");

  const area = `${line} L ${width} ${bottom} L 0 ${bottom} Z`;

  const peakIndex = points.reduce(
    (best, point, index) => (point.count > points[best].count ? index : best),
    0,
  );

  return (
    <figure className={cn("m-0", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[72px] w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id="sparkline-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.14" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={area} fill="url(#sparkline-fade)" className="text-ink" />
        <path
          d={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="text-ink"
          vectorEffect="non-scaling-stroke"
        />

        {max > 0 && points[peakIndex].count > 0 ? (
          <circle
            cx={(peakIndex * step).toFixed(2)}
            cy={y(points[peakIndex].count).toFixed(2)}
            r="2.5"
            className="fill-ink"
            vectorEffect="non-scaling-stroke"
          />
        ) : null}
      </svg>

      <figcaption className="sr-only">
        <table>
          <caption>{label}</caption>
          <tbody>
            {points.map((point) => (
              <tr key={point.date}>
                <th scope="row">{point.date}</th>
                <td>{point.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
