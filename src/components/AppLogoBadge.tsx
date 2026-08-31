import { Link } from "react-router-dom";
import sahpacLogo from "@/assets/sahpac-logo.png";

const AppLogoBadge = () => (
  <Link
    id="app-logo-badge"
    to="/"
    title="SAHPAC"
    aria-label="SAHPAC"
    className="no-print fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10 transition-transform hover:scale-105"
  >
    <img src={sahpacLogo} alt="SAHPAC" className="h-11 w-11 object-contain" />
  </Link>
);

export default AppLogoBadge;
