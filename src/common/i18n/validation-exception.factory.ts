import { BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

const FIELD_LABELS: Record<string, string> = {
  title: 'Название',
  content: 'Описание',
  name: 'Имя',
  email: 'Email',
  password: 'Пароль',
  code: 'Код подтверждения',
  planText: 'Текст плана',
  priority: 'Приоритет',
  dateTimeStart: 'Дата начала',
  dateTimeEnd: 'Дата окончания',
  folderId: 'Папка',
  taskId: 'Задача',
  isDone: 'Статус выполнения',
  isShared: 'Признак общего доступа',
  isActive: 'Статус активности',
  description: 'Описание',
  location: 'Место проведения',
  startsAt: 'Дата начала',
  endsAt: 'Дата окончания',
  allDay: 'Весь день',
  participantEmails: 'Email участников',
  subtasks: 'Подзадачи',
};

function getFieldLabel(property: string): string {
  const key = property.split('.').pop() ?? property;
  return FIELD_LABELS[key] ?? key;
}

function isDefaultEnglishMessage(message: string): boolean {
  return /must be|should not|should be|each value|only be|contain only/i.test(
    message,
  );
}

function translateConstraint(
  property: string,
  constraintName: string,
  constraintValue: unknown,
): string {
  const label = getFieldLabel(property);

  if (
    typeof constraintValue === 'string' &&
    !isDefaultEnglishMessage(constraintValue)
  ) {
    return constraintValue;
  }

  switch (constraintName) {
    case 'isString':
      return `Поле «${label}» должно быть строкой`;
    case 'isEmail':
      return `Поле «${label}» должно быть корректным email`;
    case 'isNotEmpty':
      return `Поле «${label}» не может быть пустым`;
    case 'minLength':
      return `Поле «${label}» должно содержать не менее ${constraintValue} символов`;
    case 'maxLength':
      return `Поле «${label}» должно содержать не более ${constraintValue} символов`;
    case 'length':
      return `Поле «${label}» должно содержать ровно ${constraintValue} символов`;
    case 'isEnum':
      return `Поле «${label}» содержит недопустимое значение`;
    case 'isBoolean':
      return `Поле «${label}» должно быть логическим значением`;
    case 'isDateString':
      return `Поле «${label}» должно быть корректной датой`;
    case 'isArray':
      return `Поле «${label}» должно быть массивом`;
    case 'isDateRangeValid':
      return 'Дата окончания не может быть раньше даты начала';
    case 'whitelistValidation':
      return `Поле «${label}» не должно присутствовать в запросе`;
    default:
      return `Поле «${label}» не прошло проверку`;
  }
}

function flattenErrors(errors: ValidationError[], parentPath = ''): string[] {
  const messages: string[] = [];

  for (const error of errors) {
    const property = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;

    if (error.constraints) {
      for (const [constraintName, constraintValue] of Object.entries(
        error.constraints,
      )) {
        messages.push(
          translateConstraint(property, constraintName, constraintValue),
        );
      }
    }

    if (error.children?.length) {
      messages.push(...flattenErrors(error.children, property));
    }
  }

  return messages;
}

export function validationExceptionFactory(errors: ValidationError[]) {
  const messages = flattenErrors(errors);
  return new BadRequestException(messages);
}
