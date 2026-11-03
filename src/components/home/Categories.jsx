import Image from "next/image";
import Link from "next/link";
import { Baby, BookOpen, FlaskConical, Landmark, LayoutGrid, Library } from "lucide-react";

const categories = [
  { name: "Fiction", Icon: BookOpen, alt: "A collection of fiction books" },
  { name: "Science", Icon: FlaskConical, alt: "Glassware in a science laboratory" },
  { name: "History", Icon: Landmark, alt: "The ancient Colosseum in Rome" },
  { name: "Kids", Icon: Baby, alt: "A cuddly teddy bear for young readers" },
  { name: "Others", Icon: Library, alt: "An inviting collection of books" },
];

export default function Categories() {
  return <section className="categories home-section" aria-labelledby="categories-title"><h2 id="categories-title" className="section-title"><LayoutGrid aria-hidden="true" />Top Categories</h2><p className="section-subtitle">Explore books by your favorite categories</p><div className="categories-grid">{categories.map(({ name, Icon, alt }) => <Link key={name} href={`/books?category=${name}`} className="category-card"><Image src={`/assets/home/category-${name.toLowerCase()}.jpg`} alt={alt} fill sizes="(max-width: 600px) 45vw, (max-width: 1000px) 30vw, 19vw" /><span><Icon aria-hidden="true" />{name}</span></Link>)}</div></section>;
}
