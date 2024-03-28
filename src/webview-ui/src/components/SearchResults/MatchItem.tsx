import { SearchMatch } from "../../../../searchResultsTree";

export interface MatchItemProps {
  match: SearchMatch;
}
export const MatchItem: React.FC<MatchItemProps> = ({ match }) => {
  return <>{match.range}</>;
};
