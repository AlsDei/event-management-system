import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { IEventRepository } from '../../domain/repositories/event.repository';
import { TicketCategory } from '../../domain/entities/ticket-category.entity';
import { PriceCategory } from '../../domain/value-objects/price-category.vo';
import { Money } from '../../domain/value-objects/money.vo';
import { Quota } from '../../domain/value-objects/quota.vo';
import { Capacity } from '../../domain/value-objects/capacity.vo';
import { SalesPeriod } from '../../domain/value-objects/salesperiod.vo';
import { EventSchedule } from '../../domain/value-objects/event-schedule.vo';
import { randomUUID } from 'crypto';

// Command
export class CreateTicketCategoryCommand {
  constructor(
    public readonly eventId: string,
    public readonly name: string,
    public readonly price: number,
    public readonly currency: string,
    public readonly quota: number,
    public readonly salesStartDate: Date,
    public readonly salesEndDate: Date,
  ) { }
}

// Handler
@CommandHandler(CreateTicketCategoryCommand)
export class CreateTicketCategoryHandler implements ICommandHandler<CreateTicketCategoryCommand> {
  constructor(private readonly eventRepository: IEventRepository) { }

  async execute(command: CreateTicketCategoryCommand): Promise<string> {
    const event = await this.eventRepository.findById(command.eventId);

    if (!event) {
      throw new Error(`Event with ID ${command.eventId} not found.`);
    }

    const categoryId = randomUUID();

    const price = new PriceCategory(new Money(command.price, command.currency));
    const quota = new Quota(new Capacity(command.quota));
    const salesSchedule = new EventSchedule(command.salesStartDate, command.salesEndDate);
    const salesPeriod = new SalesPeriod(salesSchedule);

    const category = new TicketCategory(
      command.name,
      price,
      quota,
      salesPeriod,
      categoryId,
    );

    event.addTicketCategory(category);

    await this.eventRepository.save(event);

    return categoryId;
  }
}
