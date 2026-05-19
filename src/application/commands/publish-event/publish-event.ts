import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IEventRepository } from '../../../domain/repositories/event.repository';

// Command
export class PublishEventCommand {
  constructor(
    public readonly eventId: string,
  ) {}
}

// Handler
@CommandHandler(PublishEventCommand)
export class PublishEventHandler implements ICommandHandler<PublishEventCommand> {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(command: PublishEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);

    if (!event) {
      throw new Error(`Event with ID ${command.eventId} not found.`);
    }

    event.publish();

    await this.eventRepository.save(event);
  }
}
