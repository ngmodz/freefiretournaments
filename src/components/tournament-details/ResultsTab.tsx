import React from "react";
import { Tournament } from "@/lib/tournamentService";

interface ResultsTabProps {
  tournament: Tournament;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ tournament }) => {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Tournament Results</h2>
      <p className="text-gaming-muted">Results are not yet available for this tournament or this section is under construction.</p>
    </div>
  );
};

export default ResultsTab; 