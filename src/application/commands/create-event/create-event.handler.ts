// create-event.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateEventCommand } from './create-event.command';

@CommandHandler(CreateEventCommand)
export class CreateEventHandler implements ICommandHandler<CreateEventCommand> {
  async execute(command: CreateEventCommand): Promise<void> {
    // domain logic goes here in Week 9
  }
}