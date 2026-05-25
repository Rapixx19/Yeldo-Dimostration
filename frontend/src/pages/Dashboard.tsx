import { Portfolio } from './Portfolio';

// v1: Dashboard mirrors Portfolio. Spec 10 (Phase 4) adds the unique pieces
// (top stats strip + dedicated forecast surface). Keeping a separate route now
// so the nav target exists.
export function Dashboard() {
  return <Portfolio />;
}
