import Image from 'next/image';
import { Quote } from 'lucide-react';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { testimonials } from '@/content/resume';

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="scroll-mt-24 py-20 md:py-28">
      <div className="wrap">
        <SectionHeading index="07" title="What others say" />

        <ul className="grid gap-4 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <Reveal as="li" key={testimonial.name} delay={index * 0.1}>
              <figure className="glass glass-hover flex h-full flex-col rounded-2xl p-7">
                <Quote className="size-6 text-lime/50" aria-hidden />

                <blockquote className="mt-4 flex-1 text-base leading-relaxed text-foreground/90">
                  {testimonial.quote}
                </blockquote>

                <figcaption className="mt-6 flex items-center gap-3 border-t border-hairline pt-5">
                  {testimonial.avatar ? (
                    <Image
                      src={testimonial.avatar}
                      alt=""
                      width={44}
                      height={44}
                      className="size-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-full border border-hairline text-lg"
                      aria-hidden
                    >
                      {testimonial.emoji}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold">{testimonial.name}</p>
                    <p className="font-mono text-[0.65rem] text-muted-foreground">
                      {testimonial.title}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
