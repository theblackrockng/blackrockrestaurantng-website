import { Link } from "react-router-dom";
import { useFeatureFlags } from "../context/FeatureFlagContext";

export default function OrderNowLink({ children, className, style, ...props }) {
  const { orderingEnabled } = useFeatureFlags();

  if (!orderingEnabled) {
    return (
      <span
        className={className}
        style={{ ...style, opacity: 0.45, cursor: "not-allowed", pointerEvents: "none" }}
        aria-disabled="true"
      >
        {children}
      </span>
    );
  }

  return (
    <Link to="/order" className={className} style={style} {...props}>
      {children}
    </Link>
  );
}
