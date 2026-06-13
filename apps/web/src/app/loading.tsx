import { Window } from "@formos/ui";
import { StatePanel } from "@/components/state-panel";

export default function Loading() {
  return (
    <div className="center-screen">
      <div style={{ maxWidth: 440, width: "100%" }}>
        <Window title="FormOS" accent="teal" controls={false}>
          <StatePanel variant="loading" title="Booting up…">
            One moment while we fetch your workspace.
          </StatePanel>
        </Window>
      </div>
    </div>
  );
}
