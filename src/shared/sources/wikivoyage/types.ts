export interface WikivoyagePageMetadata {
  // custom field
  fetchedAt: string;

  // fields from API
  id: number;
  key: string;
  title: string;
  latest: {
    id: number;
    timestamp: string;
  };
  license: {
    url: string;
    title: string;
  };

  // fields from API that need to be cleared out
  // eslint-disable-next-line @typescript-eslint/naming-convention
  content_model?: never;
  source?: never;
}
