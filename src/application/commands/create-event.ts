import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { Event } from '../../domain/aggregates/event/event.aggregate';
import { randomUUID } from 'crypto';

// Command
export class CreateEventCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly location: string,
    public readonly maxCapacity: number,
    public readonly organizerId: string,
  ) { }
}

// Handler
@CommandHandler(CreateEventCommand)
export class CreateEventHandler implements ICommandHandler<CreateEventCommand> {
  constructor(private readonly eventRepository: IEventRepository) { }

  async execute(command: CreateEventCommand): Promise<string> {
    const eventId = randomUUID();

    const event = new Event(
      command.name,
      command.description,
      command.startDate,
      command.endDate,
      command.location,
      command.maxCapacity,
      eventId,
      command.organizerId,
    );

    await this.eventRepository.save(event);

    return eventId;
  }
}
