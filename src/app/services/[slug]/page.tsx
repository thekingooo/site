import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { services } from "@/lib/content";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((item) => item.id === slug);
  return {
    title: service?.name || "Услуга не найдена",
    description: service?.description,
  };
}

export default async function ServicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const index = services.findIndex((item) => item.id === slug);
  if (index < 0) notFound();
  const service = services[index];
  return (
    <>
      <Header home={false} />
      <main id="main" className="detail-page service-page">
        <Link href="/#services" className="text-link detail-back">
          <ArrowLeft size={17} /> Все услуги
        </Link>
        <div className="detail-intro">
          <p className="eyebrow">
            <span>0{index + 1} /</span> ПОЛНЫЙ ЦИКЛ РЕАЛИЗАЦИИ
          </p>
          <h1>{service.name}</h1>
          <p>{service.description}</p>
        </div>
        <img
          className="detail-hero"
          src="/images/restaurant.jpg"
          alt="Демонстрационная концепция коммерческого интерьера"
        />
        <div className="service-deliverables">
          <h2>
            От задачи.
            <br />
            <em>К решению.</em>
          </h2>
          <ul>
            {service.items.map((item, i) => (
              <li key={item}>
                <span>0{i + 1}</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="detail-bottom">
          <h2>
            Обсудим
            <br />
            <em>вашу задачу.</em>
          </h2>
          <Link className="button button-copper" href="/#contact">
            Начать проект <ArrowUpRight size={20} />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
