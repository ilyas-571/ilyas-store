import { Helmet } from "react-helmet-async";

export interface SEOProps {
  title?: string;
  description?: string;
  type?: string;
  name?: string;
  image?: string;
}

export function SEO({
  title,
  description = "Discover curated luxury perfumes, timepieces, and cosmetics at Ilyas Store.",
  type = "website",
  name = "Ilyas Store",
  image = "/opengraph.jpg",
}: SEOProps) {
  const pageTitle = title ? `${title} — ${name}` : `${name} — Luxury Perfumes, Watches & Cosmetics`;

  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      
      {/* OpenGraph tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      
      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content={type === "website" ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
