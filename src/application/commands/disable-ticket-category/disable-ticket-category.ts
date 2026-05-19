import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IEventRepository } from '../../../domain/repositories/event.repository';

// Command
export class DisableTicketCategoryCommand {
  constructor(
    public readonly eventId: string,
    public readonly ticketCategoryId: string,
  ) {}
}

// Handler
@CommandHandler(DisableTicketCategoryCommand)
export class DisableTicketCategoryHandler implements ICommandHandler<DisableTicketCategoryCommand> {
  constructor(private readonly eventRepository: IEventRepository) {}

  async execute(command: DisableTicketCategoryCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);

    if (!event) {
      throw new Error(`Event with ID ${command.eventId} not found.`);
    }

    const category = event.getTicketCategories().find(
      (cat) => cat.id === command.ticketCategoryId,
    );

    if (!category) {
      throw new Error(`Ticket category with ID ${command.ticketCategoryId} not found.`);
    }

    category.disable();

    await this.eventRepository.save(event);
  }
}
