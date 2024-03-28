import { SearchResults } from "../../../../lspExtensions";

export interface SearchResultEntryProps {
  entry: SearchResults;
}
export const FileItem: React.FC<SearchResultEntryProps> = ({ entry }) => {
  return <>{entry.locations.length}</>;
};
