/**
 * Karate Club - Domínio Central: Enums
 * Representa os papéis, faixas, estados e modalidades oficiais da plataforma.
 */

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  SENSEI = 'sensei',
  STUDENT = 'student',
}

export enum StudentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum KarateBelt {
  WHITE = 'branca',
  YELLOW = 'amarela',
  RED = 'vermelha',
  ORANGE = 'laranja',
  GREEN = 'verde',
  PURPLE = 'roxa',
  BROWN = 'marrom',
  BLACK_1DAN = 'preta_1dan',
  BLACK_2DAN = 'preta_2dan',
  BLACK_3DAN = 'preta_3dan',
  BLACK_SUPERIOR = 'preta_superior',
}

export enum TuitionStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
}

export enum PaymentMethod {
  PIX = 'pix',
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
}

export enum CompetitionModality {
  KATA_INDIVIDUAL = 'kata_individual',
  KUMITE_INDIVIDUAL = 'kumite_individual',
  KATA_TEAM = 'kata_team',
  KUMITE_TEAM = 'kumite_team',
}

export enum CompetitionPlacement {
  GOLD = 'gold',
  SILVER = 'silver',
  BRONZE = 'bronze',
  PARTICIPANT = 'participant',
  NONE = 'none',
}

export enum CalendarEventType {
  BELT_EXAM = 'belt_exam',
  CHAMPIONSHIP = 'championship',
  SEMINAR = 'seminar',
  SPECIAL_CLASS = 'special_class',
  EXTRA_TRAINING = 'extra_training',
  MEETING = 'meeting',
  HOLIDAY = 'holiday',
  INTERNAL_EVENT = 'internal_event',
}
