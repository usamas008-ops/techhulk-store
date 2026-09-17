import Image from "next/image";

export type Person = { name: string; role: string; photo: string };

// Portrait cards in a sideways row, like ronin.pk's "Our Brand Ambassadors"
// and "Generation Ronin" sections.
export default function PeopleRow({
  kicker,
  title,
  people,
  size = "lg",
}: {
  kicker?: string;
  title: string;
  people: Person[];
  size?: "lg" | "md";
}) {
  if (people.length === 0) return null;

  const width =
    size === "lg"
      ? "w-[70%] sm:w-[38%] md:w-[30%] lg:w-[23%]"
      : "w-[46%] sm:w-[30%] md:w-[23%] lg:w-[18.5%]";

  return (
    <section className="container-page py-8 sm:py-10">
      <h2 className="mb-6 leading-tight">
        {kicker && (
          <span className="block text-[15px] font-medium text-charcoal/80 sm:text-[18px]">
            {kicker}
          </span>
        )}
        <span className="ronin-title">{title}</span>
      </h2>

      <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
        {people.map((person, index) => (
          <figure
            key={`${person.photo}-${index}`}
            className={`relative aspect-[3/4] shrink-0 snap-start overflow-hidden rounded-[22px] bg-[#dcdcdc] ${width}`}
          >
            <Image
              src={person.photo}
              alt=""
              fill
              sizes="(max-width: 640px) 70vw, 25vw"
              className="object-cover transition-transform duration-700 hover:scale-[1.04]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent px-4 pb-4 pt-16">
              <span className="block text-[16px] font-bold text-white sm:text-[18px]">
                {person.name}
              </span>
              <span className="text-[12px] font-semibold text-gold">{person.role}</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
