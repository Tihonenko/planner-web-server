import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsDateRangeValid(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isDateRangeValid',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const dto = args.object as any;
          const dateTimeStart = dto.dateTimeStart;
          const dateTimeEnd = dto.dateTimeEnd;

          if (!dateTimeStart || !dateTimeEnd) {
            return true;
          }

          const startDate = new Date(dateTimeStart);
          const endDate = new Date(dateTimeEnd);

          return endDate >= startDate;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Date range is invalid';
        },
      },
    });
  };
}
