export interface ReportIssue<Issue = string> {
  (issue: Issue): void;
}
