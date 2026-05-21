import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { IBookingRepository } from '../../domain/repositories/booking.repository';

// Command
export class CancelEventCommand {
  constructor(
    public readonly eventId: string,
  ) { }
}

// Handler
@CommandHandler(CancelEventCommand)
export class CancelEventHandler implements ICommandHandler<CancelEventCommand> {
  constructor(
    private readonly eventRepository: IEventRepository,
    // US 3: Paid bookings must be marked as requiring a refund when event is cancelled
    private readonly bookingRepository: IBookingRepository,
  ) { }

  async execute(command: CancelEventCommand): Promise<void> {
    const event = await this.eventRepository.findById(command.eventId);

    if (!event) {
      throw new Error(`Event with ID ${command.eventId} not found.`);
    }

    // Cancels event and disables all ticket categories (domain logic)
    event.cancel();

    await this.eventRepository.save(event);

    // US 3 AC: "Paid bookings must be marked as requiring a refund."
    const paidBookings = await this.bookingRepository.findPaidByEventId(command.eventId);
    for (const booking of paidBookings) {
      booking.markAsRequiresRefund();
      await this.bookingRepository.save(booking);
    }
  }
}
