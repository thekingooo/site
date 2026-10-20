import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { projects, scenes } from "@/lib/content";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  return {
    title: project ? `${project.name} — концепция` : "Проект не найден",
    description: project?.task,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) notFound();
  const scene = scenes[project.index];
  return (
    <>
      <Header home={false} />
      <main id="main" className="detail-page">
        <Link className="text-link detail-back" href="/#projects">
          <ArrowLeft size={17} /> Все пространства
        </Link>
        <div className="detail-intro">
          <p className="eyebrow">
            <span>0{project.index + 1} /</span> {project.type} ·
            ДЕМОНСТРАЦИОННАЯ КОНЦЕПЦИЯ
          </p>
          <h1>{project.name}</h1>
          <p>{scene.detail}</p>
        </div>
        <img
          className="detail-hero"
          src={scene.image}
          alt={`${project.subtitle}: архитектурная визуализация концепции`}
        />
        <div className="detail-caption">
          <span>{project.subtitle}</span>
          <span>Проектирование / Инженерия / Отделка</span>
          <span>Концепция · Не реализованный объект</span>
        </div>
        <div className="detail-story">
          {[
            ["Задача", project.task],
            ["Решение", project.solution],
            ["Результат концепции", project.result],
          ].map(([title, text]) => (
            <article key={title}>
              <h2>{title}</h2>
              <p>{text}</p>
            </article>
          ))}
        </div>
        <div className="detail-bottom">
          <h2>
            А каким будет
            <br />
            <em>ваше пространство?</em>
          </h2>
          <Link className="button button-copper" href="/#contact">
            Обсудить объект <ArrowUpRight size={20} />
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
