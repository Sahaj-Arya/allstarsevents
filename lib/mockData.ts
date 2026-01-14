import { EventItem } from "./types";

export const mockEvents: EventItem[] = [
  {
    _id: "evt-salsa-sunday",
    id: "evt-salsa-sunday",
    title: "Salsa Sundays",
    description:
      "Beginner-friendly salsa social with live percussion and pro instructors.",
    price: 899,
    photo: "/images/salsa.jpg",
    date: "2026-02-02",
    time: "18:00",
    location: "All Stars Studio, Mumbai",
    type: "event",
  },
  {
    _id: "cls-hiphop",
    id: "cls-hiphop",
    title: "Hip-Hop Foundation Class",
    description: "Drills, grooves, and choreography for all levels.",
    price: 699,
    photo: "/images/hiphop.jpg",
    date: "2026-02-05",
    time: "19:30",
    location: "Khar Studio, Mumbai",
    type: "class",
  },
  {
    _id: "evt-bachata-night",
    id: "evt-bachata-night",
    title: "Bachata Night & Workshop",
    description:
      "Sensual bachata workshop followed by social dancing and DJ set.",
    price: 1199,
    photo: "/images/bachata.jpg",
    date: "2026-02-10",
    time: "20:00",
    location: "Soho House, Mumbai",
    type: "event",
  },
  {
    _id: "cls-contemporary",
    id: "cls-contemporary",
    title: "Contemporary Flow",
    description: "Floor work, lines, and musicality with guest choreographer.",
    price: 950,
    photo: "/images/contemporary.jpg",
    date: "2026-02-12",
    time: "17:00",
    location: "Bandra Studio, Mumbai",
    type: "class",
  },
];
