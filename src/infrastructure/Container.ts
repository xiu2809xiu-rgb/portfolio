import { DateTime } from 'luxon';
import { SchedulingPolicy } from '@/core/booking/config/SchedulingPolicy';
import type {
  BookingRepositoryPort,
  CalendarPort,
  ClockPort,
  NotifierPort,
} from '@/core/booking/ports';
import { AvailabilityService } from '@/core/booking/services/AvailabilityService';
import { BookingService } from '@/core/booking/services/BookingService';
import { DemoCalendarAdapter } from './calendar/DemoCalendarAdapter';
import { GoogleCalendarAdapter } from './calendar/GoogleCalendarAdapter';
import { ConsoleNotifier, ResendNotifier } from './notify/Notifiers';
import { InMemoryBookingRepository } from './persistence/InMemoryBookingRepository';
import { NeonBookingRepository } from './persistence/NeonBookingRepository';

export class SystemClock implements ClockPort {
  now(): DateTime {
    return DateTime.utc();
  }
}

export interface ContainerCapabilities {
  readonly calendar: string;
  readonly calendarLive: boolean;
  readonly repository: string;
  readonly repositoryDurable: boolean;
  readonly notifier: string;
  /** True only when every dependency is a real, production-grade one. */
  readonly fullyConfigured: boolean;
}

/**
 * Composition root.
 *
 * Every adapter resolves to a real implementation when its credentials exist and
 * a safe fallback when they do not. That is deliberate: the site deploys and the
 * booking flow stays explorable from the very first push, and each secret added
 * later upgrades one slice in place with no code change.
 *
 * Cached per server instance — building it is cheap, but the Google OAuth client
 * inside it is worth reusing across requests on a warm lambda.
 */
export class Container {
  private static instance: Container | null = null;

  readonly policy: SchedulingPolicy;
  readonly clock: ClockPort;
  readonly calendar: CalendarPort;
  readonly repository: BookingRepositoryPort;
  readonly notifier: NotifierPort;
  readonly availability: AvailabilityService;
  readonly bookings: BookingService;

  private constructor(env: NodeJS.ProcessEnv) {
    /*
      Read from the environment rather than importing `@/lib/site`: the container
      is constructed inside request handlers where VERCEL_URL is the only thing
      that knows which deployment is answering, and a preview build must build
      its approve links against itself, not against production.
    */
    const siteUrl = (
      env.NEXT_PUBLIC_SITE_URL ||
      (env.VERCEL_PROJECT_PRODUCTION_URL && `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`) ||
      (env.VERCEL_URL && `https://${env.VERCEL_URL}`) ||
      'http://localhost:3000'
    ).replace(/\/$/, '');

    this.policy = SchedulingPolicy.fromEnv(env);
    this.clock = new SystemClock();

    this.calendar = GoogleCalendarAdapter.fromEnv(env) ?? new DemoCalendarAdapter(this.policy.timezone);
    this.repository = NeonBookingRepository.fromEnv(env) ?? new InMemoryBookingRepository();
    this.notifier = ResendNotifier.fromEnv(env) ?? new ConsoleNotifier();

    this.availability = new AvailabilityService(
      this.policy,
      this.calendar,
      this.repository,
      this.clock,
    );

    this.bookings = new BookingService(
      this.policy,
      this.availability,
      this.calendar,
      this.repository,
      this.notifier,
      this.clock,
      siteUrl,
    );
  }

  static resolve(env: NodeJS.ProcessEnv = process.env): Container {
    if (!Container.instance) {
      Container.instance = new Container(env);
    }
    return Container.instance;
  }

  /** Test seam — drops the cached instance so a fresh env can be applied. */
  static reset(): void {
    Container.instance = null;
  }

  get capabilities(): ContainerCapabilities {
    return {
      calendar: this.calendar.name,
      calendarLive: this.calendar.isLive,
      repository: this.repository.name,
      repositoryDurable: this.repository.isDurable,
      notifier: this.notifier.name,
      fullyConfigured: this.calendar.isLive && this.repository.isDurable,
    };
  }
}
