import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IEventRepository } from '../../../domain/repositories/event.repository';

// Command
export class CancelEventCommand {
  constructor(
    public readonly eventId: string,
  ) {}
}

// Handler
@CommandHandler(CancelEventCommand)
export class CancelEventHandler implements ICommandHandler<CancelEventCommand> {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(command: CancelEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);

    if (!event) {
      throw new Error(`Event with ID ${command.eventId} not found.`);
    }

    event.cancel();

    await this.eventRepository.save(event);
  }
}
