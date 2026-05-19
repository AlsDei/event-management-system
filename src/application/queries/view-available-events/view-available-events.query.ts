// view-available-events.query.ts
export class ViewAvailableEventsQuery {
  constructor(
    public readonly fromDate?: string,
    public readonly toDate?: string,
    public readonly location?: string,
  ) {}
}
